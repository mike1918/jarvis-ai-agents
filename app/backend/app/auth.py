"""Owner authentication, roles and permissions. Passwords: scrypt; sessions: random token, only its hash is stored."""
import hashlib, hmac, os, secrets, time
from collections import defaultdict
from fastapi import Depends, HTTPException, Request
from . import db
from .config import settings

COOKIE = "jarvis_session"
PERMS = {
    "viewer":   {"read"},
    "operator": {"read", "task.create", "task.cancel_own", "command", "voice", "stop"},
    "owner":    {"read", "task.create", "task.cancel_own", "task.cancel_any", "task.write_mode", "command", "voice", "stop",
                 "resume", "approve", "limits.update", "project.manage", "users.manage", "audit.read"},
}

def hash_pw(pw: str) -> str:
    salt = os.urandom(16)
    h = hashlib.scrypt(pw.encode(), salt=salt, n=2**14, r=8, p=1, dklen=32)
    return f"scrypt${salt.hex()}${h.hex()}"

def check_pw(pw: str, stored: str) -> bool:
    try:
        _, salt, h = stored.split("$")
        calc = hashlib.scrypt(pw.encode(), salt=bytes.fromhex(salt), n=2**14, r=8, p=1, dklen=32)
        return hmac.compare_digest(calc.hex(), h)
    except Exception:
        return False

def validate_password(pw: str):
    if len(pw) < 10: raise ValueError("password must be at least 10 characters")

def create_user(username, password, role):
    validate_password(password)
    if role not in PERMS: raise ValueError("bad role")
    return db.ex("INSERT INTO users(username,pw_hash,role,created_at) VALUES(?,?,?,?)", (username, hash_pw(password), role, time.time()))

def owner_exists():
    return db.q1("SELECT id FROM users WHERE role='owner' AND disabled=0") is not None

_fails = defaultdict(list)
def throttle(ip):
    now = time.time(); _fails[ip] = [t for t in _fails[ip] if now - t < 60]
    if len(_fails[ip]) >= 5: raise HTTPException(429, "too many failed logins, wait a minute")

def login(username, password, ip):
    throttle(ip)
    u = db.q1("SELECT * FROM users WHERE username=? AND disabled=0", (username,))
    if not u or not check_pw(password, u["pw_hash"]):
        _fails[ip].append(time.time()); db.audit(None, "login.failed", username, ip=ip, ok=False)
        raise HTTPException(401, "invalid credentials")
    token = secrets.token_urlsafe(32)
    db.ex("INSERT INTO sessions VALUES(?,?,?,?)", (hashlib.sha256(token.encode()).hexdigest(), u["id"], time.time(),
                                                  time.time() + settings.session_hours * 3600))
    db.audit(u, "login", ip=ip)
    return token, u

def logout(token):
    db.ex("DELETE FROM sessions WHERE token_hash=?", (hashlib.sha256(token.encode()).hexdigest(),))

def _token(request: Request):
    t = request.cookies.get(COOKIE)
    h = request.headers.get("authorization", "")
    if h.lower().startswith("bearer "): t = h[7:]
    return t

TOKEN_PREFIX = "jat_"

def create_api_token(owner, name, role):
    """Long-lived token for services such as n8n. Shown once; only its hash is stored."""
    if role not in ("operator", "viewer"): raise ValueError("role must be operator or viewer")
    token = TOKEN_PREFIX + secrets.token_urlsafe(32)
    tid = db.ex("INSERT INTO api_tokens(name,token_hash,role,created_by,created_at) VALUES(?,?,?,?,?)",
                (name, hashlib.sha256(token.encode()).hexdigest(), role, owner["id"], time.time()))
    return tid, token

def current_user(request: Request):
    t = _token(request)
    if not t: raise HTTPException(401, "not logged in")
    if t.startswith(TOKEN_PREFIX):
        r = db.q1("SELECT id,name,role FROM api_tokens WHERE token_hash=? AND revoked=0", (hashlib.sha256(t.encode()).hexdigest(),))
        if not r: raise HTTPException(401, "invalid or revoked API token")
        db.ex("UPDATE api_tokens SET last_used=? WHERE id=?", (time.time(), r["id"]))
        # service principal: negative id so it can never collide with a human user
        return {"id": -r["id"], "username": f"token:{r['name']}", "role": r["role"], "perms": sorted(PERMS[r["role"]])}
    s = db.q1("SELECT u.id,u.username,u.role FROM sessions s JOIN users u ON u.id=s.user_id "
              "WHERE s.token_hash=? AND s.expires_at>? AND u.disabled=0", (hashlib.sha256(t.encode()).hexdigest(), time.time()))
    if not s: raise HTTPException(401, "session expired")
    s["perms"] = sorted(PERMS[s["role"]]); return s

def need(perm):
    def dep(user=Depends(current_user)):
        if perm not in PERMS[user["role"]]: raise HTTPException(403, f"permission '{perm}' required")
        return user
    return dep

def confirm_password(user, password):
    """Critical operations require re-entering the password (explicit confirmation)."""
    u = db.q1("SELECT pw_hash FROM users WHERE id=?", (user["id"],))
    if not password or not check_pw(password, u["pw_hash"]):
        raise HTTPException(428, "confirmation required: re-enter your password to confirm this critical operation")
