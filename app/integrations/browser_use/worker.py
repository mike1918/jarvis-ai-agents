"""browser-use runtime: the agent drives a LOCAL Chromium (never Browser Use Cloud) with a model on an
OpenAI-compatible endpoint (Ollama by default). Acts on the web → the city requires owner confirmation.

Telemetry is disabled (ANONYMIZED_TELEMETRY=false) and cloud login is off (BROWSER_USE_AUTO_LOGIN=false).
"""
import asyncio, glob, os, sys, time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "common"))
from protocol import task_prompt, agent_definition, emit, finish, llm_settings, run   # noqa: E402

os.environ.setdefault("ANONYMIZED_TELEMETRY", "false")
os.environ.setdefault("BROWSER_USE_AUTO_LOGIN", "false")


def chromium_path(task) -> str | None:
    p = (task.get("settings") or {}).get("chromium_path")
    if p and os.path.exists(p):
        return p
    for cand in sorted(glob.glob("/opt/pw-browsers/chromium-*/chrome-linux*/chrome"), reverse=True):
        return cand
    return None  # browser-use finds an installed Chrome/Chromium itself


async def amain(task):
    from browser_use import Agent, Browser, ChatOpenAI
    base, model, key = llm_settings(task)
    a = agent_definition(task["library_dir"], task["agent"])
    emit("session", session_id=f"browser-use-{task['task_id']}-{int(time.time())}", model=f"browser-use+{model}")
    browser = Browser(local=True, headless=True, executable_path=chromium_path(task))
    agent = Agent(task_prompt(task), llm=ChatOpenAI(model=model, base_url=base, api_key=key), browser=browser,
                  extend_system_message=f"You work as the library agent '{a['name']}': {a['description']}",
                  judge=False, workspace=task.get("project_path"))
    emit("tool", name="browser", id="browser-1")
    try:
        history = await agent.run()
    finally:
        emit("tool.done", name="browser", id="browser-1", is_error=False)
    text = history.final_result() if hasattr(history, "final_result") else str(history)
    ok = bool(text) and (history.is_successful() is not False if hasattr(history, "is_successful") else True)
    emit("text", text=str(text)[:400])
    finish(ok, result=str(text or ""), cost_usd=0.0, error=None if ok else "browser-use did not report success")


def main(task):
    asyncio.run(amain(task))


if __name__ == "__main__":
    run(main)
