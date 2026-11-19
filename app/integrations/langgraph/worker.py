"""LangGraph runtime: the JARVIS coordination workflow as a real LangGraph StateGraph.

  plan ──(specialists?)──► dispatch ──► review ──► END
     └────────(none)──────────────────► answer ──► END

plan     : the library router picks 1–3 specialists for the task (same routing as the city).
dispatch : each specialist answers with its own system prompt from the library (LLM via an OpenAI-compatible
           endpoint, e.g. Ollama); the city sees delegate.start / delegate.finish for every specialist.
review   : the jarvis coordinator combines the specialists' answers.
"""
import os, sys, time
from typing import TypedDict
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "common"))
from protocol import task_prompt, agent_definition, emit, finish, llm_settings, route, run   # noqa: E402
import httpx                                                                     # noqa: E402
from langgraph.graph import END, StateGraph                                      # noqa: E402


class S(TypedDict, total=False):
    prompt: str
    specialists: list
    answers: dict
    final: str
    usage: dict


def make(task):
    base, model, key = llm_settings(task)
    lib = task["library_dir"]
    max_spec = int((task.get("settings") or {}).get("max_specialists", 3))
    usage = {"input_tokens": 0, "output_tokens": 0}

    def llm(system, user, tag):
        emit("tool", name="llm.chat", id=tag)
        r = httpx.post(f"{base}/chat/completions", timeout=600, headers={"Authorization": f"Bearer {key}"},
                       json={"model": model, "stream": False, "messages": [{"role": "system", "content": system[:12000]}, {"role": "user", "content": user}]})
        ok = r.status_code == 200
        emit("tool.done", name="llm.chat", id=tag, is_error=not ok)
        if not ok:
            raise RuntimeError(f"LLM endpoint {base} answered HTTP {r.status_code}: {r.text[:300]}")
        d = r.json(); u = d.get("usage") or {}
        usage["input_tokens"] += u.get("prompt_tokens", 0); usage["output_tokens"] += u.get("completion_tokens", 0)
        return d["choices"][0]["message"].get("content") or ""

    def plan(st: S) -> S:
        picks = []
        for _, agents in route(lib, st["prompt"]):
            for a in agents:
                if a != "jarvis" and a not in picks:
                    picks.append(a)
        emit("text", text=f"[plan] specialists: {', '.join(picks[:max_spec]) or 'none'}")
        return {"specialists": picks[:max_spec], "answers": {}}

    def dispatch(st: S) -> S:
        answers = {}
        for a in st["specialists"]:
            d = agent_definition(lib, a)
            emit("delegate.start", agent=a, description=st["prompt"][:120])
            try:
                answers[a] = llm(d["system_prompt"], st["prompt"], f"llm-{a}")
                emit("delegate.finish", agent=a, is_error=False)
            except Exception as e:
                answers[a] = f"ERROR: {e}"
                emit("delegate.finish", agent=a, is_error=True)
        return {"answers": answers}

    def review(st: S) -> S:
        j = agent_definition(lib, "jarvis")
        parts = "\n\n".join(f"### {a}\n{t}" for a, t in st["answers"].items())
        final = llm(j["system_prompt"], f"Task: {st['prompt']}\n\nSpecialists' answers:\n{parts}\n\nCombine them into one short answer.", "llm-review")
        return {"final": final}

    def answer(st: S) -> S:
        return {"final": llm(agent_definition(lib, task["agent"])["system_prompt"], st["prompt"], "llm-direct")}

    g = StateGraph(S)
    g.add_node("plan", plan); g.add_node("dispatch", dispatch); g.add_node("review", review); g.add_node("answer", answer)
    g.set_entry_point("plan")
    g.add_conditional_edges("plan", lambda st: "dispatch" if st["specialists"] else "answer", {"dispatch": "dispatch", "answer": "answer"})
    g.add_edge("dispatch", "review"); g.add_edge("review", END); g.add_edge("answer", END)
    return g.compile(), usage, model


def main(task):
    graph, usage, model = make(task)
    emit("session", session_id=f"langgraph-{task['task_id']}-{int(time.time())}", model=f"langgraph+{model}")
    out = graph.invoke({"prompt": task_prompt(task)})
    errors = [a for a, t in (out.get("answers") or {}).items() if str(t).startswith("ERROR:")]
    finish(not errors, result=out.get("final", ""), cost_usd=0.0, usage=usage,
           error=f"specialists failed: {errors}" if errors else None)


if __name__ == "__main__":
    run(main)
