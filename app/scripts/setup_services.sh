#!/usr/bin/env bash
# Local AI services for the city: memory (Chroma), voice (whisper.cpp + Piper), agent tools (MCP servers).
#   scripts/setup_services.sh                  # all
#   scripts/setup_services.sh whisper piper    # some
# Models are NOT downloaded automatically (they are large): see docs/INTEGRATIONS.md -> "Voice and memory models".
set -euo pipefail
cd "$(dirname "$0")/.."
PY="${PYTHON:-python3}"
WHISPER_TAG="${WHISPER_TAG:-v1.9.5}"
venv() { [ -d ".venvs/$1" ] || "$PY" -m venv ".venvs/$1"; ".venvs/$1/bin/pip" install -q --upgrade pip; ".venvs/$1/bin/pip" install -q -r "integrations/$1/requirements.txt"; }
for s in ${@:-chroma piper mcp whisper}; do
  case "$s" in
    chroma|piper) venv "$s" ;;
    mcp) venv mcp
         mkdir -p .services/mcp-node && cp integrations/mcp/package.json .services/mcp-node/
         (cd .services/mcp-node && npm install --no-audit --no-fund --omit=dev >/dev/null) ;;
    whisper)
      mkdir -p .services
      [ -d .services/whisper.cpp ] || git clone -q --depth 1 --branch "$WHISPER_TAG" https://github.com/ggml-org/whisper.cpp .services/whisper.cpp
      cmake -S .services/whisper.cpp -B .services/whisper.cpp/build -DCMAKE_BUILD_TYPE=Release -DWHISPER_BUILD_TESTS=OFF >/dev/null
      cmake --build .services/whisper.cpp/build --target whisper-server -j "$(nproc 2>/dev/null || echo 4)" >/dev/null ;;
    *) echo "unknown service: $s"; exit 1 ;;
  esac
  echo "ok: $s"
done
