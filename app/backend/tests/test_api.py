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
    assert lib["count_active"] == 126 and lib["commit"]
    ds = client.get("/api/districts").json()
    assert len(ds) == 11 and sum(d["count"] for d in ds) == 126
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

def test_budget_limit(client):
    assert client.put("/api/limits", json={"daily_budget_usd": 0.1}).status_code == 428
    assert client.put("/api/limits", json={"daily_budget_usd": 0.1, "confirm_password": PW}).status_code == 200
    r = client.post("/api/commands", json={"text": "сделай что-нибудь"}); assert r.status_code == 402 and "daily budget" in r.text

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
        assert wait_status(c, a["id"], {"succeeded"})["delegated"] == '["qa-expert"]'
        h = c.post("/api/commands", json={"text": "hang forever"}).json()["task"]
        wait_status(c, h["id"], {"running"}); assert c.post(f"/api/tasks/{h['id']}/cancel").json()["ok"]
        assert wait_status(c, h["id"], {"cancelled"})["status"] == "cancelled"
