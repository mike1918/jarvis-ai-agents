# Integrations: OpenHands, CAMEL, LangGraph, browser-use, Ollama, three.js

All six projects are connected as **packages or separate services** — no source code is copied into this repository.

| Project | How it is connected | Pinned version | Runtime id |
|---|---|---|---|
| [OpenHands](https://github.com/OpenHands/OpenHands) | separate service: OpenHands **agent-server** (`openhands-agent-server`) + official Python client (`openhands-sdk`, `openhands-tools`, `openhands-workspace`). The OpenHands repo itself is the Agent Canvas UI; it talks to the same agent-server, so Canvas can be pointed at it too | 1.62.0 | `openhands` |
| [CAMEL](https://github.com/camel-ai/camel) | PyPI `camel-ai` (+ `mcp==1.30.0`, see below) | 0.2.90 | `camel` |
| [LangGraph](https://github.com/langchain-ai/langgraph) | PyPI `langgraph` | 1.2.23 | `langgraph` |
| [browser-use](https://github.com/browser-use/browser-use) | PyPI `browser-use` with a **local** Chromium (never Browser Use Cloud), telemetry off | 1.0.6 | `browser_use` |
| [Ollama](https://github.com/ollama/ollama) | separate service on the user's machine; used through its OpenAI-compatible API `http://127.0.0.1:11434/v1` | any | `ollama` (and the LLM for all runtimes above) |
| [three.js](https://github.com/mrdoob/three.js) | npm `three` (already the 3D engine of the city, with `@react-three/fiber` and `drei`) | 0.169.0 | — |

## Architecture
```
City UI ──► FastAPI backend (queue, budgets, approvals, journal, kill switch)
              │  task.runtime = claude | dry | ollama | langgraph | camel | browser_use | openhands
              ├─ claude  → claude -p --agent X (stream-json)
              └─ others  → integrations/<name>/worker.py   (own venv: .venvs/<name>)
                             stdin: JSON task   stdout: JSON-line events (same shapes as Claude Code)
                             │
                             ├─ LLM: OpenAI-compatible endpoint = Ollama (JARVIS_LLM_BASE_URL)
                             ├─ browser_use → local Chromium
                             └─ openhands   → OpenHands agent-server (JARVIS_OPENHANDS_URL)
```
Why one venv per integration: their pins conflict (browser-use 1.0.6 pins pydantic 2.14.3; openhands pulls
browser-use 0.11.x and pydantic 2.14.4; camel-ai breaks with mcp 2.x). Each worker is a separate process, so the
kill switch (SIGTERM to the process group), timeouts and per-task budgets apply to all of them.

Every worker uses the library agents: the agent's system prompt is read from its `.md` definition; LangGraph and
CAMEL also use the library router and the `jarvis` coordinator prompt. Events (`agent.started/stopped`,
`tool.started/completed/failed`, `task.progress`) drive the same figures, rooms and journal in the city.

## Setup
```bash
cd app
scripts/setup_integrations.sh                 # all five Python integrations (≈ 0.9 GB in .venvs/, git-ignored)
# Ollama (free, local): install from https://ollama.com, then e.g.
ollama pull qwen2.5:7b
export JARVIS_LLM_MODEL=qwen2.5:7b            # default base URL http://127.0.0.1:11434/v1
# OpenHands agent-server (needed only for #openhands):
export SESSION_API_KEY=$(python3 -c "import secrets;print(secrets.token_hex(16))")
scripts/run_openhands_server.sh &             # 127.0.0.1:8100
export JARVIS_OPENHANDS_API_KEY_ENV=SESSION_API_KEY   # the city reads the key from this env var (never stored)
scripts/run.sh
```
Use a runtime from the command bar selector or with a prefix: `#langgraph найди баг в calc.py и напиши тесты`,
`#ollama @debugger …`, `#camel @debugger …`, `#browser_use @ui-ux-tester …`, `#openhands @python-pro …`.
The tower → «Интеграции» tab shows which runtimes are ready and why not.

## Settings (environment variables, no secrets in files)
| Variable | Default | Meaning |
|---|---|---|
| `JARVIS_LLM_BASE_URL` | `http://127.0.0.1:11434/v1` | OpenAI-compatible endpoint (Ollama). Non-local URL ⇒ runtimes count as paid |
| `JARVIS_LLM_MODEL` | `qwen2.5:7b` | model name on that endpoint |
| `JARVIS_LLM_API_KEY_ENV` | — | *name* of the env var holding a key for a non-local endpoint |
| `JARVIS_OPENHANDS_URL` | `http://127.0.0.1:8100` | agent-server |
| `JARVIS_OPENHANDS_API_KEY_ENV` | — | *name* of the env var holding the agent-server session key |
| `JARVIS_CHROMIUM_PATH` | auto | Chromium/Chrome for browser-use |
| `JARVIS_MAX_TURNS`, `JARVIS_MAX_SPECIALISTS` | 2, 3 | CAMEL dialogue turns, LangGraph specialists |

## Safety and budget rules
- `browser_use` (acts on the web) and `openhands` (runs commands, edits files) are **critical**: every task needs
  the owner's password (operators' tasks go to the approval queue).
- Runtimes on a local LLM endpoint are free and keep working when the paid daily/monthly budget is exhausted;
  `claude` (and any runtime on a non-local endpoint) is blocked by the budget. Costs of non-local endpoints are not
  measured by the workers — use Ollama or Claude Code for tracked spending.
- browser-use: `ANONYMIZED_TELEMETRY=false`, `BROWSER_USE_AUTO_LOGIN=false`, local browser only.
- OpenHands agent-server without Docker runs on the host (as its docs warn); it is bound to 127.0.0.1 and protected
  by `SESSION_API_KEY` (verified: 401 without the key).
- CAMEL's default token counter downloads a tiktoken vocabulary from the internet; the worker uses an offline
  estimate instead so fully local setups work.

## Tests (`backend/tests/test_integrations.py`)
A scripted OpenAI-compatible endpoint (`integrations/tests/fake_llm_server.py`, a **test double** standing in for
Ollama) lets the real library code run end-to-end without a model:
| Runtime | What the test proves |
|---|---|
| ollama | worker → chat completion → result, tool events, cost 0 |
| langgraph | real StateGraph: router picks debugger, error-detective, test-automator; city gets agent.started/stopped; states “completed” |
| camel | two camel-ai ChatAgents: specialist answers, coordinator closes the dialogue |
| browser_use | owner confirmation required (428); browser-use 1.0 drives a real local Chromium and reads a real page title |
| openhands | real agent-server; the agent runs `cat calc.py` in the project via the SDK and finishes |
Not verified here: answer quality with a real Ollama model (the container cannot download models), OpenHands in
Docker, browser-use on real websites.
