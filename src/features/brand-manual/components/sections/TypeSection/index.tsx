import { themeVars } from "../../../constants/tokens";
import { TESTER_STYLES, TYPE_SCALE } from "../../../constants/typography";
import { SectionHeader } from "../../ui/SectionHeader";
import { typeClass } from "../../ui/typeClass";
import { VerdictBox } from "../../ui/VerdictBox";
import ui from "../../ui/ui.module.css";
import type { SectionProps } from "../types";
import styles from "./TypeSection.module.css";
import { useTypeTester } from "./useTypeTester";

export function TypeSection(_props: SectionProps) {
  const tester = useTypeTester();

  return (
    <>
      <SectionHeader
        eyebrow="TIPOGRAFÍA"
        title="Dos familias, nunca más"
        lead="Jost para todo lo que se lee. Amsterdam One para un solo acento por pieza."
      />

      <div className={styles.specimens}>
        <div className={styles.specimen} style={themeVars("dark")}>
          <span className={styles.specimenGlyph}>Aa</span>
          <div>
            <b className={styles.specimenName}>Jost</b>
            <p>Títulos, textos, botones y etiquetas. Títulos en 500, texto en 400. Es el sustituto web de Futura.</p>
          </div>
          <span className={styles.specimenChars}>
            ABCDEFGHIJKLMNÑOPQRSTUVWXYZ
            <br />
            abcdefghijklmnñopqrstuvwxyz
            <br />
            0123456789 $ , . ¿? ¡!
          </span>
        </div>
        <div className={`${styles.specimen} ${styles.specimenScript}`}>
          <span className={styles.specimenGlyph}>Brillipoint</span>
          <div>
            <b className={styles.specimenName}>Amsterdam One</b>
            <p>Solo acentos: una palabra o frase corta por pieza. Nunca en mayúsculas ni en párrafos.</p>
          </div>
          <span className={styles.specimenChars}>abcdefghijklmnñopqrstuvwxyz</span>
        </div>
      </div>
      <p className={ui.note}>
        Pendiente: confirmar la licencia comercial de Amsterdam One. Mientras tanto no se publica la fuente: este
        manual la muestra si la tienes instalada; si no, verás una script de reemplazo.
      </p>

      <div className={styles.tester}>
        <div className={styles.testerHead}>
          <h3 className={ui.blockTitle}>Pruébala</h3>
          <div className={styles.styleSelector} role="radiogroup" aria-label="Estilo de texto">
            {TESTER_STYLES.map((item) => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={tester.style.id === item.id}
                onClick={() => tester.selectStyle(item.id)}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
        <label className={ui.label} htmlFor="type-tester-input">
          TU FRASE
        </label>
        <input
          id="type-tester-input"
          className={ui.input}
          type="text"
          maxLength={120}
          autoComplete="off"
          value={tester.text}
          onChange={(event) => tester.changeText(event.target.value)}
        />
        <div className={`${styles.preview} ${typeClass(tester.style.id)}`} data-testid="type-preview">
          {tester.preview}
        </div>
        <span className={styles.meta}>{tester.style.meta}</span>
        <VerdictBox kind={tester.verdict.kind} className={styles.testerVerdict} testId="type-verdict">
          {tester.verdict.message}
        </VerdictBox>
      </div>

      <div className={ui.block}>
        <span className={ui.label}>JERARQUÍA · PANTALLA Y PAPEL</span>
        <div className={styles.scale}>
          {TYPE_SCALE.map((row) => (
            <div key={row.id} className={styles.scaleRow}>
              <span>
                <b>{row.name}</b>
                <i>
                  {row.id} · {row.sizes}
                </i>
              </span>
              <span className={typeClass(row.id)}>{row.sample}</span>
            </div>
          ))}
        </div>
        <p className={ui.note}>
          Las etiquetas en mayúsculas se escriben ya en mayúsculas, con el espaciado amplio del arco del logo (0.24em).
        </p>
      </div>
    </>
  );
}
