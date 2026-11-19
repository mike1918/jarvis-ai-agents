import time
from conftest import OWNER, make_client, wait_status

PW = OWNER[1]

def login_as(c, user, pw):
    c.cookies.clear(); r = c.post("/api/login", json={"username": user, "password": pw}); assert r.status_code == 200, r.text

def test_setup_only_once_and_auth(client):
    assert client.post("/api/setup", json={"username": "evil", "password": "x" * 12}).status_code == 409
    assert client.get("/api/me").json()["role"] == "owner"
    client.cookies.clear()
    assert client.get("/api/tasks").status_code == 401
    for _ in range(5): assert client.post("/api/login", json={"username": "owner", "password": "wrong-password"}).status_code == 401
    assert client.post("/api/login", json={"username": "owner", "password": PW}).status_code == 429   # throttled

def test_library_districts_are_real(client):
    lib = client.get("/api/library").json()
    assert lib["count_active"] >= 126 and lib["commit"]
    ds = client.get("/api/districts").json()
    assert len(ds) == 11 and sum(d["count"] for d in ds) == lib["count_active"]
    names = {a for d in ds for a in d["agents"]}
    assert "jarvis" in names and "agent-installer" not in names
    d = client.get("/api/districts/04-quality-security").json()
    assert {a["name"] for a in d["agents"]} >= {"debugger", "code-reviewer"} and all(a["state"] == "idle" for a in d["agents"])

def test_task_lifecycle_and_history(client):
    r = client.post("/api/commands", json={"text": "почини баг в API"}); assert r.status_code == 200, r.text
    t = r.json()["task"]; assert t["agent"] == "jarvis" and t["status"] == "queued" and "bugfix" in t["suggested"]
    t = wait_status(client, t["id"], {"succeeded"})
    assert "DRY RUN" in t["result"] and any(e["kind"] == "status" for e in t["events"])
    r = client.post("/api/commands", json={"text": "@sql-pro оптимизируй запрос"}); assert r.json()["task"]["agent"] == "sql-pro"
    assert client.get("/api/agents/sql-pro").json()["tasks"]

def test_validation(client):
    assert client.post("/api/commands", json={"text": "@agent-installer install stuff"}).status_code == 400
    assert client.post("/api/commands", json={"text": "@no-such-agent hi"}).status_code == 400
    assert client.post("/api/commands", json={"text": "deploy with sk-ant-api03-AAAAAAAAAAAAAAAAAAAAAA"}).status_code == 400
    assert client.post("/api/tasks", json={"prompt": "x", "budget_usd": 999}).status_code == 400

def test_roles_and_approvals(client):
    assert client.post("/api/users", json={"username": "operator1", "password": "operator-pass-1", "role": "operator"}).status_code == 428
    assert client.post("/api/users", json={"username": "operator1", "password": "operator-pass-1", "role": "operator", "confirm_password": PW}).status_code == 200
    client.post("/api/users", json={"username": "view", "password": "viewer-pass-12", "role": "viewer", "confirm_password": PW})
    login_as(client, "view", "viewer-pass-12")
    assert client.post("/api/commands", json={"text": "hello"}).status_code == 403
    assert client.get("/api/districts").status_code == 200
    login_as(client, "operator1", "operator-pass-1")
    assert client.put("/api/limits", json={"daily_budget_usd": 100, "confirm_password": "operator-pass-1"}).status_code == 403
    t = client.post("/api/commands", json={"text": "!write @python-pro поправь файл"}).json()["task"]
    assert t["status"] == "awaiting_approval" and t["mode"] == "write"
    assert client.get("/api/audit").status_code == 403
    login_as(client, *OWNER)
    ap = client.get("/api/approvals").json(); assert ap and ap[0]["task"]["id"] == t["id"]
    assert client.post(f"/api/approvals/{ap[0]['id']}", json={"approve": True}).status_code == 428
    assert client.post(f"/api/approvals/{ap[0]['id']}", json={"approve": True, "confirm_password": PW}).status_code == 200
    wait_status(client, t["id"], {"succeeded"})
    # owner's own critical task needs the password
    assert client.post("/api/commands", json={"text": "!write fix it"}).status_code == 428
    assert client.post("/api/commands", json={"text": "!write fix it", "confirm_password": PW}).json()["task"]["status"] == "queued"
    acts = {a["action"] for a in client.get("/api/audit").json()}
    assert {"setup.owner_created", "login", "user.create", "task.create", "approval.approve"} <= acts

