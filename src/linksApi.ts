// Botones de la página guardados en la base (editables desde /admin).
// Si la base no responde o todavía no tiene la tabla, la página usa los de src/links.ts.
import type { LinkItem } from "./links";

const URL_SB = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY_SB = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const CACHE = "hl_links_v1";

export interface LinkRow {
  id: string;
  orden: number;
  activo: boolean;
  destacado: boolean;
  icon: string;
  label_en: string;
  label_es: string;
  hint_en: string;
  hint_es: string;
  url: string;
  url_por_red: Record<string, string>;
  solo_en: string[];
  oculto_en: string[];
}

export const rowToItem = (r: LinkRow): LinkItem => ({
  id: r.id,
  icon: r.icon,
  label: { en: r.label_en, es: r.label_es },
  hint: r.hint_en || r.hint_es ? { en: r.hint_en || r.hint_es, es: r.hint_es || r.hint_en } : undefined,
  url: r.url,
  urlPorRed: r.url_por_red ?? {},
  destacado: r.destacado,
  activo: r.activo,
  soloEn: r.solo_en ?? [],
  ocultoEn: r.oculto_en ?? [],
});

/** Última lista que se pudo bajar (para que la página aparezca al instante). */
export function linksEnCache(): LinkItem[] | null {
  try {
    const raw = localStorage.getItem(CACHE);
    const arr = raw ? JSON.parse(raw) : null;
    return Array.isArray(arr) && arr.length > 0 ? (arr as LinkItem[]) : null;
  } catch {
    return null;
  }
}

/** Baja los botones de la base. null = no hay (usar los de links.ts). */
export async function cargarLinks(): Promise<LinkItem[] | null> {
  if (!URL_SB || !KEY_SB) return null;
  try {
    const r = await fetch(`${URL_SB}/rest/v1/links?select=*&order=orden.asc`, {
      headers: { apikey: KEY_SB, ...(KEY_SB.startsWith("sb_") ? {} : { Authorization: `Bearer ${KEY_SB}` }) },
    });
    if (!r.ok) return null;
    const rows = (await r.json()) as LinkRow[];
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const items = rows.map(rowToItem);
    try {
      localStorage.setItem(CACHE, JSON.stringify(items));
    } catch {
      /* sin caché */
    }
    return items;
  } catch {
    return null;
  }
}
