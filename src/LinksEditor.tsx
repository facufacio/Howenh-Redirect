import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LinkRow } from "./linksApi";

const ICONOS = [
  { v: "/icons/whatsapp.svg", n: "WhatsApp" },
  { v: "/icons/facebook.svg", n: "Facebook" },
  { v: "/icons/instagram.svg", n: "Instagram" },
  { v: "/icons/howenh.png", n: "Logo Howenh (web)" },
];
const REDES = ["instagram", "facebook", "whatsapp", "tiktok", "youtube", "email"];

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
const lista = (s: string) => [...new Set(s.split(",").map((x) => slug(x)).filter(Boolean))];
const urlOk = (u: string) => u === "" || /^(https?:\/\/|mailto:|tel:)/i.test(u);

interface Draft {
  id: string;
  nuevo: boolean;
  activo: boolean;
  destacado: boolean;
  icono: string; // ruta de /icons/ o "emoji"
  emoji: string;
  label_en: string;
  label_es: string;
  hint_en: string;
  hint_es: string;
  url: string;
  solo: string;
  oculto: string;
  porRed: { red: string; url: string }[];
}

const vacio = (): Draft => ({
  id: "", nuevo: true, activo: true, destacado: false, icono: "emoji", emoji: "🔗",
  label_en: "", label_es: "", hint_en: "", hint_es: "", url: "", solo: "", oculto: "", porRed: [],
});

const aDraft = (r: LinkRow): Draft => {
  const preset = ICONOS.some((i) => i.v === r.icon);
  return {
    id: r.id, nuevo: false, activo: r.activo, destacado: r.destacado,
    icono: preset ? r.icon : "emoji", emoji: preset ? "🔗" : r.icon,
    label_en: r.label_en, label_es: r.label_es, hint_en: r.hint_en, hint_es: r.hint_es, url: r.url,
    solo: (r.solo_en ?? []).join(", "), oculto: (r.oculto_en ?? []).join(", "),
    porRed: Object.entries(r.url_por_red ?? {}).map(([red, url]) => ({ red, url })),
  };
};

function aFila(d: Draft, orden: number): { fila?: Omit<LinkRow, "orden"> & { orden: number }; error?: string } {
  const id = d.nuevo ? slug(d.id || d.label_en) : d.id;
  if (!id) return { error: "Poné un título en inglés (se usa para el nombre interno)." };
  if (!d.label_en.trim() || !d.label_es.trim()) return { error: "Falta el título en inglés o en español." };
  if (!urlOk(d.url.trim())) return { error: "El link tiene que empezar con https://, mailto: o tel:" };
  const url_por_red: Record<string, string> = {};
  for (const p of d.porRed) {
    const red = slug(p.red);
    if (!red && !p.url.trim()) continue;
    if (!red) return { error: "En 'Link distinto por red' falta el nombre de la red." };
    if (!p.url.trim() || !urlOk(p.url.trim())) return { error: `El link para "${red}" tiene que empezar con https://, mailto: o tel:` };
    url_por_red[red] = p.url.trim();
  }
  const icon = d.icono === "emoji" ? d.emoji.trim() || "🔗" : d.icono;
  return {
    fila: {
      id, orden, activo: d.activo, destacado: d.destacado, icon,
      label_en: d.label_en.trim(), label_es: d.label_es.trim(),
      hint_en: d.hint_en.trim(), hint_es: d.hint_es.trim(),
      url: d.url.trim(), url_por_red, solo_en: lista(d.solo), oculto_en: lista(d.oculto),
    },
  };
}

function Icono({ icon }: { icon: string }) {
  return icon.startsWith("/icons/") ? <img src={icon} alt="" /> : <span>{icon}</span>;
}

