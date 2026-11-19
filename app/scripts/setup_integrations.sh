#!/usr/bin/env bash
# Creates one isolated virtualenv per integration (pinned versions; their dependency pins conflict with each other).
#   scripts/setup_integrations.sh                 # all
#   scripts/setup_integrations.sh camel langgraph # some
set -euo pipefail
cd "$(dirname "$0")/.."
PY="${PYTHON:-python3}"
ALL="ollama camel langgraph browser_use openhands"
for name in ${@:-$ALL}; do
  req="integrations/$name/requirements.txt"; venv=".venvs/$name"
  [ -f "$req" ] || { echo "unknown integration: $name"; exit 1; }
  [ -d "$venv" ] || "$PY" -m venv "$venv"
  "$venv/bin/pip" install -q --upgrade pip
  "$venv/bin/pip" install -q -r "$req"
  echo "ok: $name -> $venv"
done
