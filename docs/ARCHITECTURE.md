# Architecture — JARVIS AI CITY (126 → 300 agents)

## Layout
```
.claude/agents/<NN-district>/<agent>.md   # Claude Code loads subfolders; name must be unique across all folders
library/disabled/                          # kept definitions that must not load (agent-installer)
.claude/jarvis/
  city.json          # districts (Ashdod style) = category folders + planned capacity (sum = 300)
  annotations.json   # notes / fixes / auto_route flags that are not Claude Code frontmatter
  registry.json      # GENERATED: every agent with district, model, tools, access level
  REGISTRY.md        # GENERATED: human-readable registry
  routing.json       # task type → agents (RU + EN regex)
  router.py          # routing used by hook, jarvis and bridge
  limits.json        # concurrency / launches / tokens / USD budgets
  bridge.py          # headless entry point for the JARVIS application
  AGENTS_PROTOCOL.md # rules Claude follows (imported from CLAUDE.md)
.claude/hooks/agent_guard.py               # routing hint, safe handoff, limits, journal
tools/agentlib.py                          # validate | build | new | stats
tools/install_into_project.py              # connect the library to another repo (dry-run by default)
.github/workflows/validate-agents.yml      # CI: validation + registry must be regenerated
```

## Districts (city.json)
| Folder | District | Planned |
|---|---|---|
| 00-jarvis | Рова Алеф — Ратуша JARVIS | 3 |
| 01-core-development | Рова Бет — квартал разработчиков | 35 |
| 02-language-specialists | Рова Гимель — квартал языков | 50 |
| 03-infrastructure | Порт Ашдода — инфраструктура | 30 |
| 04-quality-security | Рова Далет — качество и безопасность | 35 |
| 05-data-ai | Рова Хей — научный городок | 25 |
| 06-developer-experience | Рова Вав — мастерские | 15 |
| 07-specialized-domains | Промзона — отрасли | 30 |
| 08-business-product | Сити — деловой центр | 35 |
| 09-meta-orchestration | Рова Зайн — диспетчерская | 15 |
| 10-research-analysis | Рова Хет — библиотека | 27 |

`python3 tools/agentlib.py stats` shows actual vs planned.

## Adding an agent (path to 300)
1. `python3 tools/agentlib.py new <name> --category <folder> --access read-only|research|write|docs --description "Use this agent when ..."`
2. Write the prompt (replace TODOs). One clear speciality; the description says *when* to use it, distinct from neighbours.
3. `python3 tools/agentlib.py validate && python3 tools/agentlib.py build`; add routing keywords to `routing.json` if needed.
4. Commit; CI repeats the validation.

Validation rejects: missing/invalid frontmatter, duplicate names, file/name mismatch, unknown tools, folder not in
city.json, too-short prompt, secret-like tokens, `curl | sh`-style commands, permission-bypass flags,
hidden Unicode control characters. Near-duplicate descriptions are warned about.

## Why not load all 300 everywhere
Every active agent's description is sent with each request (126 agents ≈ 27k characters ≈ 7k tokens; 300 ≈ 16k tokens),
and near-identical descriptions make automatic selection worse. So:
- the library repo has the whole city (all districts) — the bridge can run any agent from here;
- a project such as JARVIS installs only the districts it needs: `install_into_project.py --districts ...`;
- the `jarvis` coordinator picks specialists by router + registry rather than by scanning 300 descriptions.

## Coordination model
```
user / JARVIS app ──► claude --agent jarvis (main session, has Agent tool)
                           │  router.py + REGISTRY.md → 1–3 specialists
                           ├─► specialist subagents (cannot spawn further agents)
                           │      guard hook: allowlist, secret check, concurrency, launch & token limits, journal
                           └─► verifies results → one answer
JARVIS app (code) ──► bridge.py run "task" [--agent X | --agent jarvis]  → JSON envelope, USD budget per run/day
```
