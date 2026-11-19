"""Agent runtimes available to the city.

claude      Claude Code CLI with the library agents (paid Anthropic API, capped by --max-budget-usd)
dry         no model, for demos/tests (marked unverified in the journal)
ollama      a library agent answers with a local model through Ollama (free)          integrations/ollama
langgraph   JARVIS workflow as a LangGraph graph: plan → specialists → review          integrations/langgraph
camel       CAMEL ChatAgents: jarvis coordinator ↔ specialist dialogue                 integrations/camel
browser_use browser-use agent drives a local Chromium (acts on the web → confirmation) integrations/browser_use
openhands   OpenHands agent-server runs a coding agent in the project (executes code → confirmation)

Every integration runs as a worker process in its own virtualenv (.venvs/<name>, created by scripts/setup_integrations.sh)
because their pinned dependencies conflict. Secrets are never stored here: settings hold the *name* of the env var.
"""
import os
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse
import httpx
from .config import ROOT, settings

APP = ROOT  # app/ directory


@dataclass(frozen=True)
class Runtime:
    id: str
    label: str
    worker: str | None          # integrations/<worker>/worker.py, None = built in
    critical: bool = False      # acts outside the sandbox (web, code execution) → owner confirmation
    uses_llm_endpoint: bool = True
    service: str | None = None  # external service the runtime needs


RUNTIMES = {r.id: r for r in [
    Runtime("claude", "Claude Code", None, uses_llm_endpoint=False),
    Runtime("dry", "DRY RUN", None, uses_llm_endpoint=False),
    Runtime("ollama", "Ollama (локальная модель)", "ollama"),
    Runtime("langgraph", "LangGraph (граф JARVIS)", "langgraph"),
    Runtime("camel", "CAMEL (диалог агентов)", "camel"),
    Runtime("browser_use", "browser-use (браузер)", "browser_use", critical=True),
    Runtime("openhands", "OpenHands (кодовый агент)", "openhands", critical=True, service="openhands"),
]}


def llm_base_url() -> str:
    return os.environ.get("JARVIS_LLM_BASE_URL", "http://127.0.0.1:11434/v1").rstrip("/")


def llm_is_local() -> bool:
    return (urlparse(llm_base_url()).hostname or "") in ("127.0.0.1", "localhost", "::1")


def is_paid(rt: str) -> bool:
    """claude is paid; LLM-endpoint runtimes are free only while the endpoint is local (Ollama)."""
    r = RUNTIMES[rt]
    if rt == "claude":
        return True
    return r.uses_llm_endpoint and not llm_is_local()


def worker_cmd(rt: str) -> list[str]:
    r = RUNTIMES[rt]
    return [str(APP / ".venvs" / r.worker / "bin" / "python"), str(APP / "integrations" / r.worker / "worker.py")]


def task_settings() -> dict:
    return {
        "llm_base_url": llm_base_url(),
        "llm_model": os.environ.get("JARVIS_LLM_MODEL", "qwen2.5:7b"),
        "llm_api_key_env": os.environ.get("JARVIS_LLM_API_KEY_ENV", ""),          # name of the env var, not the key
        "openhands_url": os.environ.get("JARVIS_OPENHANDS_URL", "http://127.0.0.1:8100"),
        "openhands_api_key_env": os.environ.get("JARVIS_OPENHANDS_API_KEY_ENV", ""),
        "chromium_path": os.environ.get("JARVIS_CHROMIUM_PATH", ""),
        "max_turns": int(os.environ.get("JARVIS_MAX_TURNS", "2")),
        "max_specialists": int(os.environ.get("JARVIS_MAX_SPECIALISTS", "3")),
    }


def installed(rt: str) -> bool:
    r = RUNTIMES[rt]
    if r.worker is None:
        return True
    py, wk = worker_cmd(rt)
    return Path(py).exists() and Path(wk).exists()


def _probe(url: str, headers: dict | None = None) -> tuple[bool, str]:
    try:
        r = httpx.get(url, timeout=2.0, headers=headers or {})
        return r.status_code < 500, f"HTTP {r.status_code}"
    except Exception as e:  # noqa: BLE001
        return False, type(e).__name__


def status() -> list[dict]:
    s = task_settings()
    llm_ok, llm_msg = _probe(f"{s['llm_base_url']}/models")
    oh_ok, oh_msg = _probe(f"{s['openhands_url']}/alive")
    out = []
    for r in RUNTIMES.values():
        ready, why = installed(r.id), []
        if not ready: why.append(f"не установлен: scripts/setup_integrations.sh {r.worker}")
        if r.uses_llm_endpoint and not llm_ok: why.append(f"LLM-сервер {s['llm_base_url']} недоступен ({llm_msg})")
        if r.service == "openhands" and not oh_ok: why.append(f"OpenHands agent-server {s['openhands_url']} недоступен ({oh_msg})")
        if r.id == "claude" and settings.executor == "dry": why.append("сервер запущен в режиме DRY RUN")
        out.append({"id": r.id, "label": r.label, "installed": ready, "ready": ready and not why, "problems": why,
                    "critical": r.critical, "paid": is_paid(r.id), "llm": s["llm_model"] if r.uses_llm_endpoint else None})
    return out
