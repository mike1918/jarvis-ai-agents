"""JARVIS AI CITY — ASHDOD 4D backend (FastAPI)."""
import asyncio, json, re, subprocess, time
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from . import auth, db, events, library
from .auth import need, current_user
from .config import settings
from .engine import engine
from .tasks import create_task, run_command

def ensure_project(name, user_id=None):
    p = db.q1("SELECT * FROM projects WHERE name=?", (name,))
    if p: return p
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{1,40}", name): raise HTTPException(400, "project name: lowercase letters, digits, '-'")
    path = (settings.workspace_dir / name).resolve()
    if settings.workspace_dir.resolve() not in path.parents: raise HTTPException(400, "bad path")
    path.mkdir(parents=True, exist_ok=True)
    if not (path / ".git").exists(): subprocess.run(["git", "init", "-q", str(path)], check=True)
    library.install_into(path)                       # library's own installer: agents + hooks + protocol
    pid = db.ex("INSERT INTO projects(name,path,created_by,created_at,agents_installed) VALUES(?,?,?,?,1)", (name, str(path), user_id, time.time()))
    return db.q1("SELECT * FROM projects WHERE id=?", (pid,))

@asynccontextmanager
async def lifespan(app):
    db.connect(); library.registry()
    ensure_project("sandbox")
    engine.start()
    yield
    await engine.stop()

app = FastAPI(title="JARVIS AI CITY — ASHDOD 4D", lifespan=lifespan)

def ip(r: Request): return r.client.host if r.client else None

@app.middleware("http")
async def security_headers(request: Request, call_next):
    resp = await call_next(request)
    resp.headers["X-Content-Type-Options"] = "nosniff"; resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["Referrer-Policy"] = "same-origin"
    resp.headers["Content-Security-Policy"] = ("default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; "
                                               "script-src 'self'; connect-src 'self'; worker-src 'self' blob:")
    return resp

# ---------- auth ----------
class Creds(BaseModel):
    username: str = Field(min_length=3, max_length=40, pattern=r"^[a-zA-Z0-9_.-]+$")
    password: str = Field(min_length=1, max_length=200)

@app.get("/api/health")
def health():
    return {"ok": True, "executor": settings.executor, "owner_exists": auth.owner_exists(), "library": library.info()}

@app.post("/api/setup")
def setup(c: Creds, request: Request):
    """First run only: create the owner account. Disabled once an owner exists."""
    if auth.owner_exists(): raise HTTPException(409, "owner already exists")
    try: uid = auth.create_user(c.username, c.password, "owner")
    except ValueError as e: raise HTTPException(400, str(e))
    db.audit({"id": uid, "username": c.username}, "setup.owner_created", ip=ip(request))
    return {"ok": True}

@app.post("/api/login")
def login(c: Creds, request: Request, response: Response):
    token, u = auth.login(c.username, c.password, ip(request))
    response.set_cookie(auth.COOKIE, token, httponly=True, samesite="strict", secure=settings.cookie_secure,
                        max_age=settings.session_hours * 3600, path="/")
    return {"username": u["username"], "role": u["role"], "perms": sorted(auth.PERMS[u["role"]])}

@app.post("/api/logout")
def logout(request: Request, response: Response, user=Depends(current_user)):
    t = request.cookies.get(auth.COOKIE)
    if t: auth.logout(t)
    response.delete_cookie(auth.COOKIE, path="/"); db.audit(user, "logout", ip=ip(request)); return {"ok": True}

@app.get("/api/me")
def me(user=Depends(current_user)): return user

class NewUser(Creds):
    role: str = Field(pattern=r"^(operator|viewer)$")
    confirm_password: str | None = None

@app.post("/api/users")
def add_user(n: NewUser, request: Request, user=Depends(need("users.manage"))):
    auth.confirm_password(user, n.confirm_password)
    try: uid = auth.create_user(n.username, n.password, n.role)
    except ValueError as e: raise HTTPException(400, str(e))
    except Exception: raise HTTPException(409, "user exists")
    db.audit(user, "user.create", n.username, {"role": n.role}, ip(request)); return {"id": uid}

