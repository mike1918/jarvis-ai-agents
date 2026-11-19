"""In-process pub/sub for Server-Sent Events."""
import asyncio, json, time
_subs: set[asyncio.Queue] = set()

def subscribe():
    q = asyncio.Queue(maxsize=500); _subs.add(q); return q

def unsubscribe(q): _subs.discard(q)

def publish(kind, **data):
    msg = json.dumps({"kind": kind, "ts": time.time(), **data}, ensure_ascii=False, default=str)
    for q in list(_subs):
        try: q.put_nowait(msg)
        except asyncio.QueueFull: pass
