import { useEffect, useRef, useState } from "react";
import { LINKS, SITE, type Lang } from "./links";
import { track } from "./track";

const LANG_KEY = "hl_lang";

function langInicial(): Lang {
  try {
    const guardado = localStorage.getItem(LANG_KEY);
    if (guardado === "en" || guardado === "es") return guardado;
  } catch {
    /* localStorage bloqueado: seguimos con el default */
  }
  return "en";
}

export default function LinksPage() {
  const [lang, setLang] = useState<Lang>(langInicial);
  const visto = useRef(false);

  // Una visita por carga de página (StrictMode ejecuta el efecto dos veces en desarrollo).
  useEffect(() => {
    if (visto.current) return;
    visto.current = true;
    track("view", null, lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cambiarLang = (l: Lang) => {
    setLang(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* sin persistencia */
    }
  };

  const activos = LINKS.filter((l) => l.url.trim() !== "");

  return (
    <main className="page">
      <div className="lang" role="group" aria-label="Language">
        {(["en", "es"] as Lang[]).map((l) => (
          <button key={l} className={lang === l ? "on" : ""} onClick={() => cambiarLang(l)} aria-pressed={lang === l}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <header className="head">
        <img src="/logo.jpg" alt="Howenh Lodge" className="logo" width={96} height={96} />
        <h1>{SITE.title}</h1>
        <p>{SITE.subtitle[lang]}</p>
      </header>

      <nav className="links" aria-label="Links">
        {activos.map((l) => {
          const externo = /^https?:/i.test(l.url);
          return (
            <a
              key={l.id}
              href={l.url}
              className={`btn ${l.destacado ? "main" : ""}`}
              {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              onClick={() => track("click", l.id, lang)}
            >
              <span className="ico" aria-hidden="true">{l.icon}</span>
              <span className="txt">
                <strong>{l.label[lang]}</strong>
                {l.hint && <small>{l.hint[lang]}</small>}
              </span>
              <span className="arrow" aria-hidden="true">›</span>
            </a>
          );
        })}
        {activos.length === 0 && <p className="muted">—</p>}
      </nav>

      <footer className="foot">© Howenh Lodge</footer>
    </main>
  );
}
