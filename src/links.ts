// ✏️  ACÁ SE EDITAN LOS LINKS DE LA PÁGINA.
// - Un link con `url` vacía ("") no se muestra: sirve para dejarlos listos y activarlos después.
// - `id` es el nombre con el que se cuentan los clics en las métricas: no lo cambies
//   una vez publicado, o las estadísticas se parten en dos.
export type Lang = "en" | "es";

export interface LinkItem {
  id: string;
  icon: string; // emoji
  label: Record<Lang, string>;
  hint?: Record<Lang, string>;
  url: string;
  destacado?: boolean; // botón principal (color lleno)
}

export const SITE = {
  title: "Howenh Lodge",
  subtitle: {
    en: "Fly fishing · Río Grande, Tierra del Fuego",
    es: "Pesca con mosca · Río Grande, Tierra del Fuego",
  } as Record<Lang, string>,
};

export const LINKS: LinkItem[] = [
  {
    id: "booking",
    icon: "🎣",
    label: { en: "Book your week", es: "Reservá tu semana" },
    hint: { en: "Check availability and request a booking", es: "Mirá la disponibilidad y pedí tu reserva" },
    url: "https://howenhoperatives.netlify.app/booking",
    destacado: true,
  },
  // TODO: completar las URLs reales (si queda vacía, el botón no aparece).
  { id: "instagram", icon: "📸", label: { en: "Instagram", es: "Instagram" }, url: "" },
  { id: "whatsapp", icon: "💬", label: { en: "WhatsApp", es: "WhatsApp" }, url: "" },
  { id: "website", icon: "🌐", label: { en: "Website", es: "Sitio web" }, url: "" },
  { id: "email", icon: "✉️", label: { en: "Email us", es: "Escribinos" }, url: "" }, // ej: mailto:info@tudominio.com
];