def test_budget_limit():
    import os
    c, main = make_client("claude", os.path.join(os.path.dirname(__file__), "fake_claude.py"))
    with c:
        c.post("/api/setup", json={"username": OWNER[0], "password": PW}); c.post("/api/login", json={"username": OWNER[0], "password": PW})
        assert c.put("/api/limits", json={"daily_budget_usd": 0.1}).status_code == 428
        assert c.put("/api/limits", json={"daily_budget_usd": 0.1, "confirm_password": PW}).status_code == 200
        r = c.post("/api/commands", json={"text": "сделай что-нибудь"}); assert r.status_code == 402 and "daily budget" in r.text
        # free runtimes keep working when the paid budget is exhausted (only paid operations are blocked)
        assert c.post("/api/commands", json={"text": "#dry сделай что-нибудь"}).status_code == 200

def test_parallel_limit_and_killswitch(client, monkeypatch):
    monkeypatch.setenv("JARVIS_DRY_SECONDS", "3")
    client.put("/api/limits", json={"max_parallel_tasks": 2, "confirm_password": PW})
    ids = [client.post("/api/commands", json={"text": f"задача {i}"}).json()["task"]["id"] for i in range(4)]
    peak = 0; t0 = time.time()
    while time.time() - t0 < 1.0:
        peak = max(peak, client.get("/api/limits").json()["running"]); time.sleep(0.05)
    assert 1 <= peak <= 2
    r = client.post("/api/killswitch").json(); assert r["type"] == "stopped"
    time.sleep(0.5)
    sts = {client.get(f"/api/tasks/{i}").json()["status"] for i in ids}
    assert "running" not in sts and "cancelled" in sts and client.get("/api/limits").json()["queue_paused"]
    assert client.post("/api/resume", json={}).status_code == 428
    assert client.post("/api/resume", json={"confirm_password": PW}).status_code == 200
    monkeypatch.setenv("JARVIS_DRY_SECONDS", "0.3")
    for i in ids:
        if client.get(f"/api/tasks/{i}").json()["status"] == "queued": wait_status(client, i, {"succeeded"})

def test_failed_task_is_logged(client):
    t = client.post("/api/commands", json={"text": "fail please"}).json()["task"]
    wait_status(client, t["id"], {"failed"})
    assert client.get("/api/stats").json()["errors"][0]["task_id"] == t["id"]

def test_claude_executor_stream_parsing():
    import os
    c, main = make_client("claude", os.path.join(os.path.dirname(__file__), "fake_claude.py"))
    with c:
        c.post("/api/setup", json={"username": OWNER[0], "password": PW}); c.post("/api/login", json={"username": OWNER[0], "password": PW})
        t = c.post("/api/commands", json={"text": "проверь calc.py"}).json()["task"]
        t = wait_status(c, t["id"], {"succeeded", "failed"})
        assert t["status"] == "succeeded", t
        assert t["cost_usd"] == 0.0123 and t["session_id"] == "fake-session-1" and t["delegated"] == '["debugger"]'
        kinds = [e["kind"] for e in t["events"]]
        assert "delegate.start" in kinds and "delegate.finish" in kinds
        assert c.get("/api/limits").json()["spent_today_usd"] == 0.0123
        a = c.post("/api/commands", json={"text": "async delegation"}).json()["task"]
        wait_status(c, a["id"], {"running"}); time.sleep(0.8)
        assert c.get(f"/api/tasks/{a['id']}").json()["delegates_now"] == ["qa-expert"]      # still working after async_launched
        time.sleep(1.4)
        assert c.get(f"/api/tasks/{a['id']}").json()["delegates_now"] == []                 # finished per guard journal
        if c.get(f"/api/tasks/{a['id']}").json()["status"] == "running":
            st = c.get("/api/agent-states").json()["states"]
            assert st["qa-expert"]["state"] == "completed" and st["jarvis"]["state"] == "reviewing"
        assert wait_status(c, a["id"], {"succeeded"})["delegated"] == '["qa-expert"]'
        h = c.post("/api/commands", json={"text": "hang forever"}).json()["task"]
        wait_status(c, h["id"], {"running"}); assert c.post(f"/api/tasks/{h['id']}/cancel").json()["ok"]
        assert wait_status(c, h["id"], {"cancelled"})["status"] == "cancelled"

