import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import styles from "@assets/css/contract-public.module.css";
import FormDropzone from "@shared/forms/file-upload/FormDropzone";
import { PrepAssetMetadata } from "../../../interfaces";
import {
  TATTOO_CATALOG_MAX,
  TATTOO_PRINT_MAX,
  TATTOO_UPLOADS_MAX,
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
  /** Live catalog the client can choose from (templates and final designs). */
  catalog: TattooCatalogItem[];
  /** Reference photos showing what a good upload looks like. */
  examples?: TattooCatalogItem[];
  /** Designs already chosen (frozen copies, they survive catalog changes). */
  chosen: TattooCatalogChoice[];
  onAddFiles: (files: File[]) => void;
  onRemove: (path: string) => void;
  /** Chooses the design if not chosen yet, otherwise removes it. */
  onToggleCatalog: (carouselId: number) => void;
};

const mutedText = { color: "var(--bp-brown-2)", fontSize: 13 } as const;

const thumbStyle = {
  boxSizing: "border-box",
  width: "100%",
  aspectRatio: "1 / 1",
  objectFit: "cover",
  borderRadius: 12,
  border: "1px solid var(--bp-brown-4)",
  background: "transparent",
  display: "block",
} as const;

// Never cropped: the example is an instruction graphic, every part matters.
const exampleImageStyle = {
  width: "100%",
  height: "auto",
  maxHeight: "75vh",
  objectFit: "contain",
  borderRadius: 12,
  display: "block",
} as const;

const removeButtonStyle = { minHeight: 44 } as const;

// Explicit single column: an implicit `auto` track lets the empty slot's
// aspect-ratio box grow wider than its grid cell.
const slotCellStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "0.4rem",
  minWidth: 0,
} as const;

function StepTitle({
  n,
  children,
  action,
}: {
  n: number;
  children: React.ReactNode;
  /** Optional control shown at the end of the title row (wraps on mobile). */
  action?: React.ReactNode;
}) {
  return (
    <div
      data-step-row
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 10,
      }}
    >
      <StepHeading n={n}>{children}</StepHeading>
      {action}
    </div>
  );
}

