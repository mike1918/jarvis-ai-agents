# JARVIS AI CITY — ASHDOD 4D: architecture

## What already existed (library `mike1918/jarvis-ai-agents` @ ee15e42) and is reused, not copied
| Library component | Used here for |
|---|---|
| `.claude/agents/**` (126 active agents incl. `jarvis`) | executed via `claude -p --agent NAME` in a project dir |
| `.claude/jarvis/registry.json`, `city.json` | agent list, districts → buildings, planned capacity 300 |
| `.claude/jarvis/router.py` + `routing.json` | task-type hints in the UI and stored with each task |
| `.claude/hooks/agent_guard.py` | its `SECRET_RX` blocks secrets in tasks; the hook itself limits subagents inside each run |
| `tools/install_into_project.py` | installs agents + hooks into every workspace project (no overwrite) |

The library is a git submodule at `vendor/jarvis-ai-agents`, pinned to a commit. Nothing in it is modified.

## Components
```
Browser (desktop / iPhone, React + Three.js)
  ├─ 3D city (city/*): sea, beach, marina, port with ships & cranes, residential quarters, roads, traffic,
  │  tech park: one building per district, central JARVIS tower; 4D clock: day/night, lights, moving traffic
  ├─ panels: district → agents (speciality, state, tasks); tower → control panel
  ├─ command bar: text commands; voice module (Web Speech API) feeds the same command endpoint
  └─ SSE /api/events for live state
FastAPI backend (backend/app)
  ├─ auth.py      owner/operator/viewer, scrypt passwords, hashed session tokens, login throttling, password re-entry
  ├─ tasks.py     command parser, agent allowlist, secret check, budgets, critical-operation rules, approvals
  ├─ engine.py    queue (priority, FIFO), max parallel runs, daily/monthly budget gate, cancel, kill switch
  ├─ executor.py  claude -p --agent X --output-format stream-json --max-budget-usd B --permission-mode default|acceptEdits
  │               parses init/tool_use(Agent)/tool_result/result → session, delegated specialists, cost, usage
  ├─ library.py   read-only access to the submodule (registry, city, router, installer)
  └─ db.py        SQLite (WAL): users, sessions, projects, tasks, task_events, errors, costs, approvals, audit, settings
Workspace: workspace/<project>/ (git repo with the library agents installed) — agents run with cwd there
```

## Task flow
1. Text or voice command → `/api/commands`. Plain text goes to **jarvis** (coordinator); `@agent text` targets one agent;
   `!write` requests file-editing permission.
2. Checks: agent exists and is active, no secret-like tokens, budget within the hard cap and the remaining daily/monthly budget.
3. Critical operation (write mode, or budget above the approval threshold):
   owner → must re-enter password; operator → task waits in **awaiting_approval** until the owner approves (with password).
4. Engine starts up to `max_parallel_tasks` processes; each run is capped by `--max-budget-usd`, timeout, and the library's
   guard hook (≤3 concurrent subagents, launch and token limits inside the run).
5. Streamed events update the city live: the agent's building glows; when jarvis delegates (`Agent` tool), the specialist's
   building glows too.
6. Result, cost, tokens, events and errors are stored; everything a user does is written to the audit log.

## Safety controls
- Kill switch (`/stop`, top-bar **СТОП**, operators too): pauses the queue and SIGTERMs every running process group.
  Resuming needs the owner and the password.
- Read mode uses `--permission-mode default`: in headless mode anything that needs approval (edits, most shell commands) is refused.
- Limits are editable only by the owner with password; every change is audited with old → new values.
- Session cookie: httpOnly, SameSite=Strict (Secure with `JARVIS_COOKIE_SECURE=1` behind HTTPS); CSP `default-src 'self'`.

## 4D simulation
Simulated Asia/Jerusalem clock (pause, ×60, ×600, ×3600, LIVE). The sun rises over the land and sets into the sea;
sky, fog, sea colour, sun/moon light, lit windows, street lamps, head/tail lights and the stars follow the sun.
Traffic, ships, sailboats, cranes and waves move with animation time that speeds up with the clock.

## Scaling to 300 agents
Districts and buildings come from the library's `city.json` and `registry.json`; a new agent added in the library
(`tools/agentlib.py new`) appears in its building after updating the submodule — no code change here.

## Not done / limits
- Voice recognition availability depends on the browser (Safari iOS 14.5+, Chrome). It needs HTTPS when used from a phone.
- Running from an iPhone needs the server reachable from the phone (same Wi-Fi with `HOST=0.0.0.0`, or a deployment behind HTTPS).
- Costs come from the Claude Code CLI's `total_cost_usd`; account-level spend limits are set in the Anthropic Console.
