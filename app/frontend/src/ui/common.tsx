import { createContext, ReactNode, useCallback, useContext, useRef, useState } from "react";

type Ask = (reason: string) => Promise<string | null>;
interface Ctx { ask: Ask; toast: (msg: string, kind?: "ok" | "err") => void }
const C = createContext<Ctx>({ ask: async () => null, toast: () => {} });
export const useUi = () => useContext(C);

/** Password confirmation for critical operations + toasts. */
export function UiProvider({ children }: { children: ReactNode }) {
  const [req, setReq] = useState<{ reason: string } | null>(null);
  const [pw, setPw] = useState("");
  const resolver = useRef<(v: string | null) => void>();
  const [toasts, setToasts] = useState<{ id: number; msg: string; kind: string }[]>([]);
  const ask = useCallback<Ask>((reason) => new Promise((res) => { resolver.current = res; setPw(""); setReq({ reason }); }), []);
  const done = (v: string | null) => { resolver.current?.(v); setReq(null); setPw(""); };
  const toast = useCallback((msg: string, kind: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);
  return (
    <C.Provider value={{ ask, toast }}>
      {children}
      {req && (
        <div className="modal-back" role="dialog" aria-modal="true">
          <form className="modal" onSubmit={(e) => { e.preventDefault(); done(pw); }}>
            <h3>⚠️ Подтверждение критической операции</h3>
            <p className="muted">{req.reason}</p>
            <input type="password" autoFocus placeholder="Пароль владельца" value={pw} onChange={(e) => setPw(e.target.value)}
              autoComplete="current-password" />
            <div className="row end">
              <button type="button" className="ghost" onClick={() => done(null)}>Отмена</button>
              <button type="submit" className="danger" disabled={!pw}>Подтвердить</button>
            </div>
          </form>
        </div>
      )}
      <div className="toasts">{toasts.map((t) => <div key={t.id} className={`toast ${t.kind}`}>{t.msg}</div>)}</div>
    </C.Provider>
  );
}

export const STATUS_RU: Record<string, string> = {
  awaiting_approval: "ждёт подтверждения", queued: "в очереди", running: "выполняется", succeeded: "готово",
  failed: "ошибка", cancelled: "отменено", rejected: "отклонено", idle: "свободен", working: "работает",
};
export const Badge = ({ s }: { s: string }) => <span className={`badge st-${s}`}>{STATUS_RU[s] ?? s}</span>;
export const ago = (ts?: number) => {
  if (!ts) return "—";
  const s = Math.max(0, Date.now() / 1000 - ts);
  return s < 60 ? `${Math.floor(s)} с назад` : s < 3600 ? `${Math.floor(s / 60)} мин назад` : s < 86400 ? `${Math.floor(s / 3600)} ч назад` : new Date(ts * 1000).toLocaleDateString("ru-RU");
};
