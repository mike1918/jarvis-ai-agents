#!/usr/bin/env python3
"""Library maintenance for JARVIS AI CITY (works for 126 -> 300+ agents).

  python3 tools/agentlib.py validate      # frontmatter, unique names, tools, categories, security scan (CI)
  python3 tools/agentlib.py build         # regenerate .claude/jarvis/registry.json + REGISTRY.md from .claude/agents/
  python3 tools/agentlib.py new NAME --category 04-quality-security --access read-only --description "Use this agent when ..."
  python3 tools/agentlib.py stats         # actual vs planned capacity per district

Layout: .claude/agents/<NN-category>/<name>.md (Claude Code discovers subfolders). Disabled agents: library/disabled/.
Exit code != 0 on validation errors."""
import os, re, sys, json, argparse, difflib, unicodedata
try:
    import yaml
except ImportError:
    sys.exit("pip install pyyaml")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AG = os.path.join(ROOT, ".claude", "agents"); J = os.path.join(ROOT, ".claude", "jarvis")
DISABLED = os.path.join(ROOT, "library", "disabled")
TOOLS = {"Read","Write","Edit","MultiEdit","Bash","Glob","Grep","WebFetch","WebSearch","NotebookEdit","Agent","Task",
         "TodoWrite","Skill","AskUserQuestion","SendMessage","ToolSearch","LS"}
WRITE = {"Write","Edit","MultiEdit","Bash","NotebookEdit"}
NAME_RX = re.compile(r"^[a-z0-9][a-z0-9.-]*[a-z0-9]$")
SECRET_RX = re.compile(r"(sk-ant-[A-Za-z0-9_-]{10,}|sk-[A-Za-z0-9]{32,}|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)")
RISKY_RX = re.compile(r"(curl[^\n|]*\|\s*(ba|z)?sh|wget[^\n|]*\|\s*(ba|z)?sh|rm\s+-rf\s+[/~]|--dangerously-skip-permissions|bypassPermissions|ignore (all )?previous instructions|base64\s+-d[^\n]*\|\s*(ba)?sh)", re.I)
HIDDEN = {"Cf"}  # zero-width / bidi control characters (hidden prompt-injection)

def load_agent(path):
    t = open(path, encoding="utf-8").read()
    m = re.match(r"^---\r?\n(.*?)\r?\n---\r?\n(.*)$", t, re.S)
    if not m: return None, t, "no YAML frontmatter"
    try: fm = yaml.safe_load(m.group(1)) or {}
    except Exception as e: return None, t, f"invalid YAML: {str(e).splitlines()[0]}"
    return fm, m.group(2), None

def iter_agents(include_disabled=True):
    for base, disabled in ((AG, False), (DISABLED, True)):
        if disabled and not include_disabled: continue
        for d, _, files in os.walk(base):
            for f in sorted(files):
                if f.endswith(".md"): yield os.path.join(d, f), disabled

def scan_text(t):
    out = []
    if SECRET_RX.search(t): out.append("secret-like token")
    m = RISKY_RX.search(t)
    if m: out.append(f"risky command pattern: {m.group(0)[:60]!r}")
    hid = {f"U+{ord(c):04X}" for c in t if unicodedata.category(c) in HIDDEN and c not in "‍️"}
    if hid: out.append(f"hidden unicode control chars {sorted(hid)[:5]}")
    return out