def test_unified_events_and_agent_states(client):
    t = client.post("/api/commands", json={"text": "@debugger найди ошибку"}).json()["task"]
    wait_status(client, t["id"], {"running"})
    st = client.get("/api/agent-states").json()
    assert st["states"]["debugger"]["state"] == "working" and st["states"]["debugger"]["task_id"] == t["id"]
    assert st["states"]["sql-pro"]["state"] == "idle" and len(st["states"]) == client.get("/api/library").json()["count_active"]
    wait_status(client, t["id"], {"succeeded"})
    assert client.get("/api/agent-states").json()["states"]["debugger"]["state"] == "completed"
    ev = client.get(f"/api/event-log?task_id={t['id']}").json()
    types = [e["type"] for e in ev]
    assert types[:2] == ["task.created", "task.assigned"] and "task.started" in types and "task.completed" in types
    assert all({"id", "ts", "agent", "task_id", "project_id", "type", "status", "data", "source", "verified"} <= set(e) for e in ev)
    # dry-run facts are never marked as verified real work; backend status facts are
    prog = [e for e in ev if e["type"] == "task.progress"]
    assert prog and all(e["source"] == "dry-run" and not e["verified"] for e in prog)
    assert all(e["verified"] for e in ev if e["source"] == "backend")
    card = client.get("/api/agents/debugger").json()
    assert card["visual"]["state"] == "completed" and card["events"]
    lim = client.get("/api/limits").json()
    assert {"reserved_usd", "expected_usd", "remaining_today_usd", "paid_blocked"} <= set(lim)

def test_approval_events_and_waiting_state(client):
    client.post("/api/users", json={"username": "operator2", "password": "operator-pass-2", "role": "operator", "confirm_password": PW})
    login_as(client, "operator2", "operator-pass-2")
    t = client.post("/api/commands", json={"text": "!write @python-pro поправь"}).json()["task"]
    assert client.get("/api/agent-states").json()["states"]["python-pro"]["state"] == "waiting"
    login_as(client, *OWNER)
    ap = client.get("/api/approvals").json()[0]
    client.post(f"/api/approvals/{ap['id']}", json={"approve": True, "confirm_password": PW})
    wait_status(client, t["id"], {"succeeded"})
    types = [e["type"] for e in client.get(f"/api/event-log?task_id={t['id']}").json()]
    assert "approval.requested" in types and "approval.resolved" in types and types.index("approval.requested") < types.index("approval.resolved")

def test_budget_threshold_event():
    import os
    c, main = make_client("claude", os.path.join(os.path.dirname(__file__), "fake_claude.py"))
    with c:
        c.post("/api/setup", json={"username": OWNER[0], "password": PW}); c.post("/api/login", json={"username": OWNER[0], "password": PW})
        c.put("/api/limits", json={"daily_budget_usd": 0.015, "confirm_password": PW})
        t = c.post("/api/tasks", json={"prompt": "проверь", "agent": "debugger", "budget_usd": 0.01}).json()
        wait_status(c, t["id"], {"succeeded"})
        ev = c.get("/api/event-log").json()
        assert any(e["type"] == "budget.threshold_reached" and e["status"] == "warning" for e in ev)
        tools = [e for e in ev if e["type"] == "tool.started"]
        assert all(e["source"] == "claude-code-stream" for e in tools)
        assert c.get("/api/limits").json()["paid_blocked"] is False
        assert c.post("/api/tasks", json={"prompt": "ещё", "agent": "debugger", "budget_usd": 0.01}).status_code == 402
