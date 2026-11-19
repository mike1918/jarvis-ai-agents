"""Task creation rules: agent allowlist, secret check, budgets, critical-operation confirmation and approvals."""
import importlib.util, json, re, time
from fastapi import HTTPException
from . import db, library, runtimes
from .auth import PERMS, confirm_password
from .engine import engine
from .config import settings

def _secret_rx():
    p = settings.library_dir / ".claude" / "hooks" / "agent_guard.py"
    spec = importlib.util.spec_from_file_location("agent_guard", p); m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m); return m.SECRET_RX
SECRET_RX = _secret_rx()
MAX_PROMPT = 20000

def create_task(user, *, prompt, agent="jarvis", project_id=None, mode="read", budget=None, priority=0,
                source="text", password=None, ip=None, runtime=None):
    prompt = (prompt or "").strip()
    if not prompt: raise HTTPException(400, "empty task")
    if len(prompt) > MAX_PROMPT: raise HTTPException(400, f"task too long (>{MAX_PROMPT} chars); put context in a file")
    if SECRET_RX.search(prompt): raise HTTPException(400, "task contains a secret-like token; refer to an env var or file instead")
    a = library.agent(agent)
    if not a: raise HTTPException(400, f"unknown or disabled agent '{agent}'")
    if mode not in ("read", "write"): raise HTTPException(400, "mode must be read|write")
    runtime = runtime or settings.executor
    if runtime not in runtimes.RUNTIMES: raise HTTPException(400, f"unknown runtime '{runtime}' ({', '.join(runtimes.RUNTIMES)})")
    if not runtimes.installed(runtime): raise HTTPException(400, f"runtime '{runtime}' is not installed: scripts/setup_integrations.sh {runtimes.RUNTIMES[runtime].worker}")
    proj = db.q1("SELECT * FROM projects WHERE id=?", (project_id,)) if project_id else db.q1("SELECT * FROM projects ORDER BY id LIMIT 1")
    if not proj: raise HTTPException(400, "no project")
    lim = db.get_limits()
    budget = float(budget if budget is not None else lim["default_task_budget_usd"])
    if budget <= 0 or budget > lim["hard_task_cap_usd"]: raise HTTPException(400, f"budget must be in (0, {lim['hard_task_cap_usd']}] USD")
    why = engine.budget_check(budget) if runtimes.is_paid(runtime) else None
    if why: raise HTTPException(402, why)
    reasons = []
    if mode == "write": reasons.append("write mode: the agent may edit files and run commands in the project")
    if runtimes.RUNTIMES[runtime].critical: reasons.append(f"runtime {runtime} acts outside the city (browser / code execution)")
    if budget > lim["approval_threshold_usd"]: reasons.append(f"budget {budget:.2f} USD is above the approval threshold {lim['approval_threshold_usd']:.2f}")
    status = "queued"
    if reasons:
        if "task.write_mode" in PERMS[user["role"]] and "approve" in PERMS[user["role"]]:
            confirm_password(user, password)            # owner confirms explicitly
        else:
            status = "awaiting_approval"
    suggested = json.dumps(library.route(prompt), ensure_ascii=False)
    tid = db.ex("INSERT INTO tasks(project_id,agent,prompt,mode,status,priority,max_budget_usd,source,suggested,created_by,created_at,runtime) "
                "VALUES(?,?,?,?,?,?,?,?,?,?,?,?)", (proj["id"], agent, prompt, mode, status, int(priority), budget, source, suggested, user["id"], time.time(), runtime))
    if status == "awaiting_approval":
        db.ex("INSERT INTO approvals(ts,kind,payload,reason,requested_by) VALUES(?,?,?,?,?)",
              (time.time(), "task", json.dumps({"task_id": tid}), "; ".join(reasons), user["id"]))
    db.audit(user, "task.create", f"task:{tid}", {"agent": agent, "mode": mode, "runtime": runtime, "budget": budget, "status": status,
                                                  "critical": reasons, "source": source}, ip)
    engine.event(tid, "status", {"status": status, "agent": agent})
    engine.notify()
    return db.q1("SELECT * FROM tasks WHERE id=?", (tid,))

