import React from "react";
import styles from "@assets/css/contract-public.module.css";
import FormDropzone from "@shared/forms/file-upload/FormDropzone";
import { PrepAssetMetadata } from "../../../interfaces";
import {
  TATTOO_DESIGNS_MAX,
  TattooCatalogChoice,
  TattooCatalogItem,
} from "../utils/tattooDesigns";

type Props = {
  designs: PrepAssetMetadata[];
  /** True once the API closed the window (7 days or less before the event). */
  locked: boolean;
  /** Human-readable last day to change designs, e.g. "12 de septiembre". */
  closingDayLabel: string | null;
  isBusy: boolean;
  errorMessage: string | null;
  /** Live catalog the client can choose from. */
  catalog: TattooCatalogItem[];
  /** Designs already chosen (frozen copies, they survive catalog changes). */
  chosen: TattooCatalogChoice[];
  onAddFiles: (files: File[]) => void;
  onRemove: (path: string) => void;
  /** Chooses the design if not chosen yet, otherwise removes it. */
  onToggleCatalog: (carouselId: number) => void;
};

const mutedText = { color: "var(--bp-brown-2)", fontSize: 13 } as const;

const thumbStyle = {
  width: "100%",
  aspectRatio: "1 / 1",
  objectFit: "cover",
  borderRadius: 12,
  border: "1px solid var(--bp-brown-4)",
  background: "transparent",
  display: "block",
} as const;

const chipStyle = {
  ...mutedText,
  fontWeight: 700,
  border: "1px solid var(--bp-brown-4)",
  borderRadius: 999,
  padding: "6px 12px",
} as const;

const removeButtonStyle = { minHeight: 44 } as const;

function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span
        aria-hidden="true"
        style={{
          width: 28,
          height: 28,
          flex: "none",
          borderRadius: 999,
          border: "2px solid var(--bp-brown-1)",
          color: "var(--bp-brown-1)",
          fontWeight: 900,
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {n}
      </span>
      <h3
        style={{
          margin: 0,
          color: "var(--bp-brown-1)",
          fontWeight: 900,
          fontSize: 16,
        }}
      >
        {children}
      </h3>
    </div>
  );
}

type Slot =
  | { kind: "upload"; key: string; src?: string; name: string; path: string }
  | { kind: "catalog"; key: string; src: string; name: string; id: number }
  | { kind: "empty"; key: string; n: number };

