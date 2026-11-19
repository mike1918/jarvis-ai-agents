"""Runs one task through the Claude Code CLI using a library agent (claude -p --agent NAME), streaming events.

Real mode calls the paid Anthropic API through the `claude` CLI, capped by --max-budget-usd.
Dry mode makes no API call (for tests and demos) and is clearly marked as DRY RUN in results."""
import asyncio, json, os, signal, time
from dataclasses import dataclass, field
from .config import settings

@dataclass
class RunResult:
    ok: bool
    result: str = ""
    error: str | None = None
    cost_usd: float = 0.0
    session_id: str | None = None
    usage: dict = field(default_factory=dict)
    model: str | None = None
    delegated: list = field(default_factory=list)

class Run:
    """Handle for a running task; cancel() kills the whole process group."""
    def __init__(self): self.proc = None; self.cancelled = False
    def cancel(self):
        self.cancelled = True
        if self.proc and self.proc.returncode is None:
            try: os.killpg(self.proc.pid, signal.SIGTERM)
            except ProcessLookupError: pass

def build_cmd(agent, prompt, mode, budget):
    return [settings.claude_bin, "-p", "--output-format", "stream-json", "--verbose",
            "--max-budget-usd", f"{budget:.2f}",
            "--permission-mode", "acceptEdits" if mode == "write" else "default",
            "--agent", agent, "--", prompt]

def runtime_of(task):
    return task.get("runtime") or settings.executor

async def run_task(task, project_path, run: Run, on_event):
    rt = runtime_of(task)
    if rt == "dry":
        return await _dry(task, run, on_event)
    if rt != "claude":
        return await _run_worker(rt, task, project_path, run, on_event)
    cmd = build_cmd(task["agent"], task["prompt"], task["mode"], task["max_budget_usd"])
    run.proc = await asyncio.create_subprocess_exec(*cmd, cwd=project_path, stdout=asyncio.subprocess.PIPE,
                                                    stderr=asyncio.subprocess.PIPE, start_new_session=True,
                                                    stdin=asyncio.subprocess.DEVNULL, limit=16 * 1024 * 1024)
    res = RunResult(ok=False); open_calls = {}; tools_open = {}; running = {}   # running: agent -> count of live delegations
    log_path = os.path.join(project_path, ".claude", "jarvis", "logs", "agents.jsonl")
    log_pos = os.path.getsize(log_path) if os.path.exists(log_path) else 0
    async def finish(agent, is_error=False, source=None):
        if running.get(agent):
            running[agent] -= 1
            await on_event("delegate.finish", {"agent": agent, "is_error": is_error, **({"source": source} if source else {})})
    async def tail_guard_log():
        """Background subagents report completion through the library's guard hook journal (SubagentStop)."""
        nonlocal log_pos
        while True:
            await asyncio.sleep(0.5)
            if not os.path.exists(log_path): continue
            with open(log_path, encoding="utf-8") as f:
                f.seek(log_pos); lines = f.readlines(); log_pos = f.tell()
            for line in lines:
                try: ev = json.loads(line)
                except Exception: continue
                if ev.get("event") == "finish" and ev.get("session") == res.session_id:
                    await finish(ev.get("agent_type"), source="guard-hook-journal")
    async def read():
        async for raw in run.proc.stdout:
            try: ev = json.loads(raw)
            except Exception: continue
            t = ev.get("type")
            if t == "system" and ev.get("subtype") == "init":
                res.session_id = ev.get("session_id"); res.model = ev.get("model")
                await on_event("session", {"session_id": res.session_id, "model": res.model})
            elif t == "assistant":
                for c in (ev.get("message") or {}).get("content") or []:
                    if c.get("type") == "tool_use":
                        inp = c.get("input") or {}
                        if c.get("name") in ("Agent", "Task"):
                            sub = inp.get("subagent_type") or "general-purpose"
                            open_calls[c.get("id")] = sub; res.delegated.append(sub); running[sub] = running.get(sub, 0) + 1
                            await on_event("delegate.start", {"agent": sub, "description": inp.get("description"), "background": bool(inp.get("run_in_background"))})
                        else:
                            tools_open[c.get("id")] = c.get("name")
                            await on_event("tool", {"name": c.get("name"), "id": c.get("id"),
                                                    "file": inp.get("file_path") or inp.get("notebook_path") or inp.get("path")})
                    elif c.get("type") == "text" and c.get("text", "").strip():
                        await on_event("text", {"text": c["text"][:400]})
            elif t == "user":
                for c in (ev.get("message") or {}).get("content") or []:
                    if isinstance(c, dict) and c.get("type") == "tool_result" and c.get("tool_use_id") in tools_open:
                        await on_event("tool.done", {"name": tools_open.pop(c["tool_use_id"]), "id": c["tool_use_id"], "is_error": bool(c.get("is_error"))})
                    if isinstance(c, dict) and c.get("type") == "tool_result" and c.get("tool_use_id") in open_calls:
                        agent = open_calls.pop(c["tool_use_id"])
                        body = json.dumps(c.get("content"), ensure_ascii=False)
                        if c.get("is_error") or not ("async_launched" in body or "background" in body.lower()):
                            await finish(agent, bool(c.get("is_error")))   # foreground: the result means it finished
            elif t == "result":
                res.ok = not ev.get("is_error"); res.result = ev.get("result") or ""
                res.cost_usd = float(ev.get("total_cost_usd") or 0); res.usage = ev.get("usage") or {}
                res.session_id = ev.get("session_id") or res.session_id
                if ev.get("is_error"): res.error = ev.get("subtype") or "error"
    tailer = asyncio.create_task(tail_guard_log())
    try:
        await asyncio.wait_for(asyncio.gather(read(), run.proc.wait()), timeout=settings.task_timeout_s)
    except asyncio.TimeoutError:
        run.cancel(); res.ok = False; res.error = f"timeout after {settings.task_timeout_s}s"
    finally:
        tailer.cancel()
        for agent, n in list(running.items()):
            for _ in range(n): await finish(agent)   # run is over: nothing can still be working for it
    err = (await run.proc.stderr.read()).decode(errors="replace")[-2000:] if run.proc.stderr else ""
    if run.cancelled and not res.error: res.ok = False; res.error = "cancelled"
    if not res.ok and not res.error: res.error = err.strip() or f"exit code {run.proc.returncode}"
    return res

