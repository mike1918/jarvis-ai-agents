#!/usr/bin/env python3
"""JARVIS agent guard for Claude Code hooks.
Events: UserPromptSubmit (suggest agents), PreToolUse[Agent|Task] (limits + safe handoff),
SubagentStart / SubagentStop / PostToolUse[Agent|Task] (journal + accounting).
Log: .claude/jarvis/logs/agents.jsonl   State: .claude/jarvis/state/<session>.json
Any internal failure exits 0 (fail-open for logging, never breaks the session)."""
import sys, os, json, re, time, fcntl

PROJ = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
J = os.path.join(PROJ, ".claude", "jarvis")
LOG = os.path.join(J, "logs", "agents.jsonl")
BUILTIN = {"general-purpose", "Explore", "Plan", "claude", "claude-code-guide", "statusline-setup", "fork"}
SECRET_RX = re.compile(r"(sk-ant-[A-Za-z0-9_-]{10,}|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)")

def load(p, default):
    try:
        with open(p, encoding="utf-8") as f: return json.load(f)
    except Exception: return default

def log(rec):
    os.makedirs(os.path.dirname(LOG), exist_ok=True)
    rec = {"ts": time.strftime("%Y-%m-%dT%H:%M:%S%z"), **rec}
    with open(LOG, "a", encoding="utf-8") as f: f.write(json.dumps(rec, ensure_ascii=False) + "\n")

class State:
    """Per-session counters, guarded by an exclusive file lock (parallel launches fire hooks concurrently)."""
    def __init__(self, sid):
        d = os.path.join(J, "state"); os.makedirs(d, exist_ok=True)
        self.path = os.path.join(d, re.sub(r"[^A-Za-z0-9_-]", "_", sid or "nosession") + ".json")
    def __enter__(self):
        self.fh = open(self.path + ".lock", "w"); fcntl.flock(self.fh, fcntl.LOCK_EX)
        self.s = load(self.path, {"allowed": 0, "finished": 0, "failed": 0, "tokens": 0, "running": {}})
        return self.s
    def __exit__(self, *a):
        tmp = self.path + ".tmp"
        with open(tmp, "w") as f: json.dump(self.s, f)
        os.replace(tmp, self.path); fcntl.flock(self.fh, fcntl.LOCK_UN); self.fh.close()

def deny(reason, ev):
    log({"event": "denied", "session": ev.get("session_id"), "agent_type": (ev.get("tool_input") or {}).get("subagent_type"), "reason": reason})
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny",
                                             "permissionDecisionReason": "[jarvis-guard] " + reason}}))
    sys.exit(0)

def transcript_tokens(path):
    t = {"input": 0, "cache_write": 0, "cache_read": 0, "output": 0}; model = None
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                try: d = json.loads(line)
                except Exception: continue
                m = d.get("message") or {}
                u = m.get("usage") if d.get("type") == "assistant" else None
                if not u: continue
                model = m.get("model") or model
                t["input"] += u.get("input_tokens", 0); t["output"] += u.get("output_tokens", 0)
                t["cache_write"] += u.get("cache_creation_input_tokens", 0); t["cache_read"] += u.get("cache_read_input_tokens", 0)
    except Exception: pass
    return t, model

def pre_tool(ev):
    lim = load(os.path.join(J, "limits.json"), {})
    ti = ev.get("tool_input") or {}
    at = ti.get("subagent_type") or "general-purpose"
    reg = {a["name"] for a in load(os.path.join(J, "registry.json"), {}).get("agents", [])}
    if at not in reg and at not in BUILTIN:
        deny(f"unknown subagent_type '{at}' (not in .claude/jarvis/registry.json)", ev)
    if at in set(lim.get("block_agents", [])) and os.environ.get("JARVIS_ALLOW_INSTALLER") != "1":
        deny(f"agent '{at}' is blocked by limits.json (set JARVIS_ALLOW_INSTALLER=1 to allow)", ev)
    prompt = str(ti.get("prompt", ""))
    if SECRET_RX.search(prompt):
        deny("handoff prompt contains what looks like a secret/API key; pass a file path or env var name instead", ev)
    if len(prompt) > lim.get("max_handoff_prompt_chars", 20000):
        deny(f"handoff prompt is {len(prompt)} chars (limit {lim.get('max_handoff_prompt_chars')}); put context in a file and pass the path", ev)
    with State(ev.get("session_id")) as s:
        settle_pending(s, ev.get("session_id"))
        active = s["allowed"] - s["finished"] - s["failed"]
        if active >= lim.get("max_concurrent_subagents", 3):
            deny(f"{active} subagents already running (max_concurrent_subagents={lim.get('max_concurrent_subagents')}); wait for one to finish", ev)
        if s["allowed"] >= lim.get("max_subagent_launches_per_session", 25):
            deny(f"session launch limit reached ({s['allowed']})", ev)
        if s["tokens"] >= lim.get("max_subagent_tokens_per_session", 2_000_000):
            deny(f"session subagent token budget exhausted ({s['tokens']} tokens)", ev)
        s["allowed"] += 1
    log({"event": "launch", "session": ev.get("session_id"), "agent_type": at, "tool_use_id": ev.get("tool_use_id"),
         "description": ti.get("description"), "background": bool(ti.get("run_in_background")), "prompt_chars": len(prompt)})

