#!/usr/bin/env python3
"""TEST DOUBLE — a scripted OpenAI-compatible LLM endpoint (the same API Ollama serves at /v1).

Used only by integration tests so that the REAL integration code (CAMEL, LangGraph, browser-use, OpenHands SDK +
agent-server, Ollama worker) runs end-to-end without a real model. Answers are deterministic scripts chosen by the
tools offered in the request:
  tools python+finish (browser-use) : 1) python: open the test page and print its title  2) finish with that output
  tools terminal+finish (OpenHands) : 1) terminal: run `cat calc.py`                       2) finish quoting the output
  no tools                           : a short text answer that names the system prompt's agent and the user's request
Run: python fake_llm_server.py PORT
"""
import json, re, sys, time, uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

TEST_PAGE = {"url": ""}  # set via /__test/page


def last_tool_output(msgs):
    for m in reversed(msgs):
        if m.get("role") == "tool":
            c = m.get("content")
            if isinstance(c, list):
                c = " ".join(x.get("text", "") for x in c if isinstance(x, dict))
            return str(c)
    return None


def plan(req):
    msgs, tools = req.get("messages", []), [t.get("function", {}).get("name") for t in req.get("tools") or []]
    out = last_tool_output(msgs)
    if "python" in tools and "finish" in tools:
        if out is None:
            code = f'goto_url("{TEST_PAGE["url"]}")\nwait_for_load()\nprint("TITLE=" + js("document.title"))'
            return {"tool": ("python", {"code": code})}
        title = re.search(r"TITLE=([^\n\"']+)", out)
        return {"tool": ("finish", {"result": f"Page title: {title.group(1) if title else out[:200]}", "success": True})}
    if "terminal" in tools and "finish" in tools:
        if out is None:
            return {"tool": ("terminal", {"command": "cat calc.py"})}
        return {"tool": ("finish", {"message": f"Read calc.py via OpenHands. Output starts with: {out.strip()[:120]}"})}
    system = next((m.get("content") for m in msgs if m.get("role") == "system"), "") or ""
    if isinstance(system, list):
        system = " ".join(x.get("text", "") for x in system if isinstance(x, dict))
    user = next((m.get("content") for m in reversed(msgs) if m.get("role") == "user"), "") or ""
    if isinstance(user, list):
        user = " ".join(x.get("text", "") for x in user if isinstance(x, dict))
    who = re.search(r"You are (?:an? )?([^.,\n]{3,60})", system)
    return {"text": f"[fake-llm] {who.group(1) if who else 'agent'} answers: {str(user)[:120]} — DONE"}


def bow_vector(text, dims=128):
    """Deterministic bag-of-words embedding: texts sharing words get close vectors (good enough to test retrieval)."""
    import hashlib, math
    v = [0.0] * dims
    for w in re.findall(r"\w{3,}", str(text).lower()):
        v[int(hashlib.md5(w.encode()).hexdigest(), 16) % dims] += 1.0
    n = math.sqrt(sum(x * x for x in v)) or 1.0
    return [x / n for x in v]


class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass

    def _json(self, code, obj):
        b = json.dumps(obj).encode(); self.send_response(code)
        self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)

    def do_GET(self):
        if self.path.rstrip("/").endswith("/models"):
            return self._json(200, {"object": "list", "data": [{"id": "fake-model", "object": "model", "owned_by": "test"}]})
        if self.path.startswith("/__test/page"):
            b = b"<html><head><title>JARVIS test page 42</title></head><body><h1>Ashdod</h1></body></html>"
            self.send_response(200); self.send_header("Content-Type", "text/html"); self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b); return
        self._json(404, {"error": "not found"})

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        req = json.loads(self.rfile.read(n) or b"{}")
        if self.path.rstrip("/").endswith("/embeddings"):
            inp = req.get("input"); inp = [inp] if isinstance(inp, str) else inp
            return self._json(200, {"object": "list", "model": req.get("model"), "usage": {"prompt_tokens": 1, "total_tokens": 1},
                                    "data": [{"object": "embedding", "index": i, "embedding": bow_vector(s)} for i, s in enumerate(inp)]})
        if not self.path.rstrip("/").endswith("/chat/completions"):
            return self._json(404, {"error": f"unsupported {self.path}"})
        p, cid, now = plan(req), f"chatcmpl-{uuid.uuid4().hex[:12]}", int(time.time())
        usage = {"prompt_tokens": 50, "completion_tokens": 20, "total_tokens": 70}
        if "tool" in p:
            name, args = p["tool"]
            call = {"id": f"call_{uuid.uuid4().hex[:10]}", "type": "function", "function": {"name": name, "arguments": json.dumps(args)}}
            msg, finish = {"role": "assistant", "content": None, "tool_calls": [call]}, "tool_calls"
        else:
            msg, finish = {"role": "assistant", "content": p["text"]}, "stop"
        if not req.get("stream"):
            return self._json(200, {"id": cid, "object": "chat.completion", "created": now, "model": req.get("model", "fake-model"),
                                    "choices": [{"index": 0, "message": msg, "finish_reason": finish}], "usage": usage})
        self.send_response(200); self.send_header("Content-Type", "text/event-stream"); self.end_headers()
        def chunk(delta, fr=None, u=None):
            d = {"id": cid, "object": "chat.completion.chunk", "created": now, "model": req.get("model", "fake-model"),
                 "choices": [{"index": 0, "delta": delta, "finish_reason": fr}]}
            if u: d["usage"] = u
            self.wfile.write(f"data: {json.dumps(d)}\n\n".encode()); self.wfile.flush()
        if "tool_calls" in msg:
            c = msg["tool_calls"][0]
            chunk({"role": "assistant", "tool_calls": [{"index": 0, "id": c["id"], "type": "function", "function": {"name": c["function"]["name"], "arguments": c["function"]["arguments"]}}]})
        else:
            chunk({"role": "assistant", "content": msg["content"]})
        chunk({}, finish, usage)
        self.wfile.write(b"data: [DONE]\n\n"); self.wfile.flush()


if __name__ == "__main__":
    port = int(sys.argv[1]); TEST_PAGE["url"] = f"http://127.0.0.1:{port}/__test/page"
    ThreadingHTTPServer(("127.0.0.1", port), H).serve_forever()
