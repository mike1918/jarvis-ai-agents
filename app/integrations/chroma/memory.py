"""City memory on Chroma (chroma-core/chroma, embedded PersistentClient).

  memory.py add     stdin {"id", "document", "metadata"}          → {"ok": true}
  memory.py search  stdin {"query", "n", "where"?}                  → {"ok": true, "results": [{id, document, metadata, distance}]}
  memory.py stats                                                   → {"ok": true, "count": N}

Embeddings come from the same local OpenAI-compatible endpoint as the agents (Ollama: POST /v1/embeddings,
e.g. model nomic-embed-text), so nothing is downloaded and no text leaves the machine. Chroma's built-in
embedding model is not used (it downloads a model from the internet on first use).
Env: JARVIS_MEMORY_DIR, JARVIS_LLM_BASE_URL, JARVIS_EMBED_MODEL, JARVIS_LLM_API_KEY_ENV.
"""
import json, os, sys
import httpx

_OUT = sys.stdout
sys.stdout = sys.stderr   # keep library prints out of the JSON answer


def answer(obj):
    _OUT.write(json.dumps(obj, ensure_ascii=False) + "\n"); _OUT.flush()


def embed(texts):
    base = os.environ.get("JARVIS_LLM_BASE_URL", "http://127.0.0.1:11434/v1").rstrip("/")
    model = os.environ.get("JARVIS_EMBED_MODEL", "nomic-embed-text")
    key = os.environ.get(os.environ.get("JARVIS_LLM_API_KEY_ENV", "") or "", "") or "ollama"
    r = httpx.post(f"{base}/embeddings", json={"model": model, "input": texts}, headers={"Authorization": f"Bearer {key}"}, timeout=120)
    r.raise_for_status()
    return [d["embedding"] for d in sorted(r.json()["data"], key=lambda d: d["index"])]


def collection():
    import chromadb
    from chromadb.config import Settings
    path = os.environ.get("JARVIS_MEMORY_DIR", os.path.join(os.path.dirname(__file__), "..", "..", "data", "chroma"))
    client = chromadb.PersistentClient(path=path, settings=Settings(anonymized_telemetry=False))
    return client.get_or_create_collection("city_results", embedding_function=None, metadata={"hnsw:space": "cosine"})


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    req = json.loads(sys.stdin.read() or "{}") if cmd in ("add", "search") else {}
    col = collection()
    if cmd == "add":
        doc = str(req["document"])[:8000]
        meta = {k: v for k, v in (req.get("metadata") or {}).items() if isinstance(v, (str, int, float, bool))}
        col.upsert(ids=[str(req["id"])], documents=[doc], metadatas=[meta or {"source": "city"}], embeddings=embed([doc]))
        return answer({"ok": True})
    if cmd == "search":
        if col.count() == 0:
            return answer({"ok": True, "results": []})
        r = col.query(query_embeddings=embed([str(req["query"])[:4000]]), n_results=min(int(req.get("n", 3)), col.count()),
                      where=req.get("where") or None)
        out = [{"id": i, "document": d, "metadata": m, "distance": round(float(s), 4)}
               for i, d, m, s in zip(r["ids"][0], r["documents"][0], r["metadatas"][0], r["distances"][0])]
        return answer({"ok": True, "results": out})
    if cmd == "stats":
        return answer({"ok": True, "count": col.count()})
    answer({"ok": False, "error": f"unknown command {cmd!r}"})


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # noqa: BLE001
        answer({"ok": False, "error": f"{type(e).__name__}: {e}"[:500]})
