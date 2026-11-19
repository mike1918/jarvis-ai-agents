#!/usr/bin/env bash
# n8n as a local service for the city (127.0.0.1:5678), telemetry off. Imports and publishes the example
# workflows from integrations/n8n/workflows on every start (idempotent: same workflow ids).
# For the "n8n -> city" workflow create a city API token (tower -> Доступ, or POST /api/tokens) and pass it here:
#   JARVIS_CITY_TOKEN=jat_... scripts/run_n8n.sh
set -euo pipefail
cd "$(dirname "$0")/.."
[ -x .services/n8n/node_modules/.bin/n8n ] || scripts/setup_n8n.sh
export PATH="$PWD/.services/node24/bin:$PATH"
export N8N_USER_FOLDER="$PWD/.services/n8n-data"
export N8N_HOST=127.0.0.1 N8N_LISTEN_ADDRESS=127.0.0.1 N8N_PORT="${N8N_PORT:-5678}" N8N_PROTOCOL=http
export N8N_DIAGNOSTICS_ENABLED=false N8N_VERSION_NOTIFICATIONS_ENABLED=false N8N_PERSONALIZATION_ENABLED=false
export N8N_TEMPLATES_ENABLED=false N8N_HIRING_BANNER_ENABLED=false
export N8N_BLOCK_ENV_ACCESS_IN_NODE=false               # workflows read JARVIS_CITY_URL / JARVIS_CITY_TOKEN from the environment
export JARVIS_CITY_URL="${JARVIS_CITY_URL:-http://127.0.0.1:8000}"
N8N=.services/n8n/node_modules/.bin/n8n
mkdir -p "$N8N_USER_FOLDER"
for wf in integrations/n8n/workflows/*.json; do
  "$N8N" import:workflow --input="$wf" >/dev/null
  id=$(python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['id'])" "$wf")
  "$N8N" publish:workflow --id="$id" >/dev/null 2>&1 || "$N8N" update:workflow --id="$id" --active=true >/dev/null
done
exec "$N8N" start