COMMAND_HELP = ("Команды: текст задачи → JARVIS (координатор); @агент текст → конкретному агенту; "
                "!write текст → с правом изменять файлы (нужно подтверждение); #ollama|#langgraph|#camel|#browser_use|#openhands текст → другой исполнитель; /status; /stop; /resume; /cancel N; /agents [район]")

def run_command(user, text, *, source="text", password=None, ip=None, project_id=None):
    """Text (and voice-transcribed) commands."""
    t = (text or "").strip()
    if not t: raise HTTPException(400, "empty command")
    low = t.lower()
    if low in ("/help", "help", "помощь"): return {"type": "help", "message": COMMAND_HELP}
    if low in ("/status", "статус"):
        lim = db.get_limits()
        return {"type": "status", "running": len(engine.runs), "queued": db.q1("SELECT COUNT(*) n FROM tasks WHERE status='queued'")["n"],
                "awaiting_approval": db.q1("SELECT COUNT(*) n FROM tasks WHERE status='awaiting_approval'")["n"],
                "spent_today_usd": db.spent_since(db.day_start()), "daily_budget_usd": lim["daily_budget_usd"], "queue_paused": lim["queue_paused"]}
    if low in ("/stop", "стоп", "остановить всё", "остановить все"):
        if "stop" not in PERMS[user["role"]]: raise HTTPException(403, "permission 'stop' required")
        n = engine.kill_switch(); db.audit(user, "killswitch", detail={"stopped_running": n, "source": source}, ip=ip)
        return {"type": "stopped", "stopped_running": n, "message": "Очередь остановлена, все процессы агентов прерваны."}
    if low in ("/resume", "продолжить"):
        if "resume" not in PERMS[user["role"]]: raise HTTPException(403, "only the owner can resume the queue")
        confirm_password(user, password)
        db.set_limit("queue_paused", False); engine.notify(); db.audit(user, "resume", ip=ip)
        return {"type": "resumed"}
    m = re.match(r"^/cancel\s+(\d+)$", low)
    if m:
        tid = int(m.group(1)); task = db.q1("SELECT created_by FROM tasks WHERE id=?", (tid,))
        if not task: raise HTTPException(404, "no such task")
        if not ("task.cancel_any" in PERMS[user["role"]] or (task["created_by"] == user["id"] and "task.cancel_own" in PERMS[user["role"]])):
            raise HTTPException(403, "cannot cancel this task")
        ok = engine.cancel(tid); db.audit(user, "task.cancel", f"task:{tid}", {"ok": ok}, ip)
        return {"type": "cancel", "task_id": tid, "ok": ok}
    m = re.match(r"^/agents(?:\s+(\S+))?$", low)
    if m:
        ds = library.districts()
        if m.group(1): ds = [d for d in ds if m.group(1) in d["folder"]]
        return {"type": "agents", "districts": [{"folder": d["folder"], "district": d["district"], "agents": d["agents"]} for d in ds]}
    if "command" not in PERMS[user["role"]]: raise HTTPException(403, "permission 'command' required")
    mode = "read"
    if low.startswith("!write "): mode, t = "write", t[7:].strip()
    runtime = None
    m = re.match(r"^#([a-z_]+)\s+(.+)$", t, re.S)          # "#ollama ...", "#langgraph ..." selects the runtime
    if m: runtime, t = m.group(1), m.group(2)
    agent = "jarvis"
    m = re.match(r"^@([a-z0-9][a-z0-9.-]*)\s+(.+)$", t, re.S)
    if m: agent, t = m.group(1), m.group(2)
    task = create_task(user, prompt=t, agent=agent, mode=mode, source=source, password=password, ip=ip, project_id=project_id, runtime=runtime)
    return {"type": "task", "task": task}
