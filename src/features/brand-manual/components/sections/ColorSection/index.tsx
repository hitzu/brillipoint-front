import { tokenValue } from "../../../constants/tokens";
import type { ColorToken, Line } from "../../../types";
import { copyText } from "../../../utils/clipboard";
import { contrastRatio, hexToRgb, rgbToCmyk, rgbToHex } from "../../../utils/color";
import { SectionHeader } from "../../ui/SectionHeader";
import ui from "../../ui/ui.module.css";
import type { SectionProps } from "../types";
import styles from "./ColorSection.module.css";
import { FitChecker } from "./FitChecker";

const SWATCHES: Array<{ token: ColorToken; name: string; usage: string }> = [
  { token: "surface-100", name: "Fondo", usage: "Fondo de página. Identifica la línea." },
  { token: "surface-200", name: "Tarjetas", usage: "Paquetes y bloques." },
  { token: "surface-000", name: "Puro", usage: "Papel y foto impresa; fondo del glow." },
  { token: "ink", name: "Ink", usage: "Texto y logo a una tinta." },
  { token: "ink-muted", name: "Ink suave", usage: "Notas y textos secundarios." },
  { token: "gold-500", name: "Dorado champagne", usage: "Destellos, botón, sello, foil." },
  { token: "gold-700", name: "Dorado para texto", usage: "Subtítulos, precios, enlaces." },
  { token: "gold-100", name: "Tinte dorado", usage: "Chips y bandas." },
];

/** Picks whichever brand ink (dark or cream) reads better on the swatch. */
function readableInk(rgb: [number, number, number]): string {
  const dark = hexToRgb(tokenValue("ink", "light"));
  const cream = hexToRgb(tokenValue("ink", "dark"));
  return rgbToHex(contrastRatio(rgb, dark) >= contrastRatio(rgb, cream) ? dark : cream);
}

const lineLabel = (line: Line) =>
  line === "dark" ? "VALORES DE GLITTER BAR · NOCHE" : "VALORES DE PHOTOBOOTH · CLARO";

export function ColorSection({ line, notify }: SectionProps) {
  const copy = async (hex: string) => {
    const copied = await copyText(hex);
    notify(copied ? `Copiado: ${hex}` : `No se pudo copiar. El valor es ${hex}`);
  };

  return (
    <>
      <SectionHeader
        eyebrow="COLOR"
        title="Un solo brillo"
        lead="Casi monocromo: negro, marfil y un gris cálido, con un único acento dorado. Toca un color para copiar su HEX."
      />

      <div className={ui.block}>
        <span className={ui.label}>{lineLabel(line)}</span>
        <div className={styles.swatches}>
          {SWATCHES.map(({ token, name, usage }) => {
            const rgb = hexToRgb(tokenValue(token, line));
            const hex = rgbToHex(rgb);
            return (
              <button
                key={token}
                type="button"
                className={styles.swatch}
                style={{ background: hex, color: readableInk(rgb) }}
                aria-label={`${name}, ${token}, ${hex}. Copiar HEX`}
                onClick={() => copy(hex)}
              >
                <span>
                  <b>{name}</b>
                  <span className={styles.swatchToken}>{token}</span>
                </span>
                <span className={styles.swatchUsage}>{usage}</span>
                <span className={styles.swatchValues}>
                  <span>HEX {hex}</span>
                  <span>RGB {rgb.join(" ")}</span>
                  <span>CMYK {rgbToCmyk(rgb).join(" ")}</span>
                </span>
              </button>
            );
          })}
        </div>
        <p className={ui.note}>
          El CMYK es una conversión directa del RGB. Para imprimir, confírmalo con una prueba de color o elige un
          Pantone; en piezas físicas el dorado idealmente es foil.
        </p>
      </div>

      <div className={ui.block}>
        <span className={ui.label}>PROPORCIÓN</span>
        <div className={styles.proportion} role="img" aria-label="60% fondo, 30% ink, 10% dorado o menos">
          <span className={styles.proportionBackground}>60% FONDO</span>
          <span className={styles.proportionInk}>30% INK</span>
          <span className={styles.proportionGold}>10%</span>
        </div>
        <p className={ui.note}>El dorado es el brillo: si aparece en todo, deja de brillar.</p>
      </div>

      <FitChecker line={line} />
    </>
  );
}
