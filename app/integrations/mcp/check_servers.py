"""Starts every configured MCP server over stdio (official MCP Python client), lists its tools and calls one
harmless tool. Usage: .venvs/mcp/bin/python integrations/mcp/check_servers.py <project_dir>"""
import asyncio, json, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

PROBES = {"filesystem": ("list_directory", lambda p: {"path": p}), "git": ("git_status", lambda p: {"repo_path": p}),
          "time": ("get_current_time", lambda p: {"timezone": "Asia/Jerusalem"}), "fetch": (None, None)}

async def check(name, spec, project):
    params = StdioServerParameters(command=spec["command"], args=spec["args"], env={**os.environ})
    async with stdio_client(params) as (r, w):
        async with ClientSession(r, w) as s:
            await s.initialize()
            tools = [t.name for t in (await s.list_tools()).tools]
            tool, args = PROBES.get(name, (None, None))
            out = ""
            if tool and tool in tools:
                res = await s.call_tool(tool, args(project))
                out = " ".join(getattr(c, "text", "") for c in res.content)[:120].replace("\n", " ")
            return {"server": name, "tools": tools, "probe": tool, "output": out}

async def main(project):
    from app.services import mcp_config
    cfg = mcp_config(project)["mcpServers"]
    for name, spec in cfg.items():
        try:
            print(json.dumps(await asyncio.wait_for(check(name, spec, project), 60), ensure_ascii=False))
        except Exception as e:  # noqa: BLE001
            print(json.dumps({"server": name, "error": f"{type(e).__name__}: {e}"[:300]}))

if __name__ == "__main__":
    asyncio.run(main(os.path.abspath(sys.argv[1])))
