import { useEffect, useRef, useState } from "react";
import { LINKS, SITE, urlDe, visibleEn, type Lang, type LinkItem } from "./links";
import { cargarLinks, linksEnCache } from "./linksApi";
import { redActual, track } from "./track";

// La página se muestra solo en inglés.
const lang: Lang = "en";

export default function LinksPage() {
  const visto = useRef(false);
  // Botones: los últimos guardados (o los de links.ts) al instante, y se actualizan con los de la base.
  const [links, setLinks] = useState<LinkItem[]>(() => linksEnCache() ?? LINKS);
  useEffect(() => {
    let vivo = true;
    cargarLinks().then((l) => {
      if (vivo && l) setLinks(l);
    });
    return () => {
      vivo = false;
    };
  }, []);

  // Una visita por carga de página (StrictMode ejecuta el efecto dos veces en desarrollo).
  useEffect(() => {
    if (visto.current) return;
    visto.current = true;
    track("view", null, lang);
  }, []);

  const red = redActual();
  const activos = links
    .filter((l) => visibleEn(l, red) && urlDe(l, lang, red) !== "")
    .map((l) => ({ ...l, href: urlDe(l, lang, red) }));

  return (
    <main className="page">
      <header className="head">
        <img src="/logo.jpg" alt="Howenh Lodge" className="logo" width={96} height={96} />
        <h1>{SITE.title}</h1>
        <p>{SITE.subtitle[lang]}</p>
      </header>

      <nav className="links" aria-label="Links">
        {activos.map((l) => {
          const externo = /^https?:/i.test(l.href);
          return (
            <a
              key={l.id}
              href={l.href}
              className={`btn ${l.destacado ? "main" : ""}`}
              {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              onClick={() => track("click", l.id, lang)}
            >
              <span className={`ico ${l.icon.startsWith("/icons/") ? "img" : ""}`} aria-hidden="true">{l.icon.startsWith("/icons/") ? <img src={l.icon} alt="" /> : l.icon}</span>
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
