import { LOGO_BACKGROUNDS, LOGO_VERSIONS } from "../constants/logo";
import { tokenValue } from "../constants/tokens";
import type {
  ColorToken,
  Line,
  LogoBackgroundId,
  LogoVersionId,
  TypeStyleId,
  Verdict,
} from "../types";
import { contrastRatio, hexToRgb } from "./color";

const verdict = (kind: Verdict["kind"], message: string): Verdict => ({ kind, message });

interface LogoChoice {
  version: LogoVersionId;
  background: LogoBackgroundId;
  size: number;
}

/** Whether a logo version can be used on a background at a given screen size, and why. */
export function logoVerdict({ version, background, size }: LogoChoice): Verdict {
  const logo = LOGO_VERSIONS[version];
  const bg = LOGO_BACKGROUNDS[background];
  const bgName = bg.name.toLowerCase();
  if (logo.ink === "light" && !bg.dark) {
    return verdict("no", `El logo blanco desaparece sobre ${bgName}. En claro va la versión negra.`);
  }
  if (logo.ink === "dark" && bg.dark) {
    return verdict("no", `El logo negro se pierde sobre ${bgName}. En noche va la versión blanca.`);
  }
  if (logo.signature) {
    return verdict("warn", "Es la firma de la marca anterior: solo como referencia. El letrero neón físico la usa.");
  }
  if (size < 64) {
    return verdict(
      "no",
      `A ${size} px el arco BRILLIPOINT / EXPERIENCE no se lee. En tamaños chicos va solo la B plana (pendiente en archivo).`,
    );
  }
  if (logo.glow && size < 160) {
    return verdict("no", "El glow necesita tamaño grande, de 160 px o más. En chico va la versión plana, sin glow.");
  }
  if (logo.glow) {
    return verdict("ok", "Glow en pantalla, sobre fondo oscuro y en grande. Nunca en impresión, bordado ni llaveros.");
  }
  return verdict("warn", "Bien para pantalla. No lo mandes a imprimir: la sombra sale sucia. Falta la versión plana.");
}

/** Contrast of a text token on a background token for the active line, crossed with the brand rules. */
export function fitVerdict(bg: ColorToken, fg: ColorToken, line: Line): { ratio: number; verdict: Verdict } {
  const ratio = contrastRatio(hexToRgb(tokenValue(bg, line)), hexToRgb(tokenValue(fg, line)));
  const result = (() => {
    if (ratio < 1.2) return verdict("no", "No se lee: casi no hay diferencia entre texto y fondo.");
    if (bg === "gold-500" && fg === "neon") {
      return verdict("no", "Nunca blanco sobre dorado. Sobre gold-500 el texto va en on-gold.");
    }
    if (bg === "gold-500" && fg !== "on-gold" && ratio < 4.5) {
      return verdict("no", "Sobre dorado el texto va en on-gold (negro).");
    }
    if (bg === "gold-100" && fg === "gold-700") {
      return verdict("no", "Sobre gold-100 el texto va en ink, nunca en gold-700.");
    }
    if (line === "light" && fg === "gold-500" && bg.startsWith("surface")) {
      return verdict("no", "En claro, gold-500 no es para texto. El dorado para texto es gold-700.");
    }
    if (fg === "neon" && ratio >= 4.5) {
      return verdict("warn", "Se lee, pero el blanco puro es del letrero neón. Para texto usa ink.");
    }
    if (ratio >= 4.5) return verdict("ok", "Se lee bien en cualquier tamaño.");
    if (ratio >= 3) return verdict("warn", "Solo para títulos de 24 px o más, o para formas e íconos.");
    return verdict("no", "No se lee. Busca otra combinación.");
  })();
  return { ratio, verdict: result };
}

/** Brand rules for a phrase typed in the "Pruébala" tester. */
export function typeVerdict(style: TypeStyleId, value: string): Verdict {
  const text = value.trim();
  if (!text) return verdict("warn", "Escribe una frase para probarla.");
  switch (style) {
    case "script-l":
      if (/[A-ZÁÉÍÓÚÑ]{2,}/.test(text)) {
        return verdict("no", "Amsterdam One nunca va en mayúsculas: las mayúsculas script no se leen.");
      }
      if (text.split(/\s+/).length > 6) return verdict("warn", "Es un acento: una frase corta, una vez por pieza.");
      return verdict("ok", "Una frase corta, en minúsculas, bajo un título en Jost.");
    case "display":
      return text.length > 40
        ? verdict("warn", "Un título va en máximo 2 líneas. Si no cabe, recorta la frase o haz dos piezas.")
        : verdict("ok", "Una sola idea grande, en Jost 500.");
    case "eyebrow":
      return text.length > 48
        ? verdict("warn", "Es una etiqueta: pocas palabras.")
        : verdict("ok", "Se escribe ya en mayúsculas, con el espaciado amplio del arco del logo.");
    case "price":
      return /desde|antes|ahora|%|~/i.test(text)
        ? verdict("no", "Un solo precio por paquete, sin “desde”, tachados ni descuentos.")
        : verdict("ok", "Un solo precio, sin tachados.");
    case "h2":
      return verdict("ok", "Nombre de paquete o subsección.");
    default:
      return verdict("ok", "Texto corrido y listas. En impreso, nunca menos de 7 pt.");
  }
}

