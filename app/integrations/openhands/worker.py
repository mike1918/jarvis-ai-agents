"""OpenHands runtime: a coding agent runs through the OpenHands agent-server (separate service, see
scripts/run_openhands_server.sh) using the official openhands-sdk client. Works inside the city project directory.
Executes commands and edits files → the city requires owner confirmation for every task.

Model: any LiteLLM model; by default the local Ollama endpoint ("openai/<model>" on the OpenAI-compatible URL).
"""
import os, sys, time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "common"))
from protocol import task_prompt, agent_definition, emit, finish, llm_settings, run   # noqa: E402


def main(task):
    from pydantic import SecretStr
    from openhands.sdk import LLM, Conversation, Workspace
    from openhands.sdk.event import ActionEvent, MessageEvent, ObservationEvent
    from openhands.tools.preset.default import get_default_agent

    s = task.get("settings") or {}
    base, model, key = llm_settings(task)
    host = s.get("openhands_url") or "http://127.0.0.1:8100"
    api_key = os.environ.get(s.get("openhands_api_key_env") or "", "") or None
    a = agent_definition(task["library_dir"], task["agent"])

    llm = LLM(usage_id="agent", model=model if "/" in model else f"openai/{model}", base_url=base, api_key=SecretStr(key))
    agent = get_default_agent(llm=llm, cli_mode=True)
    workspace = Workspace(host=host, working_dir=task["project_path"], api_key=api_key)
    emit("session", session_id=f"openhands-{task['task_id']}-{int(time.time())}", model=f"openhands+{model}")
    final = {"text": ""}

    def on_event(ev):
        if isinstance(ev, ActionEvent):
            name = getattr(ev, "tool_name", None) or type(getattr(ev, "action", ev)).__name__
            act = getattr(ev, "action", None)
            emit("tool", name=f"openhands.{name}", id=str(getattr(ev, "tool_call_id", "") or getattr(ev, "id", "")),
                 file=getattr(act, "path", None))
            if name == "finish":
                final["text"] = getattr(act, "message", "") or final["text"]
        elif isinstance(ev, ObservationEvent):
            emit("tool.done", name=f"openhands.{getattr(ev, 'tool_name', 'tool')}", id=str(getattr(ev, "tool_call_id", "")),
                 is_error=bool(getattr(getattr(ev, "observation", None), "is_error", False)))
        elif isinstance(ev, MessageEvent) and getattr(ev, "source", "") == "agent":
            try:
                txt = " ".join(c.text for c in ev.llm_message.content if hasattr(c, "text"))
            except Exception:  # noqa: BLE001
                txt = ""
            if txt:
                final["text"] = txt; emit("text", text=txt[:400])

    conv = Conversation(agent=agent, workspace=workspace, callbacks=[on_event], visualizer=None,
                        max_iteration_per_run=int(s.get("max_iterations", 30)))
    try:
        conv.send_message(f"You act as the library agent '{a['name']}' ({a['description']}).\n\n{task_prompt(task)}")
        conv.run()
    finally:
        try:
            conv.close()
        except Exception:  # noqa: BLE001
            pass
    finish(bool(final["text"]), result=final["text"], cost_usd=0.0, error=None if final["text"] else "agent finished without a message")


if __name__ == "__main__":
    run(main)
