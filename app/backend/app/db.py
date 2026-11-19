"""SQLite storage: users, sessions, projects, tasks, task events, errors, costs, approvals, audit, settings."""
import json, sqlite3, threading, time
from contextlib import contextmanager
from .config import settings, DEFAULT_LIMITS

SCHEMA = """
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL, pw_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('owner','operator','viewer')), disabled INTEGER DEFAULT 0, created_at REAL NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
  created_at REAL NOT NULL, expires_at REAL NOT NULL);
CREATE TABLE IF NOT EXISTS projects(id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, path TEXT NOT NULL,
  created_by INTEGER, created_at REAL NOT NULL, agents_installed INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS tasks(id INTEGER PRIMARY KEY, project_id INTEGER NOT NULL REFERENCES projects(id),
  agent TEXT NOT NULL, prompt TEXT NOT NULL, mode TEXT NOT NULL CHECK(mode IN ('read','write')),
  status TEXT NOT NULL CHECK(status IN ('awaiting_approval','queued','running','succeeded','failed','cancelled','rejected')),
  priority INTEGER DEFAULT 0, max_budget_usd REAL NOT NULL, source TEXT DEFAULT 'text', suggested TEXT,
  created_by INTEGER, created_at REAL NOT NULL, started_at REAL, finished_at REAL,
  cost_usd REAL DEFAULT 0, result TEXT, error TEXT, session_id TEXT, executor TEXT, delegated TEXT DEFAULT '[]');
CREATE INDEX IF NOT EXISTS tasks_status ON tasks(status);
CREATE TABLE IF NOT EXISTS task_events(id INTEGER PRIMARY KEY, task_id INTEGER NOT NULL, ts REAL NOT NULL, kind TEXT NOT NULL, data TEXT);
CREATE INDEX IF NOT EXISTS task_events_task ON task_events(task_id);
CREATE TABLE IF NOT EXISTS errors(id INTEGER PRIMARY KEY, ts REAL NOT NULL, task_id INTEGER, agent TEXT, kind TEXT, message TEXT);
CREATE TABLE IF NOT EXISTS costs(id INTEGER PRIMARY KEY, ts REAL NOT NULL, task_id INTEGER, agent TEXT, usd REAL NOT NULL,
  input_tokens INTEGER DEFAULT 0, output_tokens INTEGER DEFAULT 0, cache_tokens INTEGER DEFAULT 0, model TEXT);
CREATE TABLE IF NOT EXISTS approvals(id INTEGER PRIMARY KEY, ts REAL NOT NULL, kind TEXT NOT NULL, payload TEXT NOT NULL,
  reason TEXT, requested_by INTEGER, status TEXT NOT NULL DEFAULT 'pending', decided_by INTEGER, decided_at REAL);
CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY, ts REAL NOT NULL, user_id INTEGER, username TEXT,
  action TEXT NOT NULL, target TEXT, detail TEXT, ip TEXT, ok INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS api_tokens(id INTEGER PRIMARY KEY, name TEXT NOT NULL, token_hash TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('operator','viewer')), created_by INTEGER, created_at REAL NOT NULL, last_used REAL, revoked INTEGER DEFAULT 0);
"""
_lock = threading.RLock()
_conn = None

def connect():
    global _conn
    if _conn is None:
        settings.data_dir.mkdir(parents=True, exist_ok=True)
        _conn = sqlite3.connect(settings.db_path, check_same_thread=False, isolation_level=None)
        _conn.row_factory = sqlite3.Row
        _conn.execute("PRAGMA journal_mode=WAL"); _conn.execute("PRAGMA foreign_keys=ON")
        _conn.executescript(SCHEMA)
        cols = {r[1] for r in _conn.execute("PRAGMA table_info(tasks)")}
        if "runtime" not in cols:
            _conn.execute("ALTER TABLE tasks ADD COLUMN runtime TEXT")
    return _conn

def reset_for_tests():
    global _conn
    if _conn: _conn.close()
    _conn = None

@contextmanager
def tx():
    c = connect()
    with _lock:
        c.execute("BEGIN IMMEDIATE")
        try:
            yield c; c.execute("COMMIT")
        except Exception:
            c.execute("ROLLBACK"); raise

def q(sql, args=()):
    with _lock: return [dict(r) for r in connect().execute(sql, args).fetchall()]

def q1(sql, args=()):
    r = q(sql, args); return r[0] if r else None

def ex(sql, args=()):
    with _lock:
        cur = connect().execute(sql, args); return cur.lastrowid

def get_limits():
    lim = dict(DEFAULT_LIMITS)
    for r in q("SELECT key, value FROM settings WHERE key LIKE 'limit.%'"):
        lim[r["key"][6:]] = json.loads(r["value"])
    return lim

def set_limit(key, value):
    ex("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (f"limit.{key}", json.dumps(value)))

def spent_since(ts):
    return round(q1("SELECT COALESCE(SUM(usd),0) s FROM costs WHERE ts>=?", (ts,))["s"], 6)

def day_start():
    t = time.localtime(); return time.mktime((t.tm_year, t.tm_mon, t.tm_mday, 0, 0, 0, 0, 0, -1))

def month_start():
    t = time.localtime(); return time.mktime((t.tm_year, t.tm_mon, 1, 0, 0, 0, 0, 0, -1))

def audit(user, action, target=None, detail=None, ip=None, ok=True):
    ex("INSERT INTO audit(ts,user_id,username,action,target,detail,ip,ok) VALUES(?,?,?,?,?,?,?,?)",
       (time.time(), user and user.get("id"), user and user.get("username"), action, target,
        json.dumps(detail, ensure_ascii=False) if detail is not None else None, ip, 1 if ok else 0))
