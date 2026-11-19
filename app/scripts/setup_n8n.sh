#!/usr/bin/env bash
# n8n (n8n-io/n8n, Sustainable Use License) as a separate local service. n8n needs Node >= 24: a private Node is
# downloaded from nodejs.org into .services/node24 (checksum verified); the system Node is not touched.
set -euo pipefail
cd "$(dirname "$0")/.."
NODE_VERSION="${NODE_VERSION:-v24.22.3}"; N8N_VERSION="${N8N_VERSION:-2.48.6}"
ARCH=$(uname -m); case "$ARCH" in x86_64) A=x64;; aarch64|arm64) A=arm64;; *) echo "unsupported arch $ARCH"; exit 1;; esac
OS=$(uname -s | tr A-Z a-z); [ "$OS" = darwin ] || OS=linux
mkdir -p .services && cd .services
if [ ! -x node24/bin/node ]; then
  F="node-$NODE_VERSION-$OS-$A.tar.gz"
  curl -fsSLO "https://nodejs.org/dist/$NODE_VERSION/$F"
  curl -fsSL "https://nodejs.org/dist/$NODE_VERSION/SHASUMS256.txt" | grep " $F\$" | { if command -v sha256sum >/dev/null; then sha256sum -c -; else shasum -a 256 -c -; fi; }
  tar -xzf "$F" && rm "$F" && rm -rf node24 && mv "node-$NODE_VERSION-$OS-$A" node24
fi
export PATH="$PWD/node24/bin:$PATH"
mkdir -p n8n && cd n8n
[ -f package.json ] || echo '{"private":true}' > package.json
npm install --no-audit --no-fund --omit=dev "n8n@$N8N_VERSION" >/dev/null
echo "ok: n8n $N8N_VERSION on node $(node --version)"