def validate(strict_similarity=0.92):
    errs, warns, names, descs = [], [], {}, {}
    ann = json.load(open(os.path.join(J, "annotations.json"), encoding="utf-8"))
    city = {d["folder"] for d in json.load(open(os.path.join(J, "city.json"), encoding="utf-8"))["districts"]}
    n = 0
    for path, disabled in iter_agents():
        rel = os.path.relpath(path, ROOT); n += 1
        fm, body, err = load_agent(path)
        if err: errs.append(f"{rel}: {err}"); continue
        name, desc = fm.get("name"), fm.get("description")
        if not name or not desc: errs.append(f"{rel}: 'name' and 'description' are required"); continue
        if not NAME_RX.match(str(name)): errs.append(f"{rel}: bad name {name!r} (lowercase, digits, '-', '.')")
        if os.path.basename(path) != f"{name}.md": errs.append(f"{rel}: file name must be {name}.md")
        if name in names: errs.append(f"{rel}: duplicate name {name!r} (also {names[name]})")
        names[name] = rel
        if not disabled:
            folder = os.path.relpath(os.path.dirname(path), AG).split(os.sep)[0]
            if folder not in city: errs.append(f"{rel}: folder {folder!r} is not a district in city.json")
        tools = fm.get("tools")
        if tools is None: warns.append(f"{rel}: no 'tools' -> inherits ALL tools")
        else:
            for t in [x.strip() for x in str(tools).split(",") if x.strip()]:
                if t not in TOOLS and not t.startswith("mcp__"): errs.append(f"{rel}: unknown tool {t!r}")
        if fm.get("model") not in (None, "inherit", "sonnet", "opus", "haiku", "fable") and not str(fm.get("model")).startswith("claude-"):
            warns.append(f"{rel}: unusual model {fm.get('model')!r}")
        if len(body.strip()) < 200: errs.append(f"{rel}: prompt body too short")
        for s in scan_text(open(path, encoding="utf-8").read()): errs.append(f"{rel}: SECURITY {s}")
        for other, od in descs.items():
            if difflib.SequenceMatcher(None, str(desc).lower(), od.lower()).ratio() > strict_similarity:
                warns.append(f"{rel}: description nearly identical to {other!r} (auto-selection will be ambiguous)")
        descs[name] = str(desc)
    for k in ann:
        if not k.startswith("_") and k not in names: warns.append(f"annotations.json: {k!r} has no agent file")
    for f in os.listdir(os.path.join(ROOT, ".claude", "hooks")) + os.listdir(J):
        p = os.path.join(ROOT, ".claude", "hooks", f) if os.path.exists(os.path.join(ROOT, ".claude", "hooks", f)) else os.path.join(J, f)
        if os.path.isfile(p) and p.endswith((".py", ".json", ".md")) and SECRET_RX.search(open(p, encoding="utf-8").read()):
            errs.append(f"{os.path.relpath(p, ROOT)}: SECURITY secret-like token")
    return n, errs, warns

