import React from "react";
import styles from "@assets/css/contract-public.module.css";
import {
  TATTOO_CATALOG_MAX,
  TATTOO_PRINT_MAX,
  TATTOO_UPLOADS_MAX,
} from "../utils/tattooDesigns";

const mutedText = { color: "var(--bp-brown-2)", fontSize: 13 } as const;

const stepBadgeStyle = {
  flex: "none",
  width: 24,
  height: 24,
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  background: "var(--bp-brown-1)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 800,
} as const;

type Props = {
  /** Adds the how-it-works steps and the saving/closing footer (the tab, not the summary). */
  showSteps?: boolean;
  /** Human-readable last day to change designs; only shown while editing. */
  closingDayLabel?: string | null;
  canEdit?: boolean;
};

/** Only a few tattoos are printed; this tells how it works and which ones win. */
export function TattooPrintNotice({
  showSteps = false,
  closingDayLabel = null,
  canEdit = true,
}: Props) {
  return (
    <div role="note" className={styles.tattooPriority}>
      <div style={{ display: "grid", gap: 2 }}>
        <strong className={styles.tattooPriorityTitle}>
          Imprimimos{" "}
          <span className={styles.tattooPriorityCount}>{TATTOO_PRINT_MAX}</span>{" "}
          tatuajes
        </strong>
        {showSteps ? (
          <div style={{ display: "grid", gap: 8, margin: "6px 0" }}>
            {[
              <>
                Sube hasta <strong>{TATTOO_UPLOADS_MAX} fotos o diseños</strong> tuyos.
              </>,
              <>
                Elige hasta <strong>{TATTOO_CATALOG_MAX} diseños</strong> de nuestro
                catálogo.
              </>,
              <>
                Nosotros escogemos <strong>{TATTOO_PRINT_MAX}</strong> de tus favoritos
                para imprimir.
              </>,
            ].map((text, index) => (
              <div
                key={index}
                style={{ display: "flex", gap: 10, alignItems: "center" }}
              >
                <span style={stepBadgeStyle} aria-hidden="true">
                  {index + 1}
                </span>
                <span style={{ color: "var(--bp-brown-1)", fontSize: 14 }}>{text}</span>
              </div>
            ))}
          </div>
        ) : null}
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
      {showSteps && canEdit ? (
        <span style={mutedText}>
          Todo se guarda solo.
          {closingDayLabel
            ? ` Puedes cambiar tus elecciones hasta el ${closingDayLabel}.`
            : ""}
        </span>
      ) : null}
    </div>
  );
}
