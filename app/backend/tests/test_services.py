"""Memory (Chroma), voice (whisper.cpp, Piper) and MCP services wired into the city.
Chroma runs for real (embedded DB) with embeddings from the scripted OpenAI-compatible endpoint (test double for Ollama).
The whisper.cpp test needs a running whisper-server (JARVIS_WHISPER_URL); Piper uses a CLI test double because voice
models cannot be downloaded here."""
import os, socket, subprocess, sys, time
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
def city(llm, monkeypatch, tmp_path):
    monkeypatch.setenv("JARVIS_LLM_BASE_URL", llm); monkeypatch.setenv("JARVIS_LLM_MODEL", "fake-model")
    c, main = make_client("dry", memory=True)
    with c:
        c.post("/api/setup", json={"username": OWNER[0], "password": PW}); c.post("/api/login", json={"username": OWNER[0], "password": PW})
        yield c


def need(path, why):
    if not Path(path).exists(): pytest.skip(why)


def test_memory_saves_results_and_feeds_context(city):
    need(APP / ".venvs" / "chroma" / "bin" / "python", "chroma not installed"); need(APP / ".venvs" / "ollama" / "bin" / "python", "ollama worker not installed")
    t1 = city.post("/api/commands", json={"text": "#ollama @debugger find the bug in calc.py add function"}).json()["task"]
    wait_status(city, t1["id"], {"succeeded"}, timeout=120)
    for _ in range(60):                                                       # saved asynchronously after success
        if any("memory: result saved" in e["data"] for e in city.get(f"/api/tasks/{t1['id']}").json()["events"]): break
        time.sleep(0.5)
    hits = city.get("/api/memory/search?q=bug in calc.py add function").json()
    assert hits and hits[0]["metadata"]["task_id"] == t1["id"] and hits[0]["metadata"]["agent"] == "debugger"
    t2 = city.post("/api/commands", json={"text": "#ollama @debugger the add function in calc.py still has a bug"}).json()["task"]
    t2 = wait_status(city, t2["id"], {"succeeded"}, timeout=120)
    assert any("earlier result(s) added as context" in e["data"] for e in t2["events"])
    d = city.get(f"/api/tasks/{t1['id']}").json()
    assert d["status"] == "succeeded"


def test_dry_results_are_not_remembered(city):
    need(APP / ".venvs" / "chroma" / "bin" / "python", "chroma not installed")
    t = city.post("/api/commands", json={"text": "#dry unique-dry-marker task"}).json()["task"]
    t = wait_status(city, t["id"], {"succeeded"}, timeout=30); time.sleep(1)
    assert not any("memory" in e["data"] for e in t["events"])


def test_piper_speak(city, monkeypatch, tmp_path):
    assert city.post("/api/voice/speak", json={"text": "Привет"}).status_code in (503,)          # no voice installed
    (tmp_path / "ru_RU-test-medium.onnx").write_bytes(b"x")
    monkeypatch.setenv("JARVIS_PIPER_VOICES", str(tmp_path)); monkeypatch.setenv("JARVIS_PIPER_BIN", str(APP / "integrations" / "tests" / "fake_piper.py"))
    r = city.post("/api/voice/speak", json={"text": "Привет, я JARVIS", "lang": "ru"})
    assert r.status_code == 200 and r.headers["content-type"] == "audio/wav" and r.content[:4] == b"RIFF"


def test_whisper_transcribe(city):
    url = os.environ.get("JARVIS_WHISPER_URL", "http://127.0.0.1:8178")
    try:
        import httpx; httpx.get(url, timeout=1.5)
    except Exception:
        pytest.skip("whisper.cpp server is not running")
    audio = subprocess.run(["ffmpeg", "-loglevel", "error", "-f", "lavfi", "-i", "sine=frequency=440:duration=1", "-c:a", "libopus", "-f", "webm", "-"],
                           capture_output=True).stdout
    r = city.post("/api/voice/transcribe?lang=ru", content=audio, headers={"Content-Type": "audio/webm"})
    assert r.status_code == 200 and "text" in r.json()
    assert any(a["action"] == "voice.transcribe" for a in city.get("/api/audit").json())


def test_mcp_config_scoped_to_project(city):
    from app.services import mcp_config
    cfg = mcp_config("/some/project")["mcpServers"]
    if not cfg: pytest.skip("MCP servers not installed")
    assert cfg["filesystem"]["args"] == ["/some/project"] and cfg["git"]["args"] == ["--repository", "/some/project"]
    assert "fetch" not in cfg                                                  # network fetch is opt-in (JARVIS_MCP_FETCH=1)
    s = city.get("/api/services").json()
    assert set(s) == {"memory", "stt", "tts", "mcp"} and "filesystem" in s["mcp"]["servers"]
