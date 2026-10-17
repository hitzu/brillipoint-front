import { useState } from "react";
import { tokenValue } from "../../../constants/tokens";
import type { ColorToken, Line } from "../../../types";
import { fitVerdict } from "../../../utils/rules";
import { VerdictBox } from "../../ui/VerdictBox";
import ui from "../../ui/ui.module.css";
import styles from "./ColorSection.module.css";

const BACKGROUNDS: Array<[ColorToken, string]> = [
  ["surface-100", "surface-100 · fondo"],
  ["surface-200", "surface-200 · tarjeta"],
  ["surface-000", "surface-000 · puro"],
  ["gold-500", "gold-500 · dorado"],
  ["gold-100", "gold-100 · tinte"],
];

const TEXTS: Array<[ColorToken, string]> = [
  ["ink", "ink"],
  ["ink-muted", "ink-muted"],
  ["gold-700", "gold-700 · dorado texto"],
  ["gold-500", "gold-500 · dorado"],
  ["on-gold", "on-gold"],
  ["neon", "neon · blanco"],
];

/** "¿Encaja?": contrast of a text token on a background token for the active line, plus the brand rules. */
export function FitChecker({ line }: { line: Line }) {
  const [bg, setBg] = useState<ColorToken>("surface-100");
  const [fg, setFg] = useState<ColorToken>("gold-500");
  const { ratio, verdict } = fitVerdict(bg, fg, line);

  return (
    <div className={ui.block}>
      <h3 className={ui.blockTitle}>¿Encaja?</h3>
      <p className={ui.note}>
        Elige un fondo y un color de texto. El contraste se calcula con los valores de la línea activa y se cruzan las
        reglas de la marca.
      </p>
      <div className={styles.fit}>
        <div className={styles.fitControls}>
          <div className={styles.field}>
            <label htmlFor="fit-bg">Fondo</label>
            <span className={styles.selectWrap}>
              <select id="fit-bg" value={bg} onChange={(event) => setBg(event.target.value as ColorToken)}>
                {BACKGROUNDS.map(([token, label]) => (
                  <option key={token} value={token}>
                    {label}
                  </option>
                ))}
              </select>
            </span>
          </div>
          <div className={styles.field}>
            <label htmlFor="fit-fg">Texto</label>
            <span className={styles.selectWrap}>
              <select id="fit-fg" value={fg} onChange={(event) => setFg(event.target.value as ColorToken)}>
                {TEXTS.map(([token, label]) => (
                  <option key={token} value={token}>
                    {label}
                  </option>
                ))}
              </select>
            </span>
          </div>
        </div>
        <div className={styles.fitSample} style={{ background: tokenValue(bg, line), color: tokenValue(fg, line) }}>
          <b>Agenda tu fecha</b>
          <span>Set fotográfico profesional estilo gala durante la recepción.</span>
        </div>
      </div>
      <VerdictBox kind={verdict.kind} testId="fit-verdict">
        <span className={ui.num}>{ratio.toFixed(1)}:1</span> · {verdict.message}
      </VerdictBox>
    </div>
  );
}
