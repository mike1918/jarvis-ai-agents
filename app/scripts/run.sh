#!/usr/bin/env bash
# JARVIS AI CITY — ASHDOD 4D: install, build and start.
#   scripts/run.sh            -> DRY RUN (no Claude API calls, no cost)
#   JARVIS_EXECUTOR=claude scripts/run.sh   -> real agents through the Claude Code CLI (paid API, capped by limits)
#   HOST=0.0.0.0 scripts/run.sh              -> reachable from an iPhone on the same network
set -euo pipefail
cd "$(dirname "$0")/.."
if [ ! -f ../.claude/jarvis/registry.json ]; then git submodule update --init vendor/jarvis-ai-agents; fi  # standalone checkout
[ -d .venv ] || python3 -m venv .venv
.venv/bin/pip install -q -r backend/requirements.txt
(cd frontend && npm ci --no-audit --no-fund && npm run build)
export JARVIS_EXECUTOR="${JARVIS_EXECUTOR:-dry}"
echo "executor: $JARVIS_EXECUTOR  ->  http://${HOST:-127.0.0.1}:${PORT:-8000}/"
cd backend && exec ../.venv/bin/uvicorn app.main:app --host "${HOST:-127.0.0.1}" --port "${PORT:-8000}"
