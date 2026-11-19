import { FormEvent, useState } from "react";
import { api } from "../api";
import type { Me } from "../types";

export default function Login({ ownerExists, onDone }: { ownerExists: boolean; onDone: (m: Me) => void }) {
  const [u, setU] = useState(""); const [p, setP] = useState(""); const [p2, setP2] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const setup = !ownerExists;
  async function submit(e: FormEvent) {
    e.preventDefault(); setErr("");
    if (setup && p !== p2) return setErr("Пароли не совпадают");
    setBusy(true);
    try {
      if (setup) await api("/setup", { body: { username: u, password: p } });
      await api("/login", { body: { username: u, password: p } });
      onDone(await api<Me>("/me"));
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }
  return (
    <div className="login">
      <form className="card" onSubmit={submit}>
        <div className="brand">JARVIS AI CITY <span>ASHDOD 4D</span></div>
        <h2>{setup ? "Первый запуск: создайте владельца" : "Вход владельца"}</h2>
        {setup && <p className="muted">Владелец получает все права: подтверждение критических операций, лимиты расходов, аудит и пользователи. Пароль — не короче 10 символов.</p>}
        <input placeholder="Имя пользователя" value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" autoCapitalize="none" />
        <input type="password" placeholder="Пароль" value={p} onChange={(e) => setP(e.target.value)} autoComplete={setup ? "new-password" : "current-password"} />
        {setup && <input type="password" placeholder="Повторите пароль" value={p2} onChange={(e) => setP2(e.target.value)} autoComplete="new-password" />}
        {err && <div className="err">{err}</div>}
        <button className="primary" disabled={busy || !u || !p}>{setup ? "Создать владельца и войти" : "Войти"}</button>
      </form>
    </div>
  );
}
