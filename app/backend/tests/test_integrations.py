"""End-to-end: city API → integration worker (real library code in its own venv) → scripted OpenAI-compatible
LLM endpoint (integrations/tests/fake_llm_server.py, a test double for Ollama) → events → city states.

Skipped per runtime when its venv is missing (run scripts/setup_integrations.sh). The OpenHands test also needs a
running agent-server (scripts/run_openhands_server.sh) and JARVIS_OPENHANDS_API_KEY_ENV pointing to its key."""
import json, os, socket, subprocess, sys, time
from pathlib import Path
import pytest
from conftest import OWNER, make_client, wait_status

APP = Path(__file__).resolve().parents[2]
PW = OWNER[1]


def free_port():
    s = socket.socket(); s.bind(("127.0.0.1", 0)); p = s.getsockname()[1]; s.close(); return p


@pytest.fixture(scope="module")
def llm():
    port = free_port()
    p = subprocess.Popen([sys.executable, str(APP / "integrations" / "tests" / "fake_llm_server.py"), str(port)])
    for _ in range(50):
        try: socket.create_connection(("127.0.0.1", port), 0.2).close(); break
        except OSError: time.sleep(0.1)
    yield f"http://127.0.0.1:{port}/v1"
    p.terminate()


@pytest.fixture
def city(llm, monkeypatch):
    monkeypatch.setenv("JARVIS_LLM_BASE_URL", llm); monkeypatch.setenv("JARVIS_LLM_MODEL", "fake-model")
    monkeypatch.setenv("JARVIS_TASK_TIMEOUT", "300")
    c, main = make_client("dry")
    with c:
        c.post("/api/setup", json={"username": OWNER[0], "password": PW}); c.post("/api/login", json={"username": OWNER[0], "password": PW})
        proj = c.get("/api/projects").json()[0]["path"]
        Path(proj, "calc.py").write_text("def add(a, b):\n    return a - b\n")
        yield c


def need(rt):
    if not (APP / ".venvs" / rt / "bin" / "python").exists():
        pytest.skip(f"{rt} venv not installed")


def events(c, tid):
    return c.get(f"/api/event-log?task_id={tid}&limit=500").json()


def test_runtimes_endpoint(city):
    r = city.get("/api/runtimes").json()
    ids = {x["id"]: x for x in r["runtimes"]}
    assert set(ids) == {"claude", "dry", "ollama", "langgraph", "camel", "browser_use", "openhands", "n8n"}
    assert r["llm_local"] is True and ids["ollama"]["paid"] is False and ids["claude"]["paid"] is True
    assert ids["browser_use"]["critical"] and ids["openhands"]["critical"] and ids["n8n"]["critical"]
    assert city.post("/api/commands", json={"text": "#nosuch hi"}).status_code == 400


def test_ollama_runtime(city):
    need("ollama")
    t = city.post("/api/commands", json={"text": "#ollama @debugger найди ошибку в calc.py"}).json()["task"]
    assert t["runtime"] == "ollama"
    t = wait_status(city, t["id"], {"succeeded", "failed"}, timeout=120)
    assert t["status"] == "succeeded", t["error"]
    assert "[fake-llm]" in t["result"] and t["executor"] == "ollama" and t["cost_usd"] == 0
    ev = events(city, t["id"])
    assert {"task.started", "tool.started", "tool.completed", "task.completed"} <= {e["type"] for e in ev}


def test_langgraph_runtime_animates_specialists(city):
    need("langgraph")
    t = city.post("/api/commands", json={"text": "#langgraph найди баг в calc.py и напиши тесты"}).json()["task"]
    t = wait_status(city, t["id"], {"succeeded", "failed"}, timeout=180)
    assert t["status"] == "succeeded", t["error"]
    delegated = json.loads(t["delegated"])
    assert "debugger" in delegated and "test-automator" in delegated           # chosen by the library router inside the graph
    ev = events(city, t["id"])
    started = [e["agent"] for e in ev if e["type"] == "agent.started"]; stopped = [e["agent"] for e in ev if e["type"] == "agent.stopped"]
    assert started == delegated and sorted(stopped) == sorted(delegated)
    assert city.get("/api/agent-states").json()["states"]["debugger"]["state"] == "completed"


def test_camel_runtime(city):
    need("camel")
    t = city.post("/api/commands", json={"text": "#camel @debugger проверь calc.py"}).json()["task"]
    t = wait_status(city, t["id"], {"succeeded", "failed"}, timeout=240)
    assert t["status"] == "succeeded", t["error"]
    assert "debugger" in json.loads(t["delegated"])


def test_browser_use_runtime_requires_confirmation_and_runs_chromium(city):
    need("browser_use")
    r = city.post("/api/commands", json={"text": "#browser_use @ui-ux-tester open the test page and report its title"})
    assert r.status_code == 428                                                 # acts on the web → owner confirmation
    t = city.post("/api/commands", json={"text": "#browser_use @ui-ux-tester open the test page and report its title",
                                         "confirm_password": PW}).json()["task"]
    t = wait_status(city, t["id"], {"succeeded", "failed"}, timeout=300)
    assert t["status"] == "succeeded", t["error"]
    assert "JARVIS test page 42" in t["result"]                                 # title read by a real local Chromium


def test_openhands_runtime(city, monkeypatch):
    need("openhands")
    url = os.environ.get("JARVIS_OPENHANDS_URL", "http://127.0.0.1:8100")
    try:
        import httpx; httpx.get(f"{url}/alive", timeout=2).raise_for_status()
    except Exception:
        pytest.skip("OpenHands agent-server is not running (scripts/run_openhands_server.sh)")
    t = city.post("/api/commands", json={"text": "#openhands @debugger read calc.py", "confirm_password": PW}).json()["task"]
    t = wait_status(city, t["id"], {"succeeded", "failed"}, timeout=300)
    assert t["status"] == "succeeded", t["error"]
    assert "return a - b" in t["result"]                                        # the agent really ran `cat calc.py` in the project
    tools = [e["data"].get("tool") for e in events(city, t["id"]) if e["type"] == "tool.started"]
    assert "openhands.terminal" in tools and "openhands.finish" in tools
