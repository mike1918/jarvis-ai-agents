#!/usr/bin/env python3
"""Task-type router shared by the UserPromptSubmit hook, the jarvis coordinator and bridge.py.
CLI: python3 .claude/jarvis/router.py "task text"   -> JSON [[task_type, [agents...]], ...]"""
import json, os, re, sys
def _dir(proj=None):
    if proj: return os.path.join(proj, ".claude", "jarvis")
    return os.path.dirname(os.path.abspath(__file__))
def route(text, proj=None, limit=3):
    J = _dir(proj)
    rt = json.load(open(os.path.join(J, "routing.json"), encoding="utf-8"))
    root = os.path.dirname(os.path.dirname(J))
    reg = {a["name"]: a for a in json.load(open(os.path.join(J, "registry.json"), encoding="utf-8"))["agents"]
           if os.path.exists(os.path.join(root, a.get("path", "")))}   # only agents actually installed in this project
    out = []
    for r in rt["routes"]:
        if re.search(r["pattern"], text, re.I):
            ags = [a for a in r["agents"] if a in reg and reg[a].get("auto_route", True) and not reg[a].get("disabled")][:limit]
            if ags: out.append((r["task_type"], ags))
    if len(out) >= 3 and "jarvis" in reg:          # many domains at once -> coordinator first
        out.insert(0, ("multi-domain", ["jarvis"]))
    return out[:4]
def best_agent(text, proj=None):
    r = route(text, proj)
    return r[0][1][0] if r else None
if __name__ == "__main__":
    print(json.dumps(route(" ".join(sys.argv[1:])), ensure_ascii=False))
