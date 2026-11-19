"""Local AI services of the city: memory (Chroma), speech-to-text (whisper.cpp server), text-to-speech (Piper),
agent tools (MCP reference servers). Each is optional; status() says what is ready and why not.
Nothing here sends data off the machine unless the configured URLs point elsewhere."""
import json, os, subprocess, tempfile
from pathlib import Path
import httpx
from .config import ROOT, settings
from . import runtimes

V = ROOT / ".venvs"
SVC = ROOT / ".services"


def _env():
    return {**os.environ, "JARVIS_LLM_BASE_URL": runtimes.llm_base_url(),
            "JARVIS_MEMORY_DIR": str(settings.data_dir / "chroma")}


# ---------------- memory (Chroma) ----------------
def memory_installed() -> bool:
    return (V / "chroma" / "bin" / "python").exists()


def memory_enabled() -> bool:
    return os.environ.get("JARVIS_MEMORY", "auto") != "off" and memory_installed()


def _memory(cmd: str, payload: dict | None = None, timeout=60) -> dict:
    p = subprocess.run([str(V / "chroma" / "bin" / "python"), str(ROOT / "integrations" / "chroma" / "memory.py"), cmd],
                       input=json.dumps(payload or {}), capture_output=True, text=True, timeout=timeout, env=_env())
    try:
        return json.loads(p.stdout.strip().splitlines()[-1])
    except Exception:  # noqa: BLE001
        return {"ok": False, "error": (p.stderr or p.stdout)[-500:]}


def memory_add(task: dict) -> dict:
    doc = f"Task: {task['prompt']}\n\nAgent: {task['agent']}\n\nResult:\n{task.get('result') or ''}"
    return _memory("add", {"id": f"task-{task['id']}", "document": doc,
                           "metadata": {"task_id": task["id"], "agent": task["agent"], "runtime": task.get("runtime") or "",
                                        "project_id": task.get("project_id") or 0}})


def memory_search(query: str, n: int = 3) -> dict:
    return _memory("search", {"query": query, "n": n})


def memory_context(query: str, n: int = 3, max_chars: int = 1500) -> str:
    """Relevant past results for a new task (empty if memory is off, empty or unreachable)."""
    if not memory_enabled():
        return ""
    r = memory_search(query, n)
    hits = [x for x in r.get("results", []) if x.get("distance", 1) < 0.6]
    if not hits:
        return ""
    text = "\n\n".join(f"[past task #{h['metadata'].get('task_id')} by {h['metadata'].get('agent')}]\n{h['document'][:600]}" for h in hits)
    return ("Relevant results of earlier city tasks (verify before relying on them):\n" + text)[:max_chars]


# ---------------- speech-to-text (whisper.cpp server) ----------------
def whisper_url() -> str:
    return os.environ.get("JARVIS_WHISPER_URL", "http://127.0.0.1:8178").rstrip("/")


def transcribe(audio: bytes, filename: str, language: str = "auto") -> dict:
    """Send recorded audio to the whisper.cpp server (/inference). The server converts webm/ogg itself (--convert)."""
    files = {"file": (filename, audio, "application/octet-stream")}
    data = {"response_format": "json", "temperature": "0.0", "language": language or "auto"}
    r = httpx.post(f"{whisper_url()}/inference", files=files, data=data, timeout=120)
    r.raise_for_status()
    return {"text": (r.json().get("text") or "").strip()}


# ---------------- text-to-speech (Piper) ----------------
def piper_voice(lang: str) -> Path | None:
    d = Path(os.environ.get("JARVIS_PIPER_VOICES", ROOT / ".services" / "piper-voices"))
    pref = {"ru": "ru_RU", "he": "he_IL", "en": "en_US"}.get((lang or "ru")[:2], "en_US")
    cands = sorted(d.glob(f"{pref}-*.onnx")) if d.exists() else []
    return cands[0] if cands else None


def piper_installed() -> bool:
    return (V / "piper" / "bin" / "piper").exists() or bool(os.environ.get("JARVIS_PIPER_BIN"))


def speak(text: str, lang: str = "ru") -> bytes:
    voice = piper_voice(lang)
    if not voice:
        raise FileNotFoundError(f"no Piper voice for '{lang}' in {os.environ.get('JARVIS_PIPER_VOICES', ROOT / '.services' / 'piper-voices')}")
    piper = os.environ.get("JARVIS_PIPER_BIN") or str(V / "piper" / "bin" / "piper")
    with tempfile.TemporaryDirectory() as td:
        out = Path(td) / "speech.wav"
        p = subprocess.run([piper, "-m", str(voice), "-f", str(out)], input=text[:1000], capture_output=True, text=True, timeout=60)
        if p.returncode != 0 or not out.exists():
            raise RuntimeError((p.stderr or "piper failed")[-400:])
        return out.read_bytes()


# ---------------- agent tools (MCP servers) ----------------
def mcp_config(project_path: str) -> dict:
    """MCP servers for an agent run, scoped to the project directory (filesystem, git, time; fetch only if enabled)."""
    node = SVC / "mcp-node" / "node_modules" / ".bin" / "mcp-server-filesystem"
    py = V / "mcp" / "bin"
    servers = {}
    if node.exists():
        servers["filesystem"] = {"command": str(node), "args": [project_path]}
    if (py / "mcp-server-git").exists():
        servers["git"] = {"command": str(py / "mcp-server-git"), "args": ["--repository", project_path]}
    if (py / "mcp-server-time").exists():
        servers["time"] = {"command": str(py / "mcp-server-time"), "args": []}
    if os.environ.get("JARVIS_MCP_FETCH") == "1" and (py / "mcp-server-fetch").exists():
        servers["fetch"] = {"command": str(py / "mcp-server-fetch"), "args": []}
    return {"mcpServers": servers}


def status() -> dict:
    def probe(url):
        try:
            return httpx.get(url, timeout=1.5).status_code < 500
        except Exception:  # noqa: BLE001
            return False
    voices = {l: (piper_voice(l).name if piper_voice(l) else None) for l in ("ru", "he", "en")}
    return {
        "memory": {"installed": memory_installed(), "enabled": memory_enabled(),
                   "embed_model": os.environ.get("JARVIS_EMBED_MODEL", "nomic-embed-text"),
                   "count": (_memory("stats").get("count") if memory_installed() else None)},
        "stt": {"url": whisper_url(), "ready": probe(whisper_url()), "built": (SVC / "whisper.cpp" / "build" / "bin" / "whisper-server").exists()},
        "tts": {"installed": piper_installed(), "voices": voices, "ready": piper_installed() and any(voices.values())},
        "mcp": {"servers": sorted(mcp_config("/tmp")["mcpServers"])},
    }
