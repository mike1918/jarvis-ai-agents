"""Read-only access to the jarvis-ai-agents library (registry, districts, router). Agents are never copied or edited here."""
import importlib.util, json, subprocess, sys
from functools import lru_cache
from pathlib import Path
from .config import settings

def _j(rel):
    return settings.library_dir / ".claude" / "jarvis" / rel

@lru_cache
def registry():
    return json.loads(_j("registry.json").read_text(encoding="utf-8"))

@lru_cache
def city():
    return json.loads(_j("city.json").read_text(encoding="utf-8"))

def agents(include_disabled=False):
    return [a for a in registry()["agents"] if include_disabled or not a.get("disabled")]

def agent(name):
    return next((a for a in agents() if a["name"] == name), None)

@lru_cache
def _router():
    spec = importlib.util.spec_from_file_location("jarvis_router", _j("router.py"))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m

def route(text):
    """Library router (routing.json + registry) evaluated against the library checkout."""
    return _router().route(text, str(settings.library_dir))

def districts():
    reg = agents()
    out = []
    for d in city()["districts"]:
        members = [a for a in reg if a["folder"] == d["folder"]]
        out.append({**d, "agents": [a["name"] for a in members], "count": len(members)})
    return out

def info():
    r = registry()
    commit = subprocess.run(["git", "-C", str(settings.library_dir), "rev-parse", "--short", "HEAD"], capture_output=True, text=True).stdout.strip()
    return {"path": str(settings.library_dir), "commit": commit or None, "count_active": r["count_active"],
            "count_disabled": r["count_disabled"], "target_total": r["target_total"], "city": city()["name"]}

def install_into(project_path: Path):
    """Use the library's own installer (no overwrite, adds hooks + protocol) to make agents available in a project."""
    p = subprocess.run([sys.executable, "-I", str(settings.library_dir / "tools" / "install_into_project.py"), str(project_path), "--apply"],
                       capture_output=True, text=True, timeout=120)
    if p.returncode != 0: raise RuntimeError(p.stderr or p.stdout)
    return p.stdout
