import type { TypeStyleId } from "../types";

export interface TesterStyle {
  id: TypeStyleId;
  name: string;
  meta: string;
  sample: string;
}

/** Styles offered in the "Pruébala" tester. */
export const TESTER_STYLES: TesterStyle[] = [
  {
    id: "display",
    name: "Título",
    meta: "Jost 500 · 56 px · interlínea 1.05 · impreso 36–48 pt",
    sample: "Momentos hoy, recuerdos siempre",
  },
  {
    id: "script-l",
    name: "Acento",
    meta: "Amsterdam One · 40 px · interlínea 1.2 · impreso 24–32 pt",
    sample: "un recuerdo que sí se queda",
  },
  { id: "h2", name: "Subtítulo", meta: "Jost 500 · 28 px · impreso 18 pt", sample: "Qué incluye" },
  {
    id: "eyebrow",
    name: "Sobretítulo",
    meta: "Jost 500 · 12 px · espaciado 0.24em · impreso 8–9 pt",
    sample: "Brillipoint Experience · Photobooth",
  },
  {
    id: "body",
    name: "Texto",
    meta: "Jost 400 · 16 px · interlínea 1.5 · impreso 10–11 pt",
    sample: "Set fotográfico profesional estilo gala durante la recepción.",
  },
  { id: "price", name: "Precio", meta: "Jost 500 · 32 px · impreso 22–28 pt", sample: "$X,XXX por evento" },
];

/** Text hierarchy with its screen size and approximate print size. */
export const TYPE_SCALE: Array<{ id: TypeStyleId; name: string; sizes: string; sample: string }> = [
  { id: "eyebrow", name: "Sobretítulo", sizes: "12 px · 8–9 pt", sample: "BRILLIPOINT EXPERIENCE · PHOTOBOOTH" },
  { id: "display", name: "Título", sizes: "56 px · 36–48 pt", sample: "Little Moments" },
  { id: "script-l", name: "Acento", sizes: "40 px · 24–32 pt", sample: "un recuerdo que sí se queda" },
  { id: "h2", name: "Subtítulo", sizes: "28 px · 18 pt", sample: "Qué incluye" },
  { id: "h3", name: "Encabezado de tarjeta", sizes: "20 px · 14 pt", sample: "Galería digital personalizada" },
  { id: "body", name: "Texto", sizes: "16 px · 10–11 pt", sample: "Set fotográfico profesional estilo gala" },
  { id: "price", name: "Precio", sizes: "32 px · 22–28 pt", sample: "$X,XXX" },
  {
    id: "small",
    name: "Nota",
    sizes: "13 px · 7–8 pt",
    sample: "Traslado con costo adicional fuera de Puebla, Cholula o Cuautlancingo.",
  },
];