def build():
    ann = json.load(open(os.path.join(J, "annotations.json"), encoding="utf-8"))
    city = json.load(open(os.path.join(J, "city.json"), encoding="utf-8"))
    dist = {d["folder"]: d["district"] for d in city["districts"]}
    reg = []
    for path, disabled in iter_agents():
        fm, _, err = load_agent(path)
        if err: continue
        name = fm["name"]; a = ann.get(name, {})
        tools = [t.strip() for t in str(fm.get("tools", "")).split(",") if t.strip()] or ["(all inherited)"]
        folder = "disabled" if disabled else os.path.relpath(os.path.dirname(path), AG).split(os.sep)[0]
        access = "coordinator" if "Agent" in tools else ("write" if WRITE & set(tools) or tools == ["(all inherited)"]
                  else ("research" if {"WebFetch", "WebSearch"} & set(tools) else "read-only"))
        reg.append({"name": name, "category": re.sub(r"^\d+-", "", folder), "folder": folder,
                    "district": dist.get(folder, "—"), "path": os.path.relpath(path, ROOT),
                    "description": str(fm["description"]).strip(), "tools": tools, "model": fm.get("model") or "inherit",
                    "access": access, "auto_route": a.get("auto_route", not disabled), "disabled": disabled,
                    "origin": a.get("origin", "jarvis-ai-agents library"), "fix_applied": a.get("fix_applied"), "note": a.get("note"),
                    "runtime": a.get("runtime")})
    reg.sort(key=lambda r: (r["folder"], r["name"]))
    active = [r for r in reg if not r["disabled"]]
    json.dump({"source": "github.com/mike1918/jarvis-ai-agents", "count_total": len(reg), "count_active": len(active),
               "count_disabled": len(reg) - len(active), "target_total": city["target_total_agents"], "agents": reg},
              open(os.path.join(J, "registry.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    L = [f"# Реестр агентов — {city['name']}\n",
         f"Всего определений: **{len(reg)}** · активных: **{len(active)}** · отключено: **{len(reg)-len(active)}** · цель: {city['target_total_agents']}.\n",
         "Файл генерируется командой `python3 tools/agentlib.py build` — не редактируйте вручную.\n",
         "Доступ: `read-only` — только чтение; `research` — чтение + веб; `write` — правит файлы и запускает команды; `coordinator` — запускает других агентов.\n"]
    for folder in [d["folder"] for d in city["districts"]] + ["disabled"]:
        rows = [r for r in reg if r["folder"] == folder]
        if not rows: continue
        L.append(f"\n## {folder} — {dist.get(folder, 'Отключённые')} ({len(rows)})\n\n| Агент | Модель | Доступ | Специализация |\n|---|---|---|---|")
        for r in rows:
            d = re.sub(r"^Use (this agent )?when (you need )?(to )?", "", r["description"].replace("|", "/").replace("\n", " "))[:200]
            extra = " ⚠️ " + "; ".join(x for x in (r["fix_applied"], r["note"]) if x) if (r["fix_applied"] or r["note"]) else ""
            L.append(f"| `{r['name']}` | {r['model']} | {r['access']} | {d}{extra} |")
    open(os.path.join(J, "REGISTRY.md"), "w", encoding="utf-8").write("\n".join(L) + "\n")
    return reg

def stats():
    city = json.load(open(os.path.join(J, "city.json"), encoding="utf-8"))
    reg = json.load(open(os.path.join(J, "registry.json"), encoding="utf-8"))["agents"]
    tot = 0
    for d in city["districts"]:
        n = sum(1 for r in reg if r["folder"] == d["folder"]); tot += n
        print(f"{d['folder']:<26} {n:>4} / {d['planned_capacity']:<4} {d['district']}")
    print(f"{'TOTAL active':<26} {tot:>4} / {city['target_total_agents']}")

TEMPLATE = """---
name: {name}
description: "{description}"
tools: {tools}
model: sonnet
---

You are a {name} specialist. TODO: role, scope, what you must NOT do.

## Checklist
- TODO

## Output format
- TODO: what you return to the coordinator (findings, changed files, open questions).
"""
ACCESS_TOOLS = {"read-only": "Read, Grep, Glob", "research": "Read, Grep, Glob, WebFetch, WebSearch",
                "write": "Read, Write, Edit, Bash, Glob, Grep", "docs": "Read, Write, Edit, Glob, Grep, WebFetch, WebSearch"}

def new(name, category, access, description):
    if not NAME_RX.match(name): sys.exit(f"bad name {name!r}")
    if any(os.path.basename(p) == f"{name}.md" for p, _ in iter_agents()): sys.exit(f"agent {name!r} already exists")
    if not description.lower().startswith("use this agent when"): sys.exit("description must start with 'Use this agent when ...'")
    city = {d["folder"] for d in json.load(open(os.path.join(J, "city.json")))["districts"]}
    if category not in city: sys.exit(f"category must be one of {sorted(city)}")
    p = os.path.join(AG, category, f"{name}.md"); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "x", encoding="utf-8").write(TEMPLATE.format(name=name, description=description.replace('"', "'"), tools=ACCESS_TOOLS[access]))
    print("created", os.path.relpath(p, ROOT), "- fill in the TODOs, then: validate && build")

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); sp = ap.add_subparsers(dest="cmd", required=True)
    sp.add_parser("validate"); sp.add_parser("build"); sp.add_parser("stats")
    p = sp.add_parser("new"); p.add_argument("name"); p.add_argument("--category", required=True)
    p.add_argument("--access", choices=list(ACCESS_TOOLS), default="read-only"); p.add_argument("--description", required=True)
    a = ap.parse_args()
    if a.cmd == "validate":
        n, e, w = validate()
        for x in w: print("WARN ", x)
        for x in e: print("ERROR", x)
        print(f"checked {n} agent files: {len(e)} errors, {len(w)} warnings"); sys.exit(1 if e else 0)
    if a.cmd == "build": r = build(); print(f"registry: {len(r)} agents ({sum(not x['disabled'] for x in r)} active)")
    if a.cmd == "stats": stats()
    if a.cmd == "new": new(a.name, a.category, a.access, a.description)