@app.get("/api/users")
def users(user=Depends(need("users.manage"))):
    return db.q("SELECT id,username,role,disabled,created_at FROM users ORDER BY id")

# ---------- library / city ----------
def agent_states():
    st = {}
    for t in db.q("SELECT id,agent,status FROM tasks WHERE status IN ('running','queued','awaiting_approval')"):
        s = st.setdefault(t["agent"], {"running": 0, "queued": 0, "awaiting_approval": 0, "delegated": 0})
        s[t["status"]] += 1
    for tid, ags in engine.delegates.items():
        for a in ags: st.setdefault(a, {"running": 0, "queued": 0, "awaiting_approval": 0, "delegated": 0})["delegated"] += 1
    return st

def state_label(s):
    if not s: return "idle"
    if s["running"] or s["delegated"]: return "working"
    if s["queued"] or s["awaiting_approval"]: return "queued"
    return "idle"

@app.get("/api/library")
def lib(user=Depends(need("read"))): return library.info()

@app.get("/api/districts")
def districts(user=Depends(need("read"))):
    st = agent_states(); out = []
    for d in library.districts():
        busy = sum(1 for a in d["agents"] if state_label(st.get(a)) == "working")
        out.append({**d, "working": busy})
    return out

@app.get("/api/districts/{folder}")
def district(folder: str, user=Depends(need("read"))):
    d = next((x for x in library.districts() if x["folder"] == folder), None)
    if not d: raise HTTPException(404, "no such district")
    st = agent_states(); reg = {a["name"]: a for a in library.agents()}
    agents = []
    for name in d["agents"]:
        a = reg[name]; s = st.get(name)
        last = db.q1("SELECT id,status,prompt,finished_at,cost_usd FROM tasks WHERE agent=? ORDER BY id DESC LIMIT 1", (name,))
        stats = db.q1("SELECT COUNT(*) n, SUM(status='failed') failed, COALESCE(SUM(cost_usd),0) usd FROM tasks WHERE agent=?", (name,))
        agents.append({"name": name, "description": a["description"], "model": a["model"], "access": a["access"], "tools": a["tools"],
                       "note": a.get("note"), "state": state_label(s), "counts": s or {}, "last_task": last, "stats": stats})
    return {**{k: v for k, v in d.items() if k != "agents"}, "agents": agents}

@app.get("/api/agents/{name}")
def agent_detail(name: str, user=Depends(need("read"))):
    a = library.agent(name)
    if not a: raise HTTPException(404, "no such agent")
    return {**a, "state": state_label(agent_states().get(name)),
            "tasks": db.q("SELECT id,status,mode,prompt,created_at,finished_at,cost_usd,error FROM tasks WHERE agent=? OR delegated LIKE ? "
                          "ORDER BY id DESC LIMIT 20", (name, f'%"{name}"%'))}

@app.get("/api/route")
def route(text: str, user=Depends(need("read"))): return library.route(text)

# ---------- tasks ----------
class NewTask(BaseModel):
    prompt: str
    agent: str = "jarvis"
    mode: str = "read"
    budget_usd: float | None = None
    priority: int = 0
    project_id: int | None = None
    confirm_password: str | None = None

@app.post("/api/tasks")
def post_task(t: NewTask, request: Request, user=Depends(need("task.create"))):
    return create_task(user, prompt=t.prompt, agent=t.agent, mode=t.mode, budget=t.budget_usd, priority=t.priority,
                       project_id=t.project_id, source="api", password=t.confirm_password, ip=ip(request))

