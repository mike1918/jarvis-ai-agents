"""Unified event layer between the agent system and the city.

Every internal engine event is normalised to the public vocabulary
(task.created, task.assigned, task.started, task.progress, task.waiting, task.failed, task.completed,
 agent.started, agent.stopped, agent.status_changed, tool.started, tool.completed, tool.failed,
 approval.requested, approval.resolved, budget.threshold_reached),
stored in the `events` table (so the city can restore state after reload) and pushed over SSE.

`source` says where the fact came from; `verified` is false for anything that did not come from a real run
(dry-run executor), so the UI can never present simulated work as real work.
"""
import json, time
from . import db, events
from .config import settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY, ts REAL NOT NULL, type TEXT NOT NULL, agent TEXT, task_id INTEGER,
  project_id INTEGER, status TEXT, data TEXT, source TEXT NOT NULL, verified INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS events_task ON events(task_id);
CREATE INDEX IF NOT EXISTS events_agent ON events(agent);
"""
_ready = False

def _ensure():
    global _ready
    if not _ready:
        db.connect().executescript(SCHEMA); _ready = True

def emit(type_, *, agent=None, task_id=None, project_id=None, status=None, data=None, source="backend", verified=None):
    _ensure()
    if verified is None:
        verified = not (settings.executor == "dry" and source != "backend")
    rec = {"ts": time.time(), "type": type_, "agent": agent, "task_id": task_id, "project_id": project_id,
           "status": status, "data": data or {}, "source": source, "verified": bool(verified)}
    rec["id"] = db.ex("INSERT INTO events(ts,type,agent,task_id,project_id,status,data,source,verified) VALUES(?,?,?,?,?,?,?,?,?)",
                      (rec["ts"], type_, agent, task_id, project_id, status, json.dumps(rec["data"], ensure_ascii=False), source, int(bool(verified))))
    events.publish("event", **rec)
    return rec

def from_engine(task, kind, data):
    """Translate one internal engine event of `task` into public events."""
    a, tid, pid = task["agent"], task["id"], task["project_id"]
    src = "dry-run" if settings.executor == "dry" else "claude-code-stream"
    if kind == "status":
        st = data.get("status")
        m = {"awaiting_approval": [("task.created", a), ("task.waiting", a), ("approval.requested", a)],
             "queued": [("task.created", a), ("task.assigned", a)],
             "running": [("task.started", a), ("agent.status_changed", a)],
             "succeeded": [("task.completed", a), ("agent.status_changed", a)],
             "failed": [("task.failed", a), ("agent.status_changed", a)],
             "cancelled": [("task.failed", a), ("agent.status_changed", a)],
             "rejected": [("approval.resolved", a), ("task.failed", a)]}.get(st, [])
        _ensure()
        if st == "queued" and db.q1("SELECT 1 FROM events WHERE task_id=? AND type='task.created'", (tid,)):
            m = [("approval.resolved", a), ("task.assigned", a)]        # approved after waiting
        for t, ag in m:
            emit(t, agent=ag, task_id=tid, project_id=pid, status=st,
                 data={k: v for k, v in data.items() if k != "status"} | ({"state": _visual(st)} if t == "agent.status_changed" else {}),
                 source="backend", verified=True)
    elif kind == "delegate.start":
        emit("agent.started", agent=data.get("agent"), task_id=tid, project_id=pid, status="working",
             data={"by": a, "description": data.get("description"), "background": data.get("background")}, source=src)
    elif kind == "delegate.finish":
        emit("agent.stopped", agent=data.get("agent"), task_id=tid, project_id=pid, status="error" if data.get("is_error") else "completed",
             data={"by": a}, source=data.get("source", src))
    elif kind == "tool":
        emit("tool.started", agent=a, task_id=tid, project_id=pid, status="running",
             data={"tool": data.get("name"), "file": data.get("file"), "tool_use_id": data.get("id")}, source=src)
    elif kind == "tool.done":
        emit("tool.failed" if data.get("is_error") else "tool.completed", agent=a, task_id=tid, project_id=pid,
             status="error" if data.get("is_error") else "ok", data={"tool": data.get("name"), "tool_use_id": data.get("id")}, source=src)
    elif kind == "text":
        emit("task.progress", agent=a, task_id=tid, project_id=pid, status="running", data={"text": data.get("text")}, source=src)
    elif kind == "session":
        emit("task.progress", agent=a, task_id=tid, project_id=pid, status="running",
             data={"session_id": data.get("session_id"), "model": data.get("model")}, source=src)

def _visual(st):
    return {"running": "working", "succeeded": "completed", "failed": "error", "cancelled": "idle"}.get(st, st)

def check_budget():
    """Emit budget.threshold_reached once per day at 80% and 100% of the daily budget."""
    lim = db.get_limits(); spent = db.spent_since(db.day_start()); day = time.strftime("%Y-%m-%d")
    for level in (0.8, 1.0):
        if lim["daily_budget_usd"] > 0 and spent >= lim["daily_budget_usd"] * level:
            key = f"budget_alert.{day}.{level}"
            if not db.q1("SELECT 1 FROM settings WHERE key=?", (key,)):
                db.ex("INSERT INTO settings(key,value) VALUES(?,?)", (key, "1"))
                emit("budget.threshold_reached", status="limit" if level == 1.0 else "warning",
                     data={"level": level, "spent_today_usd": spent, "daily_budget_usd": lim["daily_budget_usd"]}, verified=True)

def recent(after_id=0, limit=200, task_id=None, agent=None):
    _ensure()
    sql, args = "SELECT * FROM events WHERE id>?", [after_id]
    if task_id: sql += " AND task_id=?"; args.append(task_id)
    if agent: sql += " AND agent=?"; args.append(agent)
    rows = db.q(sql + " ORDER BY id DESC LIMIT ?", (*args, min(limit, 1000)))
    for r in rows: r["data"] = json.loads(r["data"] or "{}"); r["verified"] = bool(r["verified"])
    return rows[::-1]
