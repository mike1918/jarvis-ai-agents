"""Ollama runtime: a library agent answers with a local model (free, no data leaves the machine).

Uses Ollama's OpenAI-compatible endpoint (POST {base}/chat/completions, base = http://127.0.0.1:11434/v1).
The agent's own system prompt comes from its .md definition in the library. Read-only: no tools, no file edits.
"""
import os, sys, time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "common"))
from protocol import task_prompt, agent_definition, emit, finish, llm_settings, run   # noqa: E402
import httpx                                                              # noqa: E402

def main(task):
    a = agent_definition(task["library_dir"], task["agent"])
    base, model, key = llm_settings(task)
    emit("session", session_id=f"ollama-{task['task_id']}-{int(time.time())}", model=model)
    emit("tool", name="llm.chat", id="llm-1")
    r = httpx.post(f"{base}/chat/completions", timeout=600, headers={"Authorization": f"Bearer {key}"},
                   json={"model": model, "stream": False, "messages": [
                       {"role": "system", "content": a["system_prompt"][:12000]},
                       {"role": "user", "content": task_prompt(task)}]})
    if r.status_code != 200:
        emit("tool.done", name="llm.chat", id="llm-1", is_error=True)
        return finish(False, error=f"LLM endpoint {base} answered HTTP {r.status_code}: {r.text[:300]}")
    emit("tool.done", name="llm.chat", id="llm-1", is_error=False)
    d = r.json(); text = d["choices"][0]["message"].get("content") or ""
    emit("text", text=text[:400])
    u = d.get("usage") or {}
    finish(True, result=text, cost_usd=0.0, usage={"input_tokens": u.get("prompt_tokens", 0), "output_tokens": u.get("completion_tokens", 0)})

if __name__ == "__main__":
    run(main)
