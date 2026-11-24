import { Modal } from "react-bootstrap";
import React from "react";
import styles from "@assets/css/contract-public.module.css";
import { PrepAssetMetadata } from "../../../interfaces";
import {
  TATTOO_CATALOG_MAX,
  TATTOO_PRINT_MAX,
  TATTOO_UPLOADS_MAX,
  TattooCatalogChoice,
} from "../utils/tattooDesigns";

type Props = {
  show: boolean;
  onHide: () => void;
  designs: PrepAssetMetadata[];
  chosen: TattooCatalogChoice[];
  /** Human-readable last day to change designs; null when there is no event date. */
  closingDayLabel: string | null;
  /** True once the window closed: nothing can change, so no deadline is shown. */
  locked: boolean;
};

const mutedText = { color: "var(--bp-brown-2)", fontSize: 13 } as const;

const thumbStyle = {
  boxSizing: "border-box",
  width: "100%",
  aspectRatio: "1 / 1",
  objectFit: "cover",
  borderRadius: 12,
  border: "1px solid var(--bp-brown-4)",
  display: "block",
} as const;

function SummaryGroup({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: Array<{ key: string; src?: string; name: string }>;
}) {
  return (
    <div style={{ display: "grid", gap: "0.6rem" }}>
      <h3
        style={{
          margin: 0,
          color: "var(--bp-brown-1)",
          fontWeight: 900,
          fontSize: 16,
        }}
      >
        {title}
      </h3>
      {items.length === 0 ? (
        <span style={mutedText}>{emptyText}</span>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "0.6rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))",
          }}
        >
          {items.map((item) =>
            item.src ? (
              <img key={item.key} src={item.src} alt={item.name} style={thumbStyle} />
            ) : (
              <span
                key={item.key}
                style={{
                  ...thumbStyle,
                  ...mutedText,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: 6,
                }}
              >
                {item.name}
              </span>
            ),
          )}
        </div>
      )}
    </div>
  );
}

/** What the client has so far. A view, not a step: closing it changes nothing. */
export function TattooSummaryModal({
  show,
  onHide,
  designs,
  chosen,
  closingDayLabel,
  locked,
}: Props) {
  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      scrollable
      size="lg"
      aria-labelledby="tattoo-summary-title"
    >
      <Modal.Header closeButton closeLabel="Cerrar ventana">
        <Modal.Title id="tattoo-summary-title" as="h2" style={{ fontSize: 18 }}>
          Lo que llevas elegido
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div style={{ display: "grid", gap: "1.25rem" }}>
          {closingDayLabel && !locked ? (
            <div style={mutedText}>
              {`Puedes hacer cambios hasta el ${closingDayLabel}.`}
            </div>
          ) : null}
          <SummaryGroup
            title={`Tus fotos y diseños: ${designs.length} de ${TATTOO_UPLOADS_MAX}`}
            emptyText="Todavía no has subido nada."
            items={designs.map((d, i) => ({
              key: d.path,
              src: d.url,
              name: `Diseño ${i + 1}`,
            }))}
          />
          <SummaryGroup
            title={`Tu selección del catálogo: ${chosen.length} de ${TATTOO_CATALOG_MAX}`}
            emptyText="Todavía no has elegido nada del catálogo."
            items={chosen.map((c) => ({
              key: `catalog-${c.carouselId}`,
              src: c.imageUrl,
              name: c.title,
            }))}
          />
          <p style={{ ...mutedText, margin: 0 }}>
            Nosotros escogemos <strong>{TATTOO_PRINT_MAX}</strong> de tus favoritos para
            imprimir.
          </p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button
          type="button"
          className={styles.btnSecondary}
          style={{ minHeight: 44 }}
          onClick={onHide}
        >
          Cerrar
        </button>
      </Modal.Footer>
    </Modal>
  );
}
