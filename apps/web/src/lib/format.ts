/** Utilidades de formato compartidas por las vistas públicas y el panel. */

export function formatFecha(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

/** Recorta un texto a `max` caracteres respetando palabras. */
export function extracto(texto: string, max = 150): string {
  const limpio = texto.trim().replace(/\s+/g, " ");
  if (limpio.length <= max) return limpio;
  const recorte = limpio.slice(0, max);
  const ultimoEspacio = recorte.lastIndexOf(" ");
  return `${(ultimoEspacio > 40 ? recorte.slice(0, ultimoEspacio) : recorte).trimEnd()}…`;
}
