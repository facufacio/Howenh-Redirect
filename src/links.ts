// ✏️  ACÁ SE EDITAN LOS LINKS DE LA PÁGINA.
// - Un link con `activo: false` o sin URL no se muestra: sirve para dejarlos listos y activarlos después.
// - `id` es el nombre con el que se cuentan los clics en las métricas: no lo cambies
//   una vez publicado, o las estadísticas se parten en dos.
export type Lang = "en" | "es";

export interface LinkItem {
  id: string;
  icon: string; // emoji, o ruta a una imagen (ej: "/icons/facebook.svg")
  label: Record<Lang, string>;
  hint?: Record<Lang, string>;
  /** URL fija, o una función que la arma según el idioma elegido. */
  url: string | ((lang: Lang) => string);
  destacado?: boolean; // botón principal (color lleno)
  activo?: boolean; // false = oculto por ahora (por defecto, visible)
  /** Solo se muestra cuando la página se abre desde estas redes (ej: ["facebook"]). */
  soloEn?: string[];
  /** No se muestra cuando la página se abre desde estas redes. */
  ocultoEn?: string[];
}

export const SITE = {
  title: "Howenh Lodge",
  subtitle: {
    en: "Fly fishing · Río Grande, Tierra del Fuego",
    es: "Pesca con mosca · Río Grande, Tierra del Fuego",
  } as Record<Lang, string>,
};

// WhatsApp: link corto de wa.link (el mensaje inicial se configura en wa.link).
const WHATSAPP_URL = "https://wa.link/aoyy7g";

// Instagram: pegar acá la URL del perfil (ej: "https://www.instagram.com/usuario"). Vacío = no se muestra.
const INSTAGRAM_URL = "https://www.instagram.com/howenhlodge";

export const LINKS: LinkItem[] = [
  // ---- Visibles por ahora ----
  {
    id: "contact",
    icon: "/icons/whatsapp.svg",
    label: { en: "¡Contact us!", es: "¡Contactanos!" },
    url: WHATSAPP_URL,
  },
  {
    id: "website",
    icon: "/icons/howenh.png",
    label: { en: "¡Check our Web!", es: "¡Visitá nuestra web!" },
    url: "https://howenhlodge.com.ar",
  },
  {
    id: "facebook",
    icon: "/icons/facebook.svg",
    label: { en: "Follow us on Facebook", es: "Seguinos en Facebook" },
    url: "https://www.facebook.com/HowenhLodge",
    ocultoEn: ["facebook"], // en /facebook ya están en Facebook: se reemplaza por el de Instagram
  },
  {
    id: "instagram",
    icon: "/icons/instagram.svg",
    label: { en: "Follow us on Instagram", es: "Seguinos en Instagram" },
    url: INSTAGRAM_URL,
    soloEn: ["facebook"],
  },

  // ---- Listos pero ocultos (para activarlos, sacar `activo: false`) ----
  {
    id: "booking",
    icon: "🎣",
    label: { en: "Book your week", es: "Reservá tu semana" },
    hint: { en: "Check availability and request a booking", es: "Mirá la disponibilidad y pedí tu reserva" },
    url: "https://howenhoperatives.netlify.app/booking",
    activo: false,
  },
  {
    id: "youtube",
    icon: "▶️",
    label: { en: "Watch our Youtube videos", es: "Mirá nuestros videos de YouTube" },
    url: "https://www.youtube.com/@HowenhLodge",
    activo: false,
  },
];

/** URL final de un link en el idioma actual ("" si no hay). */
/** ¿Este link se muestra en esta red? (red "" = entrada directa) */
export const visibleEn = (l: LinkItem, red: string): boolean =>
  l.activo !== false && (!l.soloEn || l.soloEn.includes(red)) && !(l.ocultoEn ?? []).includes(red);

export const urlDe = (l: LinkItem, lang: Lang): string => (typeof l.url === "function" ? l.url(lang) : l.url).trim();
