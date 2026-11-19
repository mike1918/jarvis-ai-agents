# JARVIS AI CITY — ASHDOD 4D

A control centre for the [jarvis-ai-agents](https://github.com/mike1918/jarvis-ai-agents) library (126 agents),
shown as an interactive 3D city in the style of Ashdod, Israel. JARVIS is the central coordinator; every agent district
has its own building; tasks are queued, run through Claude Code with budgets, and tracked in a database.

## Quick start
```bash
git clone --recurse-submodules <this repo> && cd jarvis-ai-city
scripts/run.sh                               # DRY RUN: no API calls, no cost
# open http://127.0.0.1:8000 → create the owner account on first run
JARVIS_EXECUTOR=claude scripts/run.sh        # real agents via the Claude Code CLI (must be installed and logged in)
```
Requirements: Python 3.11+, Node 20+, git; for real runs the `claude` CLI.

## Using it
- Click a building → its agents, their specialities, state and recent tasks; "Поставить задачу" prefills `@agent`.
- Click the JARVIS tower (or the logo) → control panel: overview, tasks, approvals, limits, costs and errors, audit, access.
- Command bar: plain text → JARVIS; `@agent text`; `!write text` (may edit files, needs confirmation); `/status`, `/stop`,
  `/resume`, `/cancel N`, `/agents [district]`, `/help`. 🎤 sends the same commands by voice.
- Top bar: simulated time (pause, ×60, ×600, ×3600, LIVE, noon, sunset, night), today's spend, running tasks, **СТОП**.

## Roles
| Role | Can |
|---|---|
| owner | everything; critical operations require re-entering the password |
| operator | read-only tasks within the approval threshold; write/expensive tasks go to the owner for approval; СТОП |
| viewer | look only |

## Configuration (environment)
| Variable | Default | |
|---|---|---|
| `JARVIS_EXECUTOR` | `dry` | `claude` = real runs (paid API) |
| `JARVIS_LIBRARY_DIR` | `vendor/jarvis-ai-agents` | agent library checkout |
| `JARVIS_DATA_DIR` / `JARVIS_WORKSPACE_DIR` | `data/` / `workspace/` | SQLite DB / projects the agents work in |
| `JARVIS_TASK_TIMEOUT` | `900` | seconds per task |
| `JARVIS_COOKIE_SECURE` | `0` | set `1` behind HTTPS |
| `HOST`, `PORT` | `127.0.0.1`, `8000` | `HOST=0.0.0.0` to open from an iPhone on the same network |

Budgets (per task, approval threshold, hard cap, daily, monthly) and parallelism are edited in the tower panel.

## Tests
```bash
cd backend && ../.venv/bin/python -m pytest -q
```
Covers auth and throttling, roles, approvals with password, budgets, parallel limit, kill switch, cancel, failure logging,
and parsing of the Claude Code stream (with a test double for the CLI).

Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
