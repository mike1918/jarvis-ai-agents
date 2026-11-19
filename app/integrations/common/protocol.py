"""Worker protocol shared by all integration workers (stdlib only).

The city backend starts a worker as a separate process in its own virtualenv, writes one JSON task to stdin and reads
JSON lines from stdout — the same event shapes the Claude Code executor produces, so the city, the journal, budgets,
approvals and the kill switch work identically for every runtime.

Task (stdin):
  {"task_id", "agent", "prompt", "mode": "read"|"write", "budget_usd", "project_path", "library_dir",
   "settings": {"llm_base_url", "llm_model", "llm_api_key_env", "openhands_url", "openhands_api_key_env", "chromium_path", "max_turns"}}

Events (stdout, one JSON object per line):
  {"type":"session","session_id","model"}            {"type":"text","text"}
  {"type":"tool","name","id","file"?}                 {"type":"tool.done","name","id","is_error"}
  {"type":"delegate.start","agent","description"?}    {"type":"delegate.finish","agent","is_error"?}
  {"type":"result","ok","result","cost_usd","usage","error"?}   (exactly one, last)
"""
import json, os, re, sys, traceback

# Events own the real stdout; anything libraries print (logs, banners) goes to stderr so it cannot break the stream.
_EVENTS = sys.stdout
sys.stdout = sys.stderr

def read_task() -> dict:
    return json.loads(sys.stdin.read() or "{}")

def emit(type_: str, **data):
    _EVENTS.write(json.dumps({"type": type_, **data}, ensure_ascii=False, default=str) + "\n")
    _EVENTS.flush()

def finish(ok: bool, result: str = "", cost_usd: float = 0.0, usage: dict | None = None, error: str | None = None):
    emit("result", ok=ok, result=result, cost_usd=cost_usd, usage=usage or {}, error=error)

def agent_definition(library_dir: str, agent: str) -> dict:
    """Name, description and system prompt of a library agent (read from the registry and its .md file)."""
    reg = json.load(open(os.path.join(library_dir, ".claude", "jarvis", "registry.json"), encoding="utf-8"))
    a = next((x for x in reg["agents"] if x["name"] == agent and not x.get("disabled")), None)
    if not a:
        raise ValueError(f"unknown or disabled agent {agent!r}")
    text = open(os.path.join(library_dir, a["path"]), encoding="utf-8").read()
    body = re.sub(r"^---\r?\n.*?\r?\n---\r?\n", "", text, count=1, flags=re.S).strip()
    return {"name": a["name"], "description": a["description"], "system_prompt": body, "folder": a["folder"]}

def route(library_dir: str, text: str):
    """The library's own task router (routing.json + registry)."""
    import importlib.util
    spec = importlib.util.spec_from_file_location("jarvis_router", os.path.join(library_dir, ".claude", "jarvis", "router.py"))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m.route(text, library_dir)

def task_prompt(task: dict) -> str:
    """The task text, preceded by relevant earlier city results from memory (if the backend provided any)."""
    ctx = (task.get("context") or "").strip()
    return f"{ctx}\n\n---\n\n{task['prompt']}" if ctx else task["prompt"]

def llm_settings(task: dict):
    s = task.get("settings") or {}
    base = (s.get("llm_base_url") or "http://127.0.0.1:11434/v1").rstrip("/")
    key = os.environ.get(s.get("llm_api_key_env") or "", "") or "ollama"     # Ollama ignores the key
    return base, s.get("llm_model") or "qwen2.5:7b", key

def run(main):
    """Wraps a worker main(task): any exception becomes a failed result instead of a crash without output."""
    try:
        main(read_task())
    except Exception as e:  # noqa: BLE001
        sys.stderr.write(traceback.format_exc())
        finish(False, error=f"{type(e).__name__}: {e}"[:2000])
