"""CAMEL runtime: two camel-ai ChatAgents talk — the jarvis coordinator and a library specialist.

The specialist answers, the coordinator gives a follow-up instruction or says DONE (up to settings.max_turns).
Both agents get their system prompts from the library definitions.
Model: an OpenAI-compatible endpoint through CAMEL's Ollama platform (or CAMEL's offline stub model when
settings.llm_model == "stub", used for wiring tests).
"""
import os, sys, time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "common"))
from protocol import agent_definition, emit, finish, llm_settings, run   # noqa: E402


def main(task):
    from camel.agents import ChatAgent
    from camel.messages import BaseMessage
    from camel.models import ModelFactory
    from camel.types import ModelPlatformType, ModelType

    from camel.utils import BaseTokenCounter

    class ApproxTokenCounter(BaseTokenCounter):
        """Offline token estimate (~4 chars/token). CAMEL's default counter downloads a tiktoken vocabulary from the
        internet on first use, which breaks fully local (Ollama) setups. Only used for context-window trimming."""
        def count_tokens_from_messages(self, messages):
            return sum(len(str(m.get("content") or "")) // 4 + 4 for m in messages)
        def encode(self, text):
            return list(text.encode("utf-8"))
        def decode(self, token_ids):
            return bytes(token_ids).decode("utf-8", errors="replace")

    base, model, key = llm_settings(task)
    turns = int((task.get("settings") or {}).get("max_turns", 2))
    if model == "stub":
        make = lambda: ModelFactory.create(model_platform=ModelPlatformType.STUB, model_type=ModelType.STUB)
    else:
        make = lambda: ModelFactory.create(model_platform=ModelPlatformType.OLLAMA, model_type=model, url=base, api_key=key,
                                           token_counter=ApproxTokenCounter(), model_config_dict={"temperature": 0.2})
    spec = agent_definition(task["library_dir"], task["agent"])
    coord = agent_definition(task["library_dir"], "jarvis")
    emit("session", session_id=f"camel-{task['task_id']}-{int(time.time())}", model=f"camel+{model}")

    coordinator = ChatAgent(system_message=BaseMessage.make_assistant_message("jarvis", coord["system_prompt"][:8000]), model=make())
    specialist = ChatAgent(system_message=BaseMessage.make_assistant_message(spec["name"], spec["system_prompt"][:8000]), model=make())
    msg = BaseMessage.make_user_message("jarvis", f"Task for {spec['name']}: {task['prompt']}")
    transcript, answer = [], ""
    for i in range(turns):
        emit("delegate.start", agent=spec["name"], description=f"CAMEL turn {i + 1}")
        r = specialist.step(msg)
        answer = r.msgs[0].content if r.msgs else ""
        emit("delegate.finish", agent=spec["name"], is_error=not r.msgs)
        emit("text", text=f"[{spec['name']}] {answer[:300]}")
        transcript.append((spec["name"], answer))
        if i == turns - 1 or r.terminated:
            break
        emit("tool", name="camel.coordinator", id=f"coord-{i}")
        c = coordinator.step(BaseMessage.make_user_message(spec["name"], f"Specialist answer:\n{answer}\n\nGive one short follow-up instruction, or reply DONE."))
        emit("tool.done", name="camel.coordinator", id=f"coord-{i}", is_error=not c.msgs)
        follow = c.msgs[0].content if c.msgs else "DONE"
        transcript.append(("jarvis", follow))
        if "DONE" in follow.upper():
            break
        msg = BaseMessage.make_user_message("jarvis", follow)
    finish(True, result=answer, cost_usd=0.0, usage={"turns": len(transcript)})


if __name__ == "__main__":
    run(main)
