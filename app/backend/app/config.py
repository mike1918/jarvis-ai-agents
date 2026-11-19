"""Runtime configuration (environment variables). Nothing secret has a default."""
import os
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

def _default_library() -> Path:
    """vendor/jarvis-ai-agents (standalone checkout) or the enclosing library repo (when this app lives in its app/ folder)."""
    for cand in (ROOT / "vendor" / "jarvis-ai-agents", ROOT.parent):
        if (cand / ".claude" / "jarvis" / "registry.json").exists():
            return cand
    return ROOT / "vendor" / "jarvis-ai-agents"

@dataclass
class Settings:
    library_dir: Path = field(default_factory=lambda: Path(os.environ.get("JARVIS_LIBRARY_DIR") or _default_library()))
    data_dir: Path = field(default_factory=lambda: Path(os.environ.get("JARVIS_DATA_DIR", ROOT / "data")))
    workspace_dir: Path = field(default_factory=lambda: Path(os.environ.get("JARVIS_WORKSPACE_DIR", ROOT / "workspace")))
    frontend_dist: Path = field(default_factory=lambda: ROOT / "frontend" / "dist")
    # "claude" = real Claude Code CLI (paid API). "dry" = no API calls, for tests/demo; UI shows a DRY RUN badge.
    executor: str = field(default_factory=lambda: os.environ.get("JARVIS_EXECUTOR", "dry"))
    claude_bin: str = field(default_factory=lambda: os.environ.get("JARVIS_CLAUDE_BIN", "claude"))
    task_timeout_s: int = field(default_factory=lambda: int(os.environ.get("JARVIS_TASK_TIMEOUT", "900")))
    session_hours: int = field(default_factory=lambda: int(os.environ.get("JARVIS_SESSION_HOURS", "12")))
    cookie_secure: bool = field(default_factory=lambda: os.environ.get("JARVIS_COOKIE_SECURE", "0") == "1")

    @property
    def db_path(self) -> Path:
        return self.data_dir / "jarvis_city.db"

settings = Settings()

DEFAULT_LIMITS = {
    "max_parallel_tasks": 2,          # concurrently running agent processes
    "default_task_budget_usd": 0.50,  # passed to claude --max-budget-usd when no budget is given
    "approval_threshold_usd": 1.00,   # a task budget above this is a critical operation (needs confirmation)
    "hard_task_cap_usd": 5.00,        # no single task may have a larger budget
    "daily_budget_usd": 5.00,
    "monthly_budget_usd": 50.00,
    "queue_paused": False,            # kill switch state
}
