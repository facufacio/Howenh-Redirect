// Registro de visitas y clics en la base de datos propia (Supabase).
// Solo se guardan datos anónimos: un id aleatorio por navegador, el origen,
// el tipo de dispositivo y el idioma. Sin IP, sin nombres, sin cookies.
const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const trackingActivo = Boolean(URL && KEY);

function visitorId(): string {
  try {
    let id = localStorage.getItem("hl_vid");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("hl_vid", id);
    }
    return id;
  } catch {
    return "";
  }
}

function dispositivo(): "mobile" | "tablet" | "desktop" {
  const ua = navigator.userAgent;
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return "tablet";
  if (/Mobi|iPhone|Android/i.test(ua)) return "mobile";
  return "desktop";
}

function hostDeReferrer(): string {
  try {
    return document.referrer ? new window.URL(document.referrer).hostname.replace(/^www\./, "") : "";
  } catch {
    return "";
  }
}

export function track(type: "view" | "click", linkId: string | null, lang: string) {
  if (!URL || !KEY) return;
  const q = new URLSearchParams(window.location.search);
  const row = {
    type,
    link_id: linkId,
    visitor_id: visitorId(),
    referrer: hostDeReferrer(),
    utm_source: q.get("utm_source") || "",
    utm_medium: q.get("utm_medium") || "",
    utm_campaign: q.get("utm_campaign") || "",
    device: dispositivo(),
    lang,
  };
  // keepalive: el envío sigue aunque el navegador ya esté yendo al link.
  fetch(`${URL}/rest/v1/events`, {
    method: "POST",
    headers: {
      apikey: KEY,
      ...(KEY.startsWith("sb_") ? {} : { Authorization: `Bearer ${KEY}` }), // las claves nuevas (sb_publishable_) van solo en apikey
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
    keepalive: true,
  }).catch(() => {
    /* las métricas nunca deben romper la página */
  });
}
