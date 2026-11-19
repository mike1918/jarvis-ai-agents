"""API tokens for services and the n8n integration in both directions.
The end-to-end tests need a running n8n with the example workflows (scripts/run_n8n.sh) — skipped otherwise."""
import os, time
import httpx
import pytest
from conftest import OWNER, client, wait_status   # noqa: F401  (client fixture)

PW = OWNER[1]
N8N = os.environ.get("JARVIS_N8N_URL", "http://127.0.0.1:5678")


def test_api_token_lifecycle(client):
    assert client.post("/api/tokens", json={"name": "n8n", "role": "operator"}).status_code == 428
    t = client.post("/api/tokens", json={"name": "n8n", "role": "operator", "confirm_password": PW}).json()
    assert t["token"].startswith("jat_") and t["role"] == "operator"
    listed = client.get("/api/tokens").json()
    assert listed[0]["name"] == "n8n" and "token" not in listed[0] and "token_hash" not in listed[0]
    client.cookies.clear()
    h = {"Authorization": f"Bearer {t['token']}"}
    assert client.get("/api/me", headers=h).json()["username"] == "token:n8n"
    r = client.post("/api/commands", json={"text": "@debugger check calc.py"}, headers=h)
    assert r.status_code == 200 and r.json()["task"]["created_by"] < 0                     # service principal
    assert client.get("/api/audit", headers=h).status_code == 403                          # operator rights only
    assert client.post("/api/commands", json={"text": "!write fix it"}, headers=h).json()["task"]["status"] == "awaiting_approval"
    client.post("/api/login", json={"username": OWNER[0], "password": PW})
    assert any(a["action"] == "task.create" and a["username"] == "token:n8n" for a in client.get("/api/audit").json())
    client.delete(f"/api/tokens/{t['id']}")
    client.cookies.clear()
    assert client.get("/api/me", headers=h).status_code == 401                              # revoked


def n8n_up():
    try:
        return httpx.get(f"{N8N}/healthz", timeout=2).status_code == 200
    except Exception:
        return False


def test_city_to_n8n_runtime(client):
    if not n8n_up(): pytest.skip("n8n is not running (scripts/run_n8n.sh)")
    r = client.post("/api/commands", json={"text": "#n8n @port-logistics-planner book a container slot"})
    assert r.status_code == 428                                                            # external automation → confirmation
    t = client.post("/api/commands", json={"text": "#n8n @port-logistics-planner book a container slot", "confirm_password": PW}).json()["task"]
    t = wait_status(client, t["id"], {"succeeded", "failed"}, timeout=60)
    assert t["status"] == "succeeded", t["error"]
    assert f"received task #{t['id']} for port-logistics-planner" in t["result"]           # answer built by the n8n Code node

# n8n → city is verified against a real running city server (n8n cannot reach the in-process TestClient):
# see docs/INTEGRATIONS.md → n8n → "Verified here".
