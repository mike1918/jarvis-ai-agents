import os, sys, tempfile, time, importlib, pytest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))
OWNER = ("owner", "correct-horse-battery")

def make_client(executor="dry", claude_bin=None):
    tmp = tempfile.mkdtemp()
    os.environ.update(JARVIS_DATA_DIR=f"{tmp}/data", JARVIS_WORKSPACE_DIR=f"{tmp}/ws", JARVIS_EXECUTOR=executor, JARVIS_DRY_SECONDS="0.5")
    if claude_bin: os.environ["JARVIS_CLAUDE_BIN"] = claude_bin
    for m in [m for m in list(sys.modules) if m.startswith("app")]: del sys.modules[m]
    from fastapi.testclient import TestClient
    import app.main as main
    return TestClient(main.app), main

def wait_status(c, tid, statuses, timeout=15):
    t0 = time.time()
    while time.time() - t0 < timeout:
        t = c.get(f"/api/tasks/{tid}").json()
        if t["status"] in statuses: return t
        time.sleep(0.1)
    raise AssertionError(f"task {tid} stuck in {t['status']}")

@pytest.fixture
def client():
    c, main = make_client()
    with c:
        assert c.post("/api/setup", json={"username": OWNER[0], "password": OWNER[1]}).status_code == 200
        assert c.post("/api/login", json={"username": OWNER[0], "password": OWNER[1]}).status_code == 200
        yield c