function StepHeading({ n, children }: { n: number; children: React.ReactNode }) {
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

function CatalogGroup({
  kicker,
  tone,
  title,
  hint,
  children,
}: {
  kicker: string;
  tone: "template" | "final";
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <div className={styles.tattooGroupHeader}>
        <span
          className={`${styles.tattooGroupKicker} ${
            tone === "template"
              ? styles.tattooGroupKickerTemplate
              : styles.tattooGroupKickerFinal
          }`}
        >
          {kicker}
        </span>
        <h4 className={styles.tattooGroupTitle}>{title}</h4>
        <span style={mutedText}>{hint}</span>
      </div>
      <div
        style={{
          display: "grid",
          gap: "0.75rem",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        }}
      >
        {children}
      </div>
    </div>
  );
}


function SectionHeading({
  children,
  count,
  max,
}: {
  children: React.ReactNode;
  count: number;
  max: number;
}) {
  return (
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
        {children}
      </h3>
      <span aria-live="polite" style={{ ...mutedText, fontWeight: 900, fontSize: 15 }}>
        {`${count} de ${max}`}
      </span>
    </div>
  );
}

export function TattooDesignsView({
  designs,
  locked,
  closingDayLabel,
  isBusy,
  errorMessage,
  catalog,
  examples = [],
  chosen,
  onAddFiles,
  onRemove,
  onToggleCatalog,
}: Props) {
  const [showExamples, setShowExamples] = useState(false);
  const uploadsFull = designs.length >= TATTOO_UPLOADS_MAX;
  const catalogFull = chosen.length >= TATTOO_CATALOG_MAX;
  const remaining = Math.max(TATTOO_UPLOADS_MAX - designs.length, 0);
  const chosenIds = new Set(chosen.map((c) => c.carouselId));
  const canEdit = !locked;
  // In edit mode the catalog tiles already show what is chosen; the list below
  // only carries choices whose catalog row is gone (and everything when read-only).
  const catalogIds = new Set(catalog.map((item) => item.id));
  const listedChoices = canEdit
    ? chosen.filter((c) => !catalogIds.has(c.carouselId))
    : chosen;

  const templates = catalog.filter((item) => item.kind === "template");
  const finals = catalog.filter((item) => item.kind !== "template");

  // One tile per saved file, no placeholders: the dropzone already tells how
  // many places are left. Chosen templates never take an upload place.
  const uploads = designs.map((d, i) => ({
    key: d.path,
    src: d.url,
    name: `Diseño ${i + 1}`,
    path: d.path,
  }));

  const renderTile = (item: TattooCatalogItem) => {
        const selected = chosenIds.has(item.id);
        const blocked = !selected && catalogFull;
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
            <span style={{ position: "relative", display: "block" }}>
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
              {selected ? (
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    right: 6,
                    top: 6,
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    background: "#3F6B4F",
                    color: "#fff",
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✓
                </span>
              ) : null}
            </span>
            <span style={{ ...mutedText, fontWeight: 800 }}>
              {item.title}
            </span>
            <span style={{ ...mutedText, fontSize: 12 }}>
              {selected
                ? "Seleccionado"
                : blocked
                  ? "Sin lugares libres"
                  : "Toca para elegir"}
            </span>
          </button>
        );
  };

  return (
    <section className={styles.card} style={{ marginBottom: "1rem" }}>
      <div style={{ display: "grid", gap: "1.25rem" }}>
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

        <div role="note" className={styles.tattooPriority}>
          <div style={{ display: "grid", gap: 2 }}>
            <strong className={styles.tattooPriorityTitle}>
              Imprimimos{" "}
              <span className={styles.tattooPriorityCount}>
                {TATTOO_PRINT_MAX}
              </span>{" "}
              tatuajes
            </strong>
            <span style={mutedText}>
              Si eliges más, los escogemos en este orden:
            </span>
          </div>
          <ol className={styles.tattooPriorityList}>
            <li>Tu diseño final</li>
            <li>Templates con tus fotos</li>
            <li>Diseños del catálogo</li>
          </ol>
        </div>

        <div style={mutedText}>
          Puedes <strong>subir hasta {TATTOO_UPLOADS_MAX} fotos o diseños</strong>{" "}
          tuyos y <strong>elegir hasta {TATTOO_CATALOG_MAX} diseños</strong> de
          nuestro catálogo.
          {closingDayLabel && canEdit
            ? ` Puedes cambiar tus elecciones hasta el ${closingDayLabel}.`
            : ""}
        </div>

        {locked ? (
          <div role="status" style={{ ...mutedText, fontWeight: 800 }}>
            Ya no se pueden modificar los diseños porque tu evento está muy
            cerca. Si necesitas hacer un cambio, contáctanos.
          </div>
        ) : null}

        {canEdit ? (
          <div style={{ display: "grid", gap: "0.6rem" }}>
            <StepTitle
              n={1}
              action={
                examples.length > 0 ? (
                  <button
                    type="button"
                    className={styles.tattooExamplesChip}
                    onClick={() => setShowExamples(true)}
                  >
                    <img src={examples[0].imageUrl} alt="" />
                    <span>
                      ¿Cómo funciona? <strong>Ver ejemplo</strong>
                    </span>
                  </button>
                ) : null
              }
            >
              Sube tus fotos o diseños
            </StepTitle>
            {uploadsFull ? (
              <div style={{ ...mutedText, fontWeight: 700 }}>
                Ya tienes tus {TATTOO_UPLOADS_MAX} fotos y diseños. Quita uno de
                abajo para agregar otro.
              </div>
            ) : (
              <div className={styles.tattooDropzone}>
                <FormDropzone
                  embedded
                  showPreviews={false}
                  multiple
                  disabled={isBusy}
                  label="Pulsa aquí para agregar o arrastra para subir tus selfies"
                  description={
                    <>
                      <span style={{ display: "block" }}>
                        Con ellas personalizamos los templates que elijas. O
                        también puedes subir tus diseños finales.
                      </span>
                      <span
                        style={{ display: "block", marginTop: 6, fontWeight: 800 }}
                      >
                        {remaining === 1
                          ? "Te queda 1 espacio"
                          : `Te quedan ${remaining} espacios`}
                      </span>
                    </>
                  }
                  onFilesSelected={onAddFiles}
                />
              </div>
            )}
          </div>
        ) : null}

        {uploads.length > 0 ? (
          <div style={{ display: "grid", gap: "0.6rem" }}>
            <SectionHeading count={designs.length} max={TATTOO_UPLOADS_MAX}>
              Tus fotos y diseños
            </SectionHeading>
            <div
              style={{
                display: "grid",
                gap: "0.75rem",
                gridTemplateColumns: "repeat(auto-fill, minmax(112px, 1fr))",
              }}
            >
              {uploads.map((slot) => {
                return (
                  <div
                    key={slot.key}
                    style={slotCellStyle}
                  >
                    {slot.src ? (
                      <a
                        href={slot.src}
                        target="_blank"
                        rel="noreferrer"
                        title="Abrir imagen"
                      >
                        <img src={slot.src} alt={slot.name} style={thumbStyle} />
                      </a>
                    ) : null}
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
                        onClick={() => onRemove(slot.path)}
                      >
                        Quitar
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {chosen.length > 0 || (canEdit && catalog.length > 0) ? (
          <div
            style={{
              display: "grid",
              gap: "0.75rem",
              borderTop: "1px solid var(--bp-brown-4)",
              paddingTop: "1.25rem",
            }}
          >
            {canEdit && catalog.length > 0 ? (
              <StepTitle n={2}>Elige de nuestro catálogo</StepTitle>
            ) : null}
            <SectionHeading count={chosen.length} max={TATTOO_CATALOG_MAX}>
              Tu selección del catálogo
            </SectionHeading>
            {canEdit && templates.length > 0 ? (
              <CatalogGroup
                kicker="Personalizable"
                tone="template"
                title="Templates con tus fotos"
                hint="Elige los que te gusten: les ponemos tu rostro usando tus selfies."
              >
                {templates.map(renderTile)}
              </CatalogGroup>
            ) : null}
            {canEdit && finals.length > 0 ? (
              <CatalogGroup
                kicker="Listo para imprimir"
                tone="final"
                title="Diseños listos"
                hint="Se imprimen tal como los ves."
              >
                {finals.map(renderTile)}
              </CatalogGroup>
            ) : null}

            {listedChoices.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gap: "0.75rem",
                  gridTemplateColumns: "repeat(auto-fill, minmax(112px, 1fr))",
                }}
              >
                {listedChoices.map((design) => (
                  <div
                    key={`catalog-${design.carouselId}`}
                    style={slotCellStyle}
                  >
                    <a
                      href={design.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Abrir imagen"
                    >
                      <img src={design.imageUrl} alt={design.title} style={thumbStyle} />
                    </a>
                    <span style={{ ...mutedText, fontWeight: 700 }}>
                      {design.title}
                    </span>
                    {canEdit ? (
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        style={removeButtonStyle}
                        disabled={isBusy}
                        aria-label={`Quitar de mi selección: ${design.title}`}
                        onClick={() => onToggleCatalog(design.carouselId)}
                      >
                        Quitar
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {isBusy ? <div style={mutedText}>Guardando...</div> : null}

        {errorMessage ? (
          <div role="alert" style={{ color: "#b3261e", fontWeight: 800 }}>
            {errorMessage}
          </div>
        ) : null}
      </div>
      <Modal
        show={showExamples}
        onHide={() => setShowExamples(false)}
        centered
        scrollable
        size="lg"
        aria-labelledby="tattoo-examples-title"
      >
        <Modal.Header closeButton closeLabel="Cerrar">
          <Modal.Title id="tattoo-examples-title" as="h2" style={{ fontSize: 18 }}>
            ¿Qué foto funciona mejor?
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p style={mutedText}>
            Las fotos claras y de frente funcionan mejor. Nuestro equipo elige
            la mejor foto para cada template.
          </p>
          {/* The example image explains itself: shown whole, as large as the
              modal allows, with no caption. */}
          <div style={{ display: "grid", gap: "1rem" }}>
            {examples.map((example) => (
              <img
                key={example.id}
                src={example.imageUrl}
                alt={example.title}
                style={exampleImageStyle}
              />
            ))}
          </div>
        </Modal.Body>
      </Modal>
    </section>
  );
}
