import { SectionHeader } from "../../ui/SectionHeader";
import { VerdictBox } from "../../ui/VerdictBox";
import ui from "../../ui/ui.module.css";
import type { SectionProps } from "../types";
import styles from "./PrintSection.module.css";
import { PRINT_CHECKS, usePrintChecklist } from "./usePrintChecklist";
import { usePrintChecklistEffects } from "./usePrintChecklistEffects";

export function PrintSection({ line }: SectionProps) {
  const checklist = usePrintChecklist();
  usePrintChecklistEffects(checklist.restore);

  return (
    <>
      <SectionHeader
        eyebrow="ANTES DE IMPRIMIR"
        title="Checklist de imprenta"
        lead="Revisa cada punto antes de mandar el archivo."
      />

      {line === "dark" ? (
        <VerdictBox kind="warn" label="CARA NOCHE" testId="print-line">
          Cara Glitter Bar (noche): negro enriquecido, aprox. C40 M30 Y30 K100; confírmalo con tu imprenta. Texto
          blanco en Jost 400 o más y de 8 pt como mínimo. Logo blanco plano; si hay presupuesto, foil dorado u
          holográfico.
        </VerdictBox>
      ) : (
        <VerdictBox kind="warn" label="CARA CLARA" testId="print-line">
          Cara Photobooth (claro): logo negro plano, sin glow ni sombra. El dorado, como foil o con un Pantone a
          definir.
        </VerdictBox>
      )}

      <div className={styles.progress}>
        <div className={styles.progressBar}>
          <i style={{ width: `${checklist.progress}%` }} />
        </div>
        <b>
          {checklist.done} de {checklist.total}
        </b>
      </div>

      <div className={styles.checks}>
        {PRINT_CHECKS.map((check, index) => (
          <label key={check} htmlFor={`print-check-${index}`}>
            <input
              id={`print-check-${index}`}
              type="checkbox"
              checked={checklist.checked.includes(index)}
              onChange={(event) => checklist.toggle(index, event.target.checked)}
            />
            <span>{check}</span>
          </label>
        ))}
      </div>

      <div className={ui.row}>
        <button type="button" className={`${ui.btn} ${ui.btnSecondary} ${ui.btnSmall}`} onClick={checklist.reset}>
          Empezar de nuevo
        </button>
      </div>
    </>
  );
}
