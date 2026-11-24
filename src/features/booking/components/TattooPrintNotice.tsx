import React from "react";
import styles from "@assets/css/contract-public.module.css";
import { TATTOO_PRINT_MAX } from "../utils/tattooDesigns";

const mutedText = { color: "var(--bp-brown-2)", fontSize: 13 } as const;

/** Only a few tattoos are printed; this tells which ones win when there are more. */
export function TattooPrintNotice() {
  return (
    <div role="note" className={styles.tattooPriority}>
      <div style={{ display: "grid", gap: 2 }}>
        <strong className={styles.tattooPriorityTitle}>
          Imprimimos{" "}
          <span className={styles.tattooPriorityCount}>{TATTOO_PRINT_MAX}</span>{" "}
          tatuajes
        </strong>
        <span style={mutedText}>Si eliges más, los escogemos en este orden:</span>
      </div>
      <ol className={styles.tattooPriorityList}>
        <li>
          <span style={{ display: "grid", gap: 2 }}>
            <span>Diseños que subes tú</span>
            <span style={{ ...mutedText, fontWeight: 400 }}>
              Si creaste tu propio tatuaje, se imprime primero.
            </span>
          </span>
        </li>
        <li>
          <span style={{ display: "grid", gap: 2 }}>
            <span>Templates con tus fotos</span>
            <span style={{ ...mutedText, fontWeight: 400 }}>
              (nosotros los diseñamos)
            </span>
          </span>
        </li>
        <li>Diseños del catálogo</li>
      </ol>
    </div>
  );
}