export const MAX_SPARKS = 5;

export function sparkVerdict(count: number): Verdict {
  if (count <= MAX_SPARKS) {
    const noun = count === 1 ? "destello" : "destellos";
    return verdict("ok", `${count} ${noun}, todos del mismo dorado. El brillo se nota porque hay poco.`);
  }
  return verdict("no", "Saturación: con más de 5 destellos, nada brilla. Quita hasta dejar de 3 a 5.");
}

const VOICE_RULES: Array<[RegExp, string]> = [
  [/¡¡|!!/g, "Un solo signo de admiración, o ninguno."],
  [/\baparta(lo)?\s+ya\b/gi, "Agenda tu fecha."],
  [/\bbarat[oa]s?\b/gi, "Set fotográfico estilo gala. No competimos por precio."],
  [/\bcabina\b/gi, "Set fotográfico estilo gala."],
  [/\bprom(o|os|oci[oó]n|ociones)\b/gi, "Habla de la experiencia, no de promociones."],
  [/\bofertas?\b/gi, "Un solo precio por evento."],
  [/\bgangas?\b/gi, "No competimos por precio."],
  [/\bs[uú]per\b/gi, "Di qué incluye en lugar de exagerar."],
  [/\bincre[ií]bles?\b/gi, "Di qué hace especial al momento."],
  [/\bdesde\b/gi, "Un solo precio: $X,XXX por evento. Si varía, explícalo en la nota."],
  [/\bmejor precio\b/gi, "Un recuerdo que tus invitados se llevan."],
  [/\bte regalamos\b/gi, "Incluye galería digital personalizada."],
  [/\bdescuentos?\b|\d+\s?%/gi, "Somos premium: sin porcentajes ni “antes / ahora”."],
];

/** Uppercase words that are names, not shouting. */
const CAPS_ALLOWED = ["PHOTOBOOTH", "GLITTER", "BAR", "BRILLIPOINT", "EXPERIENCE", "XV", "QR"];

export const VOICE_BAD_SAMPLE = "¡¡APARTA YA!! Cabina de fotos barata, desde $3,200 🎉";
export const VOICE_GOOD_SAMPLE =
  "Agenda tu fecha. Set fotográfico estilo gala con galería digital personalizada: $3,200 por evento.";

export interface CopyFlag {
  match: string;
  fix: string;
}

export interface CopyReview {
  status: "empty" | "ok" | "flags";
  flags: CopyFlag[];
}

const unique = (items: string[]) => items.filter((item, index) => items.indexOf(item) === index);

/** Flags the words and patterns that don't sound like Brillipoint, each with its alternative. */
export function reviewCopy(text: string): CopyReview {
  if (!text.trim()) return { status: "empty", flags: [] };
  const flags: CopyFlag[] = [];
  VOICE_RULES.forEach(([pattern, fix]) => {
    const matches = text.match(pattern);
    if (matches) flags.push({ match: unique(matches).join(" · "), fix });
  });
  const emojis = text.match(/\p{Extended_Pictographic}/gu);
  if (emojis) flags.push({ match: unique(emojis).join(" "), fix: "Sin emojis: hablamos con calma y calidez." });
  const shouted = unique(
    (text.match(/[A-Za-zÁÉÍÓÚÑÜáéíóúñü]+/g) ?? []).filter(
      (word) =>
        word.length >= 3 &&
        word === word.toUpperCase() &&
        word !== word.toLowerCase() &&
        !CAPS_ALLOWED.includes(word),
    ),
  );
  if (shouted.length) {
    flags.push({ match: shouted.join(" "), fix: "Sin MAYÚSCULAS para gritar. Escribe en tono normal." });
  }
  return { status: flags.length ? "flags" : "ok", flags };
}
