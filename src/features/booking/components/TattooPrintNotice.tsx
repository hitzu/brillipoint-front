import React from "react";
import styles from "@assets/css/contract-public.module.css";
import {
  TATTOO_CATALOG_MAX,
  TATTOO_PRINT_MAX,
  TATTOO_UPLOADS_MAX,
} from "../utils/tattooDesigns";

const mutedText = { color: "var(--bp-brown-2)", fontSize: 13 } as const;

type Props = {
  /** Human-readable last day to change designs; only shown while editing. */
  closingDayLabel?: string | null;
  canEdit?: boolean;
};

/** Only a few tattoos are printed; this tells how it works and which ones win. */
export function TattooPrintNotice({
  closingDayLabel = null,
  canEdit = true,
}: Props) {
  return (
    <div role="note" className={styles.tattooPriority}>
      <div style={{ display: "grid", gap: 2 }}>
        <strong className={styles.tattooPriorityTitle}>¿Cómo funciona?</strong>
        <ol className={styles.tattooPriorityList} style={{ margin: "6px 0" }}>
          {[
            <>
              Sube hasta <strong>{TATTOO_UPLOADS_MAX} fotos o diseños</strong>{" "}
              tuyos.
            </>,
            <>
              Elige hasta <strong>{TATTOO_CATALOG_MAX} diseños</strong> de
              nuestro catálogo.
            </>,
            <>
              Nosotros escogemos <strong>{TATTOO_PRINT_MAX}</strong> de tus
              favoritos para imprimir.
            </>,
          ].map((text, index) => (
            <li key={index} style={{ fontWeight: 400, fontSize: 14 }}>
              <span>{text}</span>
            </li>
          ))}
        </ol>
        <strong
          className={styles.tattooPriorityTitle}
          style={{ marginTop: 10 }}
        >
          Si eliges más, los escogemos en este orden:
        </strong>
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
      {canEdit ? (
        <p className={styles.tattooSaveNote}>
          <strong>Todo se guarda automáticamente.</strong>
          {closingDayLabel ? (
            <>
              {" "}
              Puedes cambiar tus diseños cuando quieras, hasta el{" "}
              <strong>{closingDayLabel}</strong>.
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
