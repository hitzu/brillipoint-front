import React from "react";
import styles from "@assets/css/contract-public.module.css";
import FormDropzone from "@shared/forms/file-upload/FormDropzone";
import { PrepAssetMetadata } from "../../../interfaces";
import { TATTOO_DESIGNS_MAX } from "../utils/tattooDesigns";

type Props = {
  designs: PrepAssetMetadata[];
  /** True once the API closed the window (7 days or less before the event). */
  locked: boolean;
  /** Human-readable last day to change designs, e.g. "12 de septiembre". */
  closingDayLabel: string | null;
  isBusy: boolean;
  errorMessage: string | null;
  onAddFiles: (files: File[]) => void;
  onRemove: (path: string) => void;
};

const mutedText = { color: "var(--bp-brown-2)", fontSize: 13 } as const;

export function TattooDesignsView({
  designs,
  locked,
  closingDayLabel,
  isBusy,
  errorMessage,
  onAddFiles,
  onRemove,
}: Props) {
  const isFull = designs.length >= TATTOO_DESIGNS_MAX;
  const canEdit = !locked;

  return (
    <section className={styles.card} style={{ marginBottom: "1rem" }}>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <div
          style={{
            color: "var(--bp-brown-1)",
            fontWeight: 900,
            fontSize: 16,
          }}
        >
          Diseños de tatuajes
        </div>
        <div style={mutedText}>
          Sube las imágenes de los diseños que quieres (hasta {TATTOO_DESIGNS_MAX}
          ). Nuestro equipo necesita una semana para trabajarlos.
          {closingDayLabel && canEdit
            ? ` Puedes subir, cambiar o eliminar diseños hasta el ${closingDayLabel}.`
            : ""}
        </div>

        {locked ? (
          <div role="status" style={{ ...mutedText, fontWeight: 800 }}>
            Ya no se pueden modificar los diseños porque tu evento está muy
            cerca. Si necesitas hacer un cambio, contáctanos.
          </div>
        ) : null}

        <div style={{ ...mutedText, fontWeight: 900 }}>
          {`${designs.length} de ${TATTOO_DESIGNS_MAX} diseños`}
        </div>

        {designs.length > 0 ? (
          <div
            style={{
              display: "grid",
              gap: "0.75rem",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            }}
          >
            {designs.map((design, index) => (
              <div key={design.path} style={{ display: "grid", gap: "0.4rem" }}>
                {design.url ? (
                  <a
                    href={design.url}
                    target="_blank"
                    rel="noreferrer"
                    title="Abrir imagen"
                  >
                    <img
                      src={design.url}
                      alt={`Diseño ${index + 1}`}
                      style={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        objectFit: "cover",
                        borderRadius: 12,
                        border: "1px solid var(--bp-brown-4)",
                        background: "transparent",
                        display: "block",
                      }}
                    />
                  </a>
                ) : null}
                {canEdit ? (
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    disabled={isBusy}
                    aria-label={`Eliminar diseño ${index + 1}`}
                    onClick={() => onRemove(design.path)}
                  >
                    Eliminar
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {canEdit && !isFull ? (
          <div className={styles.tattooDropzone}>
            <FormDropzone
              embedded
              showPreviews={false}
              multiple
              disabled={isBusy}
              description="Toca para seleccionar tus diseños"
              onFilesSelected={onAddFiles}
            />
          </div>
        ) : null}

        {canEdit && isFull ? (
          <div style={mutedText}>
            Ya alcanzaste el máximo de {TATTOO_DESIGNS_MAX} diseños. Elimina uno
            para subir otro.
          </div>
        ) : null}

        {isBusy ? <div style={mutedText}>Guardando...</div> : null}

        {errorMessage ? (
          <div
            role="alert"
            style={{ color: "#b3261e", fontWeight: 800 }}
          >
            {errorMessage}
          </div>
        ) : null}
      </div>
    </section>
  );
}