async def _dry(task, run, on_event):
    await on_event("session", {"session_id": f"dry-{task['id']}", "model": "dry-run"})
    for _ in range(int(float(os.environ.get("JARVIS_DRY_SECONDS", "2")) * 10)):
        if run.cancelled: return RunResult(ok=False, error="cancelled")
        await asyncio.sleep(0.1)
    if task["prompt"].strip().lower().startswith("fail"):
        return RunResult(ok=False, error="DRY RUN: simulated failure")
    return RunResult(ok=True, result=f"[DRY RUN — no API call] agent '{task['agent']}' accepted: {task['prompt'][:200]}",
                     session_id=f"dry-{task['id']}", model="dry-run")


async def _run_worker(rt, task, project_path, run: Run, on_event):
    """Integration worker (integrations/<name>/worker.py in its own venv): JSON task on stdin, JSON-line events on stdout."""
    from . import runtimes
    if not runtimes.installed(rt):
        return RunResult(ok=False, error=f"runtime '{rt}' is not installed (scripts/setup_integrations.sh {runtimes.RUNTIMES[rt].worker})")
    payload = {"task_id": task["id"], "agent": task["agent"], "prompt": task["prompt"], "mode": task["mode"],
               "budget_usd": task["max_budget_usd"], "project_path": project_path, "library_dir": str(settings.library_dir),
               "settings": runtimes.task_settings()}
    env = {**os.environ, "ANONYMIZED_TELEMETRY": "false", "BROWSER_USE_AUTO_LOGIN": "false", "PYTHONUNBUFFERED": "1",
           "OPENHANDS_SUPPRESS_BANNER": "1"}
    run.proc = await asyncio.create_subprocess_exec(*runtimes.worker_cmd(rt), cwd=project_path, stdin=asyncio.subprocess.PIPE,
                                                    stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
                                                    start_new_session=True, env=env, limit=16 * 1024 * 1024)
    run.proc.stdin.write(json.dumps(payload).encode()); await run.proc.stdin.drain(); run.proc.stdin.close()
    res = RunResult(ok=False)
    async def read():
        async for raw in run.proc.stdout:
            try: ev = json.loads(raw)
            except Exception: continue
            t = ev.pop("type", None)
            if t == "result":
                res.ok = bool(ev.get("ok")); res.result = ev.get("result") or ""; res.error = ev.get("error")
                res.cost_usd = float(ev.get("cost_usd") or 0); res.usage = ev.get("usage") or {}
            elif t == "session":
                res.session_id = ev.get("session_id"); res.model = ev.get("model"); await on_event("session", ev)
            elif t == "delegate.start":
                res.delegated.append(ev.get("agent")); await on_event("delegate.start", ev)
            elif t in ("delegate.finish", "tool", "tool.done", "text"):
                await on_event(t, ev)
    async def drain_err():
        return (await run.proc.stderr.read()).decode(errors="replace")[-3000:]
    err_task = asyncio.create_task(drain_err())
    try:
        await asyncio.wait_for(asyncio.gather(read(), run.proc.wait()), timeout=settings.task_timeout_s)
    except asyncio.TimeoutError:
        run.cancel(); res.ok = False; res.error = f"timeout after {settings.task_timeout_s}s"
    err = await err_task
    if run.cancelled: res.ok = False; res.error = "cancelled"
    if not res.ok and not res.error: res.error = err.strip()[-1500:] or f"worker exit code {run.proc.returncode}"
    return res
