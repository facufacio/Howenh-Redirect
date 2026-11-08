import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient, type Session } from "@supabase/supabase-js";
import { LINKS } from "./links";

const URL_SB = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY_SB = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabase = URL_SB && KEY_SB ? createClient(URL_SB, KEY_SB) : null;

interface Fila {
  views: number;
  clicks: number;
}
interface Stats {
  views: number;
  clicks: number;
  visitors: number;
  by_link: { link_id: string | null; clicks: number }[];
  by_day: ({ day: string } & Fila)[];
  by_source: ({ source: string } & Fila)[];
  by_campaign: { source: string; medium: string; campaign: string; views: number; clicks: number }[];
  by_country: ({ country: string } & Fila)[];
  by_device: ({ device: string } & Fila)[];
}

const nombreLink = (id: string | null) =>
  LINKS.find((l) => l.id === id)?.label.es ?? id ?? "—";

const nombresPais = (() => {
  try {
    return new Intl.DisplayNames(["es"], { type: "region" });
  } catch {
    return null;
  }
})();
const nombrePais = (c: string) => (c === "?" ? "Desconocido" : (nombresPais?.of(c) ?? c));

const pct = (a: number, b: number) => (b > 0 ? `${((a / b) * 100).toFixed(1)}%` : "—");

function Barras({ filas }: { filas: { nombre: string; valor: number }[] }) {
  const max = Math.max(1, ...filas.map((f) => f.valor));
  if (filas.length === 0) return <p className="muted">Sin datos todavía.</p>;
  return (
    <ul className="bars">
      {filas.map((f) => (
        <li key={f.nombre}>
          <span className="bn">{f.nombre}</span>
          <span className="bb"><i style={{ width: `${(f.valor / max) * 100}%` }} /></span>
          <span className="bv">{f.valor}</span>
        </li>
      ))}
    </ul>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setCargando(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (err) setError("Email o contraseña incorrectos");
    setCargando(false);
  };

  return (
    <form className="card login" onSubmit={entrar}>
      <h2>Métricas</h2>
      <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required /></label>
      <label>Contraseña<input type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" required /></label>
      {error && <p className="err">{error}</p>}
      <button className="primary" disabled={cargando}>{cargando ? "Entrando…" : "Ingresar"}</button>
    </form>
  );
}

function Panel({ session }: { session: Session }) {
  const [dias, setDias] = useState(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    if (!supabase) return;
    setCargando(true);
    setError("");
    const { data, error: err } = await supabase.rpc("link_stats", { _days: dias });
    if (err) setError(err.message.includes("permission") ? "Este email no está autorizado para ver las métricas." : err.message);
    else setStats(data as Stats);
    setCargando(false);
  }, [dias]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const porDia = useMemo(() => (stats?.by_day ?? []).slice(-30), [stats]);
  const maxDia = Math.max(1, ...porDia.map((d) => d.views));

  return (
    <div className="admin">
      <header className="bar">
        <h1>Métricas · Howenh Lodge</h1>
        <div className="right">
          <select value={dias} onChange={(e) => setDias(Number(e.target.value))} aria-label="Período">
            <option value={7}>Últimos 7 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={90}>Últimos 90 días</option>
            <option value={365}>Último año</option>
          </select>
          <button onClick={cargar}>Actualizar</button>
          <button onClick={() => supabase?.auth.signOut()} title={session.user.email ?? ""}>Salir</button>
        </div>
      </header>

      {error && <p className="err">{error}</p>}
      {cargando && !stats && <p className="muted">Cargando…</p>}

      {stats && (
        <>
          <section className="kpis">
            <div className="card"><span>Visitas</span><b>{stats.views}</b></div>
            <div className="card"><span>Visitantes únicos</span><b>{stats.visitors}</b></div>
            <div className="card"><span>Clics</span><b>{stats.clicks}</b></div>
            <div className="card"><span>Clics / visitas</span><b>{pct(stats.clicks, stats.views)}</b></div>
          </section>

          <section className="grid">
            <div className="card">
              <h3>Clics por link</h3>
              <Barras filas={stats.by_link.map((l) => ({ nombre: nombreLink(l.link_id), valor: l.clicks }))} />
            </div>
            <div className="card">
              <h3>Origen del tráfico</h3>
              <table>
                <thead><tr><th>Origen</th><th>Visitas</th><th>%</th><th>Clics</th></tr></thead>
                <tbody>
                  {stats.by_source.map((s) => (
                    <tr key={s.source}><td>{s.source}</td><td>{s.views}</td><td>{pct(s.views, stats.views)}</td><td>{s.clicks}</td></tr>
                  ))}
                  {stats.by_source.length === 0 && <tr><td colSpan={4} className="muted">Sin datos todavía.</td></tr>}
                </tbody>
              </table>
              <p className="muted small">Para distinguir redes, agregá <code>?utm_source=instagram</code> al link que pegues en cada una.</p>
            </div>
            <div className="card">
              <h3>País</h3>
              <table>
                <thead><tr><th>País</th><th>Visitas</th><th>%</th><th>Clics</th></tr></thead>
                <tbody>
                  {(stats.by_country ?? []).map((c) => (
                    <tr key={c.country}><td>{nombrePais(c.country)}</td><td>{c.views}</td><td>{pct(c.views, stats.views)}</td><td>{c.clicks}</td></tr>
                  ))}
                  {(stats.by_country ?? []).length === 0 && <tr><td colSpan={4} className="muted">Sin datos todavía.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="card">
              <h3>Campañas (utm)</h3>
              <table>
                <thead><tr><th>Red / medio / campaña</th><th>Visitas</th><th>Clics</th></tr></thead>
                <tbody>
                  {(stats.by_campaign ?? []).map((c) => (
                    <tr key={`${c.source}|${c.medium}|${c.campaign}`}>
                      <td>{[c.source, c.medium, c.campaign].filter((x) => x !== "—").join(" / ") || "—"}</td>
                      <td>{c.views}</td><td>{c.clicks}</td>
                    </tr>
                  ))}
                  {(stats.by_campaign ?? []).length === 0 && <tr><td colSpan={3} className="muted">Sin datos todavía.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="card">
              <h3>Dispositivos</h3>
              <Barras filas={stats.by_device.map((d) => ({ nombre: d.device, valor: d.views }))} />
            </div>
            <div className="card">
              <h3>Visitas por día</h3>
              {porDia.length === 0 ? (
                <p className="muted">Sin datos todavía.</p>
              ) : (
                <div className="days" role="img" aria-label="Visitas por día">
                  {porDia.map((d) => (
                    <div key={d.day} className="day" title={`${d.day}: ${d.views} visitas, ${d.clicks} clics`}>
                      <i style={{ height: `${(d.views / maxDia) * 100}%` }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    document.title = "Métricas · Howenh Lodge";
    if (!supabase) {
      setListo(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setListo(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!supabase) {
    return (
      <div className="center">
        <div className="card">
          <h2>Falta conectar la base de datos</h2>
          <p className="muted">Definí <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> (ver README).</p>
        </div>
      </div>
    );
  }
  if (!listo) return <div className="center muted">…</div>;
  return session ? <Panel session={session} /> : <div className="center"><Login /></div>;
}
