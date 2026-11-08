// Devuelve solo el PAÍS del visitante (código de 2 letras), según Netlify.
// No se guarda ni se devuelve la IP.
export default (_req: Request, context: { geo?: { country?: { code?: string } } }) =>
  new Response(JSON.stringify({ country: context.geo?.country?.code ?? "" }), {
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export const config = { path: "/geo" };