export function TattooDesignsView({
  designs,
  locked,
  closingDayLabel,
  isBusy,
  errorMessage,
  catalog,
  chosen,
  onAddFiles,
  onRemove,
  onToggleCatalog,
}: Props) {
  const total = designs.length + chosen.length;
  const isFull = total >= TATTOO_DESIGNS_MAX;
  const remaining = Math.max(TATTOO_DESIGNS_MAX - total, 0);
  const chosenIds = new Set(chosen.map((c) => c.carouselId));
  const canEdit = !locked;

  const filled: Slot[] = [
    ...designs.map((d, i): Slot => ({
      kind: "upload",
      key: d.path,
      src: d.url,
      name: `Diseño ${i + 1}`,
      path: d.path,
    })),
    ...chosen.map((c): Slot => ({
      kind: "catalog",
      key: `catalog-${c.carouselId}`,
      src: c.imageUrl,
      name: c.title,
      id: c.carouselId,
    })),
  ];
  // While editing the client always sees the 5 places; read-only shows only
  // what was saved.
  const slots: Slot[] = canEdit
    ? Array.from({ length: TATTOO_DESIGNS_MAX }, (_, i) =>
        filled[i] ?? { kind: "empty", key: `empty-${i}`, n: i + 1 },
      )
    : filled;

  return (
    <section className={styles.card} style={{ marginBottom: "1rem" }}>
      <div style={{ display: "grid", gap: "1.25rem" }}>
        <div style={{ display: "grid", gap: "0.6rem" }}>
          <h2
            style={{
              margin: 0,
              color: "var(--bp-brown-1)",
              fontWeight: 900,
              fontSize: 18,
            }}
          >
            Diseños de tatuajes
          </h2>
          <div style={mutedText}>
            Puedes <strong>subir hasta {TATTOO_DESIGNS_MAX} imágenes</strong> de
            los diseños que quieres. Si no te da el tiempo, puedes{" "}
            <strong>elegir de nuestro catálogo</strong> más abajo.
            {closingDayLabel && canEdit
              ? ` Puedes subir, cambiar o quitar diseños hasta el ${closingDayLabel}.`
              : ""}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <span style={chipStyle}>
              Subidas + catálogo = máximo {TATTOO_DESIGNS_MAX}
            </span>
            <span style={chipStyle}>
              Nuestro equipo necesita una semana para trabajarlos
            </span>
          </div>
        </div>

        {locked ? (
          <div role="status" style={{ ...mutedText, fontWeight: 800 }}>
            Ya no se pueden modificar los diseños porque tu evento está muy
            cerca. Si necesitas hacer un cambio, contáctanos.
          </div>
        ) : null}

        {canEdit ? (
          <div style={{ display: "grid", gap: "0.6rem" }}>
            <StepTitle n={1}>Sube tus diseños</StepTitle>
            {isFull ? (
              <div style={{ ...mutedText, fontWeight: 700 }}>
                Ya tienes tus {TATTOO_DESIGNS_MAX} diseños. Quita uno de abajo
                para agregar otro.
              </div>
            ) : (
              <div className={styles.tattooDropzone}>
                <FormDropzone
                  embedded
                  showPreviews={false}
                  multiple
                  disabled={isBusy}
                  description={`Imágenes · te quedan ${remaining} ${
                    remaining === 1 ? "lugar" : "lugares"
                  }`}
                  onFilesSelected={onAddFiles}
                />
              </div>
            )}
          </div>
        ) : null}

        <div style={{ display: "grid", gap: "0.6rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <h3
              style={{
                margin: 0,
                color: "var(--bp-brown-1)",
                fontWeight: 900,
                fontSize: 16,
              }}
            >
              Tus diseños
            </h3>
            <span
              aria-live="polite"
              style={{ ...mutedText, fontWeight: 900, fontSize: 15 }}
            >
              {`${total} de ${TATTOO_DESIGNS_MAX}`}
            </span>
          </div>
          {slots.length > 0 ? (
            <div
              style={{
                display: "grid",
                gap: "0.75rem",
                gridTemplateColumns: "repeat(auto-fill, minmax(112px, 1fr))",
              }}
            >
              {slots.map((slot) => {
                if (slot.kind === "empty") {
                  return (
                    <div
                      key={slot.key}
                      style={{ display: "grid", gap: "0.4rem", minWidth: 0 }}
                    >
                      <div
                        style={{
                          aspectRatio: "1 / 1",
                          borderRadius: 12,
                          border: "2px dashed var(--bp-brown-4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--bp-brown-2)",
                          fontWeight: 900,
                          fontSize: 20,
                        }}
                      >
                        {slot.n}
                      </div>
                      <span style={mutedText}>Lugar libre</span>
                    </div>
                  );
                }
                const origin = slot.kind === "catalog" ? "Catálogo" : "Subido";
                const image = slot.src ? (
                  <img src={slot.src} alt={slot.name} style={thumbStyle} />
                ) : null;
                return (
                  <div
                    key={slot.key}
                    style={{ display: "grid", gap: "0.4rem", minWidth: 0 }}
                  >
                    <div style={{ position: "relative" }}>
                      {slot.src ? (
                        <a
                          href={slot.src}
                          target="_blank"
                          rel="noreferrer"
                          title="Abrir imagen"
                        >
                          {image}
                        </a>
                      ) : null}
                      <span
                        style={{
                          position: "absolute",
                          left: 6,
                          top: 6,
                          fontSize: 11,
                          fontWeight: 800,
                          background: "var(--bp-card)",
                          color: "var(--bp-brown-1)",
                          borderRadius: 999,
                          padding: "3px 8px",
                        }}
                      >
                        {origin}
                      </span>
                    </div>
                    <span
                      style={{
                        ...mutedText,
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {slot.name}
                    </span>
                    {canEdit ? (
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        style={removeButtonStyle}
                        disabled={isBusy}
                        aria-label={`Quitar de mis diseños: ${slot.name}`}
                        onClick={() =>
                          slot.kind === "catalog"
                            ? onToggleCatalog(slot.id)
                            : onRemove(slot.path)
                        }
                      >
                        Quitar
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        {canEdit && catalog.length > 0 ? (
          <div
            style={{
              display: "grid",
              gap: "0.75rem",
              borderTop: "1px solid var(--bp-brown-4)",
              paddingTop: "1.25rem",
            }}
          >
            <div style={{ display: "grid", gap: 4 }}>
              <StepTitle n={2}>¿Sin tiempo? Elige de nuestro catálogo</StepTitle>
              <div style={mutedText}>
                Toca un diseño para agregarlo a tus {TATTOO_DESIGNS_MAX} lugares.
                Toca otra vez para quitarlo.
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gap: "0.75rem",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              }}
            >
              {catalog.map((item) => {
                const selected = chosenIds.has(item.id);
                const blocked = !selected && isFull;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    aria-label={`${selected ? "Quitar" : "Elegir"} ${item.title}`}
                    disabled={isBusy || blocked}
                    onClick={() => onToggleCatalog(item.id)}
                    style={{
                      display: "grid",
                      gap: "0.3rem",
                      padding: 8,
                      background: "transparent",
                      textAlign: "center",
                      borderRadius: 14,
                      border: selected
                        ? "3px solid var(--bp-brown-1)"
                        : "1px solid var(--bp-brown-4)",
                      opacity: blocked ? 0.5 : 1,
                      cursor: blocked ? "not-allowed" : "pointer",
                    }}
                  >
                    <img
                      src={item.imageUrl}
                      alt=""
                      style={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        objectFit: "cover",
                        borderRadius: 10,
                        display: "block",
                      }}
                    />
                    <span style={{ ...mutedText, fontWeight: 800 }}>
                      {item.title}
                    </span>
                    <span style={{ ...mutedText, fontSize: 12 }}>
                      {selected
                        ? "✓ Seleccionado"
                        : blocked
                          ? "Sin lugares libres"
                          : "Toca para elegir"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {isBusy ? <div style={mutedText}>Guardando...</div> : null}

        {errorMessage ? (
          <div role="alert" style={{ color: "#b3261e", fontWeight: 800 }}>
            {errorMessage}
          </div>
        ) : null}
      </div>
    </section>
  );
}