function Formulario({
  draft, onChange, onGuardar, onCancelar, onBorrar, guardando, error,
}: {
  draft: Draft;
  onChange: (d: Draft) => void;
  onGuardar: () => void;
  onCancelar: () => void;
  onBorrar?: () => void;
  guardando: boolean;
  error: string;
}) {
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => onChange({ ...draft, [k]: v });
  return (
    <div className="form">
      <div className="fgrid">
        <label>Título en inglés<input value={draft.label_en} onChange={(e) => set("label_en", e.target.value)} maxLength={80} /></label>
        <label>Título en español<input value={draft.label_es} onChange={(e) => set("label_es", e.target.value)} maxLength={80} /></label>
        <label className="wide">Link (adonde lleva)
          <input value={draft.url} onChange={(e) => set("url", e.target.value)} placeholder="https://..." inputMode="url" />
        </label>
        <label>Ícono
          <select value={draft.icono} onChange={(e) => set("icono", e.target.value)}>
            {ICONOS.map((i) => <option key={i.v} value={i.v}>{i.n}</option>)}
            <option value="emoji">Emoji propio…</option>
          </select>
        </label>
        {draft.icono === "emoji" && (
          <label>Emoji<input value={draft.emoji} onChange={(e) => set("emoji", e.target.value)} maxLength={8} /></label>
        )}
        <label>Subtítulo en inglés (opcional)<input value={draft.hint_en} onChange={(e) => set("hint_en", e.target.value)} maxLength={160} /></label>
        <label>Subtítulo en español (opcional)<input value={draft.hint_es} onChange={(e) => set("hint_es", e.target.value)} maxLength={160} /></label>
      </div>

      <div className="checks">
        <label><input type="checkbox" checked={draft.activo} onChange={(e) => set("activo", e.target.checked)} /> Visible en la página</label>
        <label><input type="checkbox" checked={draft.destacado} onChange={(e) => set("destacado", e.target.checked)} /> Destacado (color lleno)</label>
      </div>

      <h4>Según la red desde la que se abre la página</h4>
      <p className="muted small">Las redes se escriben como en el link que pegás en cada una (ej. <code>/instagram</code> → <code>instagram</code>).</p>
      <div className="fgrid">
        <label>Mostrar solo en estas redes
          <input list="redes" value={draft.solo} onChange={(e) => set("solo", e.target.value)} placeholder="vacío = en todas" />
        </label>
        <label>Ocultar en estas redes
          <input list="redes" value={draft.oculto} onChange={(e) => set("oculto", e.target.value)} placeholder="ej: facebook" />
        </label>
      </div>
      <datalist id="redes">{REDES.map((r) => <option key={r} value={r} />)}</datalist>

      <div className="porred">
        <span className="muted small">Link distinto por red</span>
        {draft.porRed.map((p, i) => (
          <div className="prow" key={i}>
            <input list="redes" value={p.red} placeholder="red" onChange={(e) => set("porRed", draft.porRed.map((x, j) => (j === i ? { ...x, red: e.target.value } : x)))} />
            <input value={p.url} placeholder="https://..." inputMode="url" onChange={(e) => set("porRed", draft.porRed.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
            <button type="button" onClick={() => set("porRed", draft.porRed.filter((_, j) => j !== i))} aria-label="Quitar">✕</button>
          </div>
        ))}
        <button type="button" onClick={() => set("porRed", [...draft.porRed, { red: "", url: "" }])}>+ Agregar link para una red</button>
      </div>

      {error && <p className="err">{error}</p>}
      <div className="facts">
        <button className="primary" onClick={onGuardar} disabled={guardando}>{guardando ? "Guardando…" : "Guardar"}</button>
        <button onClick={onCancelar} disabled={guardando}>Cancelar</button>
        {onBorrar && <button className="danger" onClick={onBorrar} disabled={guardando}>Borrar</button>}
      </div>
    </div>
  );
}

export default function LinksEditor({ supabase, onCambio }: { supabase: SupabaseClient; onCambio: () => void }) {
  const [filas, setFilas] = useState<LinkRow[] | null>(null);
  const [error, setError] = useState("");
  const [abierto, setAbierto] = useState<string | null>(null); // id, o "__nuevo"
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errForm, setErrForm] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [falta, setFalta] = useState(false);

  const cargar = useCallback(async () => {
    const { data, error: err } = await supabase.from("links").select("*").order("orden", { ascending: true });
    if (err) {
      if (/relation|schema cache|does not exist|PGRST205/i.test(err.message + (err.code ?? ""))) setFalta(true);
      else setError(err.message);
      return;
    }
    setFalta(false);
    setError("");
    setFilas(data as LinkRow[]);
  }, [supabase]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cerrar = () => {
    setAbierto(null);
    setDraft(null);
    setErrForm("");
  };

  const guardar = async () => {
    if (!draft || !filas) return;
    const orden = draft.nuevo ? (filas.reduce((m, f) => Math.max(m, f.orden), 0) + 1) : filas.find((f) => f.id === draft.id)?.orden ?? 0;
    const { fila, error: e } = aFila(draft, orden);
    if (e || !fila) return setErrForm(e ?? "Datos inválidos");
    if (draft.nuevo && filas.some((f) => f.id === fila.id)) return setErrForm(`Ya existe un botón con el nombre interno "${fila.id}". Cambiá el título en inglés.`);
    setGuardando(true);
    const { error: err } = await supabase.from("links").upsert({ ...fila, updated_at: new Date().toISOString() });
    setGuardando(false);
    if (err) return setErrForm(err.message.includes("row-level") ? "Este email no está autorizado para editar." : err.message);
    cerrar();
    await cargar();
    onCambio();
  };

  const borrar = async () => {
    if (!draft || draft.nuevo) return;
    if (!window.confirm(`¿Borrar el botón "${draft.label_es}"? Las métricas de sus clics anteriores se conservan.`)) return;
    setGuardando(true);
    const { error: err } = await supabase.from("links").delete().eq("id", draft.id);
    setGuardando(false);
    if (err) return setErrForm(err.message);
    cerrar();
    await cargar();
    onCambio();
  };

  const alternarActivo = async (f: LinkRow) => {
    const { error: err } = await supabase.from("links").update({ activo: !f.activo, updated_at: new Date().toISOString() }).eq("id", f.id);
    if (err) return setError(err.message);
    await cargar();
    onCambio();
  };

  const mover = async (i: number, d: -1 | 1) => {
    if (!filas || i + d < 0 || i + d >= filas.length) return;
    const nuevo = [...filas];
    [nuevo[i], nuevo[i + d]] = [nuevo[i + d], nuevo[i]];
    const res = await Promise.all(
      nuevo.map((f, idx) => (f.orden === idx + 1 ? null : supabase.from("links").update({ orden: idx + 1 }).eq("id", f.id)))
    );
    const fallo = res.find((r) => r && r.error);
    if (fallo?.error) setError(fallo.error.message);
    await cargar();
    onCambio();
  };

  if (falta) {
    return (
      <div className="card">
        <h3>Botones de la página</h3>
        <p>Falta activar la edición de botones. En Supabase → SQL Editor, corré el archivo <code>supabase/migrations/003_links_editables.sql</code> y recargá esta página.</p>
      </div>
    );
  }

  return (
    <div className="card editor">
      <div className="ehead">
        <h3>Botones de la página</h3>
        <button className="primary" onClick={() => { setAbierto("__nuevo"); setDraft(vacio()); setErrForm(""); }}>+ Agregar botón</button>
      </div>
      {error && <p className="err">{error}</p>}
      {!filas && !error && <p className="muted">Cargando…</p>}

      {abierto === "__nuevo" && draft && (
        <div className="brow open">
          <Formulario draft={draft} onChange={setDraft} onGuardar={guardar} onCancelar={cerrar} guardando={guardando} error={errForm} />
        </div>
      )}

      {filas?.map((f, i) => (
        <div key={f.id} className={`brow ${abierto === f.id ? "open" : ""} ${f.activo ? "" : "off"}`}>
          <div className="bsum">
            <span className="bico"><Icono icon={f.icon} /></span>
            <span className="btxt">
              <strong>{f.label_es}</strong>
              <small>
                {f.id}
                {f.solo_en?.length ? ` · solo en: ${f.solo_en.join(", ")}` : ""}
                {f.oculto_en?.length ? ` · oculto en: ${f.oculto_en.join(", ")}` : ""}
                {Object.keys(f.url_por_red ?? {}).length ? ` · link propio en: ${Object.keys(f.url_por_red).join(", ")}` : ""}
                {f.activo ? "" : " · oculto"}
              </small>
            </span>
            <span className="bact">
              <button onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Subir">↑</button>
              <button onClick={() => mover(i, 1)} disabled={i === filas.length - 1} aria-label="Bajar">↓</button>
              <button onClick={() => alternarActivo(f)}>{f.activo ? "Ocultar" : "Mostrar"}</button>
              <button onClick={() => { setAbierto(abierto === f.id ? null : f.id); setDraft(aDraft(f)); setErrForm(""); }}>Editar</button>
            </span>
          </div>
          {abierto === f.id && draft && !draft.nuevo && (
            <Formulario draft={draft} onChange={setDraft} onGuardar={guardar} onCancelar={cerrar} onBorrar={borrar} guardando={guardando} error={errForm} />
          )}
        </div>
      ))}
      <p className="muted small">Los cambios se ven en la página al recargarla. El nombre interno de un botón no se puede cambiar: las métricas lo usan.</p>
    </div>
  );
}
