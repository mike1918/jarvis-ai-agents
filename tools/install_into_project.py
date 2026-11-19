#!/usr/bin/env python3
"""Connect this library to another project (e.g. the main JARVIS repo). Dry-run by default.

  python3 tools/install_into_project.py /path/to/JARVIS            # show the plan, change nothing
  python3 tools/install_into_project.py /path/to/JARVIS --apply    # copy new files only
  python3 tools/install_into_project.py /path/to/JARVIS --districts 00-jarvis,01-core-development,04-quality-security
      # install only some districts (each agent description costs context in every request; ~7k tokens for 126 agents)

Never overwrites or deletes: an existing file with different content is reported as CONFLICT and skipped.
settings.json: only hook entries that are missing are added (existing settings are kept, a .bak is written).
CLAUDE.md: one import line is appended if absent. Logs/state dirs are added to .gitignore."""
import os, sys, json, shutil, filecmp, argparse
LIB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COPY_DIRS = [".claude/agents", ".claude/jarvis", ".claude/hooks"]
SKIP = {"logs", "state", "__pycache__"}
IMPORT_LINE = "@.claude/jarvis/AGENTS_PROTOCOL.md"

def plan_copy(dst_root, districts=None):
    plan = []
    for d in COPY_DIRS:
        for base, dirs, files in os.walk(os.path.join(LIB, d)):
            dirs[:] = [x for x in dirs if x not in SKIP]
            for f in files:
                src = os.path.join(base, f); rel = os.path.relpath(src, LIB); dst = os.path.join(dst_root, rel)
                parts = rel.split(os.sep)
                if districts and parts[:2] == [".claude", "agents"] and len(parts) > 3 and parts[2] not in districts: continue
                if not os.path.exists(dst): plan.append(("NEW", rel, src, dst))
                elif filecmp.cmp(src, dst, shallow=False): plan.append(("SAME", rel, src, dst))
                else: plan.append(("CONFLICT", rel, src, dst))
    return plan

def merge_settings(dst_root, apply):
    lib = json.load(open(os.path.join(LIB, ".claude/settings.json")))
    p = os.path.join(dst_root, ".claude/settings.json")
    cur = json.load(open(p)) if os.path.exists(p) else {}
    hooks = cur.setdefault("hooks", {}); added = []
    for ev, entries in lib["hooks"].items():
        have = {h.get("command") for x in hooks.get(ev, []) for h in x.get("hooks", [])}
        for e in entries:
            if e["hooks"][0]["command"] not in have:
                hooks.setdefault(ev, []).append(e); added.append(ev)
    if added and apply:
        if os.path.exists(p): shutil.copy2(p, p + ".bak")
        os.makedirs(os.path.dirname(p), exist_ok=True); json.dump(cur, open(p, "w"), indent=2)
    return added

def append_line(path, line, apply):
    txt = open(path, encoding="utf-8").read() if os.path.exists(path) else ""
    if line in txt.splitlines(): return False
    if apply:
        with open(path, "a", encoding="utf-8") as f: f.write(("\n" if txt and not txt.endswith("\n") else "") + line + "\n")
    return True

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("project"); ap.add_argument("--apply", action="store_true")
    ap.add_argument("--districts", help="comma-separated category folders; default: all"); a = ap.parse_args()
    dst = os.path.abspath(a.project)
    if not os.path.isdir(dst): sys.exit(f"not a directory: {dst}")
    if os.path.samefile(dst, LIB): sys.exit("target is the library itself")
    ds = set(a.districts.split(",")) | {"00-jarvis"} if a.districts else None
    plan = plan_copy(dst, ds)
    for kind in ("CONFLICT", "NEW"):
        for k, rel, *_ in plan:
            if k == kind and (kind == "CONFLICT" or len(plan) < 40): print(f"{k:<9} {rel}")
    c = {k: sum(1 for p in plan if p[0] == k) for k in ("NEW", "SAME", "CONFLICT")}
    print(f"files: {c['NEW']} new, {c['SAME']} identical, {c['CONFLICT']} conflicts (conflicts are skipped)")
    if a.apply:
        for k, rel, src, d in plan:
            if k == "NEW": os.makedirs(os.path.dirname(d), exist_ok=True); shutil.copy2(src, d)
    print("settings.json hooks to add:", merge_settings(dst, a.apply) or "none")
    print("CLAUDE.md import line:", "add" if append_line(os.path.join(dst, "CLAUDE.md"), IMPORT_LINE, a.apply) else "already present")
    for l in (".claude/jarvis/logs/", ".claude/jarvis/state/"): append_line(os.path.join(dst, ".gitignore"), l, a.apply)
    print("APPLIED" if a.apply else "DRY RUN — nothing changed. Re-run with --apply.")
