export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const r = await fetch(`/api${path}`, {
    method: opts.method ?? (opts.body ? "POST" : "GET"),
    credentials: "same-origin",
    headers: opts.body ? { "Content-Type": "application/json" } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await r.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!r.ok) {
    const d = data?.detail;
    const msg = typeof d === "string" ? d : Array.isArray(d) ? d.map((x: any) => x.msg).join("; ") : `HTTP ${r.status}`;
    throw new ApiError(r.status, msg);
  }
  return data as T;
}

/** Critical operations answer 428 until the password is re-entered. */
export async function withConfirm<T>(call: (pw?: string) => Promise<T>, ask: (reason: string) => Promise<string | null>): Promise<T | null> {
  try { return await call(); }
  catch (e) {
    if (e instanceof ApiError && e.status === 428) {
      const pw = await ask(e.message);
      if (!pw) return null;
      return await call(pw);
    }
    throw e;
  }
}

export const fmtUsd = (v: number | null | undefined) => `$${(v ?? 0).toFixed(v && v < 0.1 ? 4 : 2)}`;