def post_tool(ev):
    r = ev.get("tool_response"); txt = r if isinstance(r, str) else json.dumps(r, ensure_ascii=False, default=str)
    is_err = isinstance(r, dict) and (r.get("is_error") or r.get("status") in ("error", "failed"))
    if is_err or (isinstance(r, str) and r.lower().startswith(("error", "<tool_use_error"))):
        with State(ev.get("session_id")) as s: s["failed"] += 1
        log({"event": "error", "session": ev.get("session_id"), "agent_type": (ev.get("tool_input") or {}).get("subagent_type"),
             "tool_use_id": ev.get("tool_use_id"), "error": txt[:1000]})

def sub_start(ev):
    with State(ev.get("session_id")) as s: s["running"][ev.get("agent_id", "?")] = ev.get("agent_type")
    log({"event": "start", "session": ev.get("session_id"), "agent_type": ev.get("agent_type"), "agent_id": ev.get("agent_id")})

def _billable(tok): return tok["input"] + tok["cache_write"] + tok["output"]

def settle_pending(s, sid):
    """Claude Code writes the subagent's usage to its transcript slightly AFTER SubagentStop fires,
    so usage that was still missing is re-read at the next hook event of the session."""
    for aid, info in list(s.get("pending", {}).items()):
        tok, model = transcript_tokens(info["path"])
        if _billable(tok) or time.time() - info["t"] > 3600:
            s["pending"].pop(aid); s["tokens"] += _billable(tok)
            log({"event": "usage", "session": sid, "agent_type": info["type"], "agent_id": aid, "model": model,
                 "tokens": tok, "session_tokens": s["tokens"], "late": True})

def sub_stop(ev):
    path = ev.get("agent_transcript_path", "")
    tok, model = transcript_tokens(path)
    for _ in range(6):
        if _billable(tok): break
        time.sleep(0.5); tok, model = transcript_tokens(path)
    sid = ev.get("session_id")
    with State(sid) as s:
        s["running"].pop(ev.get("agent_id", "?"), None)
        s["finished"] += 1
        settle_pending(s, sid)
        if _billable(tok): s["tokens"] += _billable(tok)
        else: s.setdefault("pending", {})[ev.get("agent_id", "?")] = {"path": path, "type": ev.get("agent_type"), "t": time.time()}
        total = s["tokens"]
    msg = ev.get("last_assistant_message") or ""
    log({"event": "finish", "session": sid, "agent_type": ev.get("agent_type"), "agent_id": ev.get("agent_id"),
         "model": model, "tokens": tok if _billable(tok) else "pending", "session_tokens": total,
         "result_preview": msg[:300], "empty_result": not msg.strip()})

def prompt_submit(ev):
    p = ev.get("prompt", "")
    sys.path.insert(0, os.path.join(J))
    from router import route
    picks = route(p, PROJ)
    if picks:
        print("[jarvis-router] Suitable subagents for this task (by type): " + "; ".join(f"{t}: {', '.join(a)}" for t, a in picks)
              + ". Delegate via the Agent tool only if the task benefits from it.")

def main():
    try: ev = json.load(sys.stdin)
    except Exception: sys.exit(0)
    h = ev.get("hook_event_name")
    try:
        {"PreToolUse": pre_tool, "PostToolUse": post_tool, "SubagentStart": sub_start,
         "SubagentStop": sub_stop, "UserPromptSubmit": prompt_submit}.get(h, lambda e: None)(ev)
    except SystemExit: raise
    except Exception as e:
        try: log({"event": "guard_error", "hook": h, "error": repr(e)[:500]})
        except Exception: pass
    sys.exit(0)

if __name__ == "__main__": main()
