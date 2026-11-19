"""Task queue with controlled parallelism, budgets, approvals and kill switch."""
import asyncio, json, time
from . import db, events, eventlog, executor, runtimes
from .config import settings

class Engine:
    def __init__(self):
        self.runs: dict[int, executor.Run] = {}
        self.wake = asyncio.Event(); self._loop_task = None
        self.delegates: dict[int, list] = {}   # task_id -> library agents currently working for jarvis

    def start(self):
        # tasks left 'running' by a crash/restart are marked failed (their processes are gone)
        for t in db.q("SELECT id, agent FROM tasks WHERE status='running'"):
            self._finish(t["id"], "failed", error="server restarted while task was running")
        self._loop_task = asyncio.create_task(self._loop())

    async def stop(self):
        for r in self.runs.values(): r.cancel()
        if self._loop_task: self._loop_task.cancel()

    def notify(self): self.wake.set()

    def budget_check(self, budget):
        lim = db.get_limits()
        day, month = db.spent_since(db.day_start()), db.spent_since(db.month_start())
        reserved = sum(t["max_budget_usd"] for t in db.q("SELECT max_budget_usd, runtime FROM tasks WHERE status='running'")
                       if runtimes.is_paid(t["runtime"] or settings.executor))
        if day + reserved + budget > lim["daily_budget_usd"]:
            return f"daily budget: spent {day:.2f} + running {reserved:.2f} + this {budget:.2f} > {lim['daily_budget_usd']:.2f} USD"
        if month + reserved + budget > lim["monthly_budget_usd"]:
            return f"monthly budget: spent {month:.2f} + running {reserved:.2f} + this {budget:.2f} > {lim['monthly_budget_usd']:.2f} USD"
        return None

    async def _loop(self):
        while True:
            try:
                await self._tick()
            except Exception as e:
                db.ex("INSERT INTO errors(ts,kind,message) VALUES(?,?,?)", (time.time(), "engine", repr(e)[:1000]))
            try: await asyncio.wait_for(self.wake.wait(), timeout=1.0)
            except asyncio.TimeoutError: pass
            self.wake.clear()

    async def _tick(self):
        lim = db.get_limits()
        if lim["queue_paused"]: return
        free = int(lim["max_parallel_tasks"]) - len(self.runs)
        if free <= 0: return
        for t in db.q("SELECT * FROM tasks WHERE status='queued' ORDER BY priority DESC, id LIMIT ?", (free,)):
            why = self.budget_check(t["max_budget_usd"]) if runtimes.is_paid(executor.runtime_of(t)) else None   # free local runtimes keep working
            if why:
                self._finish(t["id"], "failed", error="not started: " + why); continue
            self._start(t)

    def _start(self, t):
        db.ex("UPDATE tasks SET status='running', started_at=?, executor=? WHERE id=? AND status='queued'", (time.time(), executor.runtime_of(t), t["id"]))
        self.event(t["id"], "status", {"status": "running", "agent": t["agent"]})
        run = executor.Run(); self.runs[t["id"]] = run
        asyncio.create_task(self._run(t, run))

    def event(self, task_id, kind, data):
        if kind == "delegate.start": self.delegates.setdefault(task_id, []).append(data.get("agent"))
        elif kind == "delegate.finish" and data.get("agent") in self.delegates.get(task_id, []): self.delegates[task_id].remove(data["agent"])
        elif kind == "status" and data.get("status") in ("succeeded", "failed", "cancelled", "rejected"): self.delegates.pop(task_id, None)
        db.ex("INSERT INTO task_events(task_id,ts,kind,data) VALUES(?,?,?,?)", (task_id, time.time(), kind, json.dumps(data, ensure_ascii=False)))
        events.publish("task." + kind, task_id=task_id, **data)
        task = db.q1("SELECT id, agent, project_id FROM tasks WHERE id=?", (task_id,))
        if task: eventlog.from_engine(task, kind, data)

    async def _run(self, t, run):
        proj = db.q1("SELECT path FROM projects WHERE id=?", (t["project_id"],))
        async def on_event(kind, data):
            if kind == "session": db.ex("UPDATE tasks SET session_id=? WHERE id=?", (data.get("session_id"), t["id"]))
            self.event(t["id"], kind, data)
        try:
            res = await executor.run_task(t, proj["path"], run, on_event)
        except Exception as e:
            res = executor.RunResult(ok=False, error=f"executor error: {e!r}"[:1000])
        finally:
            self.runs.pop(t["id"], None)
        u = res.usage or {}
        if res.cost_usd or executor.runtime_of(t) != "dry":
            db.ex("INSERT INTO costs(ts,task_id,agent,usd,input_tokens,output_tokens,cache_tokens,model) VALUES(?,?,?,?,?,?,?,?)",
                  (time.time(), t["id"], t["agent"], res.cost_usd, u.get("input_tokens", 0), u.get("output_tokens", 0),
                   u.get("cache_creation_input_tokens", 0) + u.get("cache_read_input_tokens", 0), res.model))
        eventlog.check_budget()
        status = "cancelled" if run.cancelled else ("succeeded" if res.ok else "failed")
        self._finish(t["id"], status, result=res.result, error=res.error, cost=res.cost_usd, session=res.session_id, delegated=res.delegated)
        self.notify()

    def _finish(self, task_id, status, result=None, error=None, cost=0.0, session=None, delegated=None):
        db.ex("UPDATE tasks SET status=?, finished_at=?, result=COALESCE(?,result), error=?, cost_usd=?, "
              "session_id=COALESCE(?,session_id), delegated=? WHERE id=?",
              (status, time.time(), result, error, cost or 0, session, json.dumps(delegated or []), task_id))
        if status == "failed":
            t = db.q1("SELECT agent FROM tasks WHERE id=?", (task_id,))
            db.ex("INSERT INTO errors(ts,task_id,agent,kind,message) VALUES(?,?,?,?,?)", (time.time(), task_id, t and t["agent"], "task", error))
        self.event(task_id, "status", {"status": status, "cost_usd": cost, "error": error})

    def cancel(self, task_id):
        t = db.q1("SELECT status FROM tasks WHERE id=?", (task_id,))
        if not t: return False
        if t["status"] == "running" and task_id in self.runs: self.runs[task_id].cancel(); return True
        if t["status"] in ("queued", "awaiting_approval"): self._finish(task_id, "cancelled"); return True
        return False

    def kill_switch(self):
        """Stop everything: pause the queue and terminate all running agent processes."""
        db.set_limit("queue_paused", True)
        n = len(self.runs)
        for r in list(self.runs.values()): r.cancel()
        events.publish("limits", queue_paused=True)
        return n

engine = Engine()
