#!/usr/bin/env python3
"""Test double for the `claude` CLI (no API call). Emits stream-json events like `claude -p --output-format stream-json --verbose`,
including a delegation from jarvis to a library subagent. Used only by tests."""
import json, sys, time
args = sys.argv[1:]
agent = args[args.index("--agent") + 1]; prompt = args[args.index("--") + 1]
assert "--max-budget-usd" in args and "--permission-mode" in args
def out(o): print(json.dumps(o), flush=True)
out({"type": "system", "subtype": "init", "session_id": "fake-session-1", "model": "fake-model"})
if agent == "jarvis" and prompt.startswith("async"):
    # background delegation: tool_result returns at once, completion arrives via the guard hook journal
    import os
    out({"type": "assistant", "message": {"content": [{"type": "tool_use", "id": "tu2", "name": "Agent", "input": {"subagent_type": "qa-expert", "run_in_background": True}}]}})
    out({"type": "user", "message": {"content": [{"type": "tool_result", "tool_use_id": "tu2", "content": [{"type": "text", "text": "{'status': 'async_launched'}"}]}]}})
    time.sleep(1.5)
    os.makedirs(".claude/jarvis/logs", exist_ok=True)
    with open(".claude/jarvis/logs/agents.jsonl", "a") as f:
        f.write(json.dumps({"event": "finish", "session": "fake-session-1", "agent_type": "qa-expert"}) + "\n")
    time.sleep(1.0)
elif agent == "jarvis":
    out({"type": "assistant", "message": {"content": [{"type": "tool_use", "id": "tu1", "name": "Agent", "input": {"subagent_type": "debugger", "description": "find bug"}}]}})
    time.sleep(0.3)
    out({"type": "user", "message": {"content": [{"type": "tool_result", "tool_use_id": "tu1", "content": "bug: a-b"}]}})
if prompt.startswith("hang"): time.sleep(60)
out({"type": "result", "subtype": "success", "is_error": False, "result": f"{agent} done: {prompt}", "total_cost_usd": 0.0123,
     "session_id": "fake-session-1", "usage": {"input_tokens": 10, "output_tokens": 5, "cache_read_input_tokens": 100}})
