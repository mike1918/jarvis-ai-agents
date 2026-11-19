# Connecting the main JARVIS project

## 1. Install the agents into the JARVIS repo (nothing is overwritten)
```bash
git clone https://github.com/mike1918/jarvis-ai-agents
python3 jarvis-ai-agents/tools/install_into_project.py /path/to/JARVIS                 # dry run: see what would change
python3 jarvis-ai-agents/tools/install_into_project.py /path/to/JARVIS --apply         # all districts
# or only what JARVIS needs (development, design, testing, analytics, automation):
python3 jarvis-ai-agents/tools/install_into_project.py /path/to/JARVIS --apply \
  --districts 00-jarvis,01-core-development,02-language-specialists,03-infrastructure,04-quality-security,05-data-ai,10-research-analysis
```
The installer copies only new files, reports conflicts, adds missing hook entries to `.claude/settings.json`
(backup `.bak`), appends `@.claude/jarvis/AGENTS_PROTOCOL.md` to `CLAUDE.md` and ignores logs/state in `.gitignore`.
Requires `python3` with nothing else for the hooks.

## 2. Make JARVIS the coordinator
- One session: `claude --agent jarvis`
- Always in that repo: add `"agent": "jarvis"` to the JARVIS repo's `.claude/settings.json`.

## 3. Call agents from the JARVIS application code
```python
import subprocess, json
out = subprocess.run(["python3", ".claude/jarvis/bridge.py", "run", task, "--agent", "jarvis", "--from", "jarvis-app"],
                     capture_output=True, text=True, cwd=JARVIS_REPO)
env = json.loads(out.stdout)   # {task_id, from, to, task, status: ok|error|denied, result, cost_usd, duration_ms, session_id, error}
```
Without `--agent`, the bridge routes by task type (router.py). Budgets and parallelism: `.claude/jarvis/limits.json`.
`permission_mode: "default"` = headless runs cannot edit files or run approval-gated commands; switch to
`"acceptEdits"` only for trusted write tasks.

## 4. Check
```bash
cd /path/to/JARVIS && claude -p --agent no-such-agent x   # error message lists every agent Claude Code discovered
tail .claude/jarvis/logs/agents.jsonl
```