@app.get("/api/tasks")
def list_tasks(status: str | None = None, agent: str | None = None, limit: int = 50, user=Depends(need("read"))):
    sql, args = "SELECT * FROM tasks WHERE 1=1", []
    if status: sql += " AND status=?"; args.append(status)
    if agent: sql += " AND (agent=? OR delegated LIKE ?)"; args += [agent, f'%"{agent}"%']
    return db.q(sql + " ORDER BY id DESC LIMIT ?", (*args, min(limit, 500)))

@app.get("/api/tasks/{tid}")
def get_task(tid: int, user=Depends(need("read"))):
    t = db.q1("SELECT * FROM tasks WHERE id=?", (tid,))
    if not t: raise HTTPException(404, "no such task")
    t["events"] = db.q("SELECT ts,kind,data FROM task_events WHERE task_id=? ORDER BY id", (tid,))
    t["delegates_now"] = engine.delegates.get(tid, [])
    return t

@app.post("/api/tasks/{tid}/cancel")
def cancel_task(tid: int, request: Request, user=Depends(need("task.cancel_own"))):
    return run_command(user, f"/cancel {tid}", ip=ip(request))

class Cmd(BaseModel):
    text: str = Field(max_length=20000)
    source: str = Field(default="text", pattern=r"^(text|voice)$")
    confirm_password: str | None = None
    project_id: int | None = None

@app.post("/api/commands")
def command(c: Cmd, request: Request, user=Depends(need("command"))):
    return run_command(user, c.text, source=c.source, password=c.confirm_password, ip=ip(request), project_id=c.project_id)

# ---------- approvals, limits, kill switch ----------
@app.get("/api/approvals")
def approvals(status: str = "pending", user=Depends(need("read"))):
    rows = db.q("SELECT a.*, u.username requested_by_name FROM approvals a LEFT JOIN users u ON u.id=a.requested_by WHERE a.status=? ORDER BY a.id DESC", (status,))
    for r in rows:
        p = json.loads(r["payload"]); r["payload"] = p
        if "task_id" in p: r["task"] = db.q1("SELECT id,agent,mode,prompt,max_budget_usd FROM tasks WHERE id=?", (p["task_id"],))
    return rows

class Decision(BaseModel):
    approve: bool
    confirm_password: str | None = None

@app.post("/api/approvals/{aid}")
def decide(aid: int, d: Decision, request: Request, user=Depends(need("approve"))):
    auth.confirm_password(user, d.confirm_password)
    a = db.q1("SELECT * FROM approvals WHERE id=? AND status='pending'", (aid,))
    if not a: raise HTTPException(404, "no pending approval")
    tid = json.loads(a["payload"]).get("task_id")
    db.ex("UPDATE approvals SET status=?, decided_by=?, decided_at=? WHERE id=?", ("approved" if d.approve else "rejected", user["id"], time.time(), aid))
    if d.approve:
        db.ex("UPDATE tasks SET status='queued' WHERE id=? AND status='awaiting_approval'", (tid,)); engine.event(tid, "status", {"status": "queued"})
    else:
        engine._finish(tid, "rejected", error=f"rejected by {user['username']}")
    db.audit(user, "approval." + ("approve" if d.approve else "reject"), f"task:{tid}", ip=ip(request)); engine.notify()
    return {"ok": True}

@app.get("/api/limits")
def limits(user=Depends(need("read"))):
    return {**db.get_limits(), "spent_today_usd": db.spent_since(db.day_start()), "spent_month_usd": db.spent_since(db.month_start()),
            "running": len(engine.runs), "executor": settings.executor}

class Limits(BaseModel):
    max_parallel_tasks: int | None = Field(default=None, ge=1, le=8)
    default_task_budget_usd: float | None = Field(default=None, gt=0, le=20)
    approval_threshold_usd: float | None = Field(default=None, gt=0, le=50)
    hard_task_cap_usd: float | None = Field(default=None, gt=0, le=50)
    daily_budget_usd: float | None = Field(default=None, ge=0, le=1000)
    monthly_budget_usd: float | None = Field(default=None, ge=0, le=10000)
    confirm_password: str | None = None

