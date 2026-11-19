#!/usr/bin/env bash
# OpenHands agent-server as a separate local service for the "openhands" runtime.
# WARNING: without Docker the agent runs directly on this machine (it can run commands and edit files in the
# project it is given). The city asks the owner to confirm every openhands task. Bound to 127.0.0.1 only.
#   SESSION_API_KEY=<random> scripts/run_openhands_server.sh   (then set JARVIS_OPENHANDS_API_KEY_ENV=SESSION_API_KEY for the city)
set -euo pipefail
cd "$(dirname "$0")/.."
[ -x .venvs/openhands/bin/python ] || scripts/setup_integrations.sh openhands
exec .venvs/openhands/bin/python -m openhands.agent_server --host 127.0.0.1 --port "${OPENHANDS_PORT:-8100}"