@app.put("/api/limits")
def set_limits(l: Limits, request: Request, user=Depends(need("limits.update"))):
    auth.confirm_password(user, l.confirm_password)
    ch = {k: v for k, v in l.model_dump().items() if v is not None and k != "confirm_password"}
    old = db.get_limits()
    for k, v in ch.items(): db.set_limit(k, v)
    db.audit(user, "limits.update", detail={k: [old.get(k), v] for k, v in ch.items()}, ip=ip(request))
    events.publish("limits", **db.get_limits()); engine.notify(); return db.get_limits()

@app.post("/api/killswitch")
def killswitch(request: Request, user=Depends(need("stop"))):
    return run_command(user, "/stop", ip=ip(request))

class Confirm(BaseModel):
    confirm_password: str | None = None

@app.post("/api/resume")
def resume(c: Confirm, request: Request, user=Depends(need("resume"))):
    return run_command(user, "/resume", password=c.confirm_password, ip=ip(request))

# ---------- projects, history, stats, audit ----------
@app.get("/api/projects")
def projects(user=Depends(need("read"))): return db.q("SELECT * FROM projects ORDER BY id")

class NewProject(BaseModel):
    name: str
    confirm_password: str | None = None

@app.post("/api/projects")
def new_project(p: NewProject, request: Request, user=Depends(need("project.manage"))):
    auth.confirm_password(user, p.confirm_password)
    if db.q1("SELECT id FROM projects WHERE name=?", (p.name,)): raise HTTPException(409, "project exists")
    pr = ensure_project(p.name, user["id"]); db.audit(user, "project.create", p.name, ip=ip(request)); return pr

@app.get("/api/stats")
def stats(user=Depends(need("read"))):
    return {"by_status": db.q("SELECT status, COUNT(*) n FROM tasks GROUP BY status"),
            "cost_by_day": db.q("SELECT date(ts,'unixepoch','localtime') day, ROUND(SUM(usd),4) usd, COUNT(*) runs FROM costs GROUP BY day ORDER BY day DESC LIMIT 31"),
            "cost_by_agent": db.q("SELECT agent, ROUND(SUM(usd),4) usd, COUNT(*) runs FROM costs GROUP BY agent ORDER BY usd DESC LIMIT 20"),
            "errors": db.q("SELECT * FROM errors ORDER BY id DESC LIMIT 20")}

@app.get("/api/audit")
def audit_log(limit: int = 100, user=Depends(need("audit.read"))):
    return db.q("SELECT * FROM audit ORDER BY id DESC LIMIT ?", (min(limit, 1000),))

@app.get("/api/events")
async def sse(request: Request, user=Depends(need("read"))):
    q = events.subscribe()
    async def gen():
        try:
            yield "retry: 3000\n\n"
            while not await request.is_disconnected():
                try: msg = await asyncio.wait_for(q.get(), timeout=15)
                except asyncio.TimeoutError: yield ": ping\n\n"; continue
                yield f"data: {msg}\n\n"
        finally: events.unsubscribe(q)
    return StreamingResponse(gen(), media_type="text/event-stream", headers={"Cache-Control": "no-store", "X-Accel-Buffering": "no"})

# ---------- frontend ----------
dist = settings.frontend_dist
if (dist / "assets").exists():
    app.mount("/assets", StaticFiles(directory=dist / "assets"), name="assets")

@app.get("/{path:path}", include_in_schema=False)
def spa(path: str):
    if path.startswith("api/"): raise HTTPException(404)
    f = (dist / path).resolve()
    if path and f.is_file() and dist.resolve() in f.parents: return FileResponse(f)
    idx = dist / "index.html"
    if idx.exists(): return FileResponse(idx, headers={"Cache-Control": "no-cache"})
    return Response("Frontend is not built: cd frontend && npm install && npm run build", media_type="text/plain")
