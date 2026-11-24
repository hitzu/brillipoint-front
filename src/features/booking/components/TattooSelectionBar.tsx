import React from "react";
import styles from "@assets/css/contract-public.module.css";
import { TATTOO_CATALOG_MAX, TATTOO_UPLOADS_MAX } from "../utils/tattooDesigns";
import {
  TATTOO_SAVE_STATUS_TEXT,
  TattooSaveStatus,
} from "../utils/tattooSaveStatus";

type Props = {
  uploadsCount: number;
  catalogCount: number;
  status: TattooSaveStatus;
  onOpenSummary: () => void;
};

// The public reservation page pins its section nav to the bottom of the
// screen on phones (contract-public.module.css `.bottomNav`, below 768 px, up
// to 5.5rem tall). A bar stuck at `bottom: 0` would hide behind it, so it
// stops above it there.
const BAR_CSS = `
.tattoo-selection-bar { bottom: 0; }
@media (max-width: 767.98px) {
  .tattoo-selection-bar { bottom: calc(4.5rem + env(safe-area-inset-bottom)); }
}
`;

const barStyle = {
  // Travels with the scroll inside the tab, resting at the end of the card.
  // `bottom` lives in BAR_CSS because it depends on the screen width.
  position: "sticky",
  zIndex: 10,
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "10px 12px max(10px, env(safe-area-inset-bottom))",
  background: "var(--bp-card)",
  border: "1px solid var(--bp-brown-4)",
  borderRadius: 14,
  boxShadow: "0 -6px 18px rgba(44, 32, 28, 0.14)",
} as const;

const countersStyle = {
  color: "var(--bp-brown-1)",
  fontWeight: 900,
  fontSize: 14,
} as const;

const statusColor: Record<TattooSaveStatus, string> = {
  idle: "var(--bp-brown-2)",
  saving: "var(--bp-brown-2)",
  saved: "#3F6B4F",
  error: "#b3261e",
  locked: "var(--bp-brown-1)",
};

/** Sticky bar: how many the client has, whether it is saved, and the summary. */
export function TattooSelectionBar({
  uploadsCount,
  catalogCount,
  status,
  onOpenSummary,
}: Props) {
  return (
    <div
      role="region"
      aria-label="Tu selección"
      className="tattoo-selection-bar"
      style={barStyle}
    >
      <style>{BAR_CSS}</style>
      <div style={{ display: "grid", gap: 2, minWidth: 0, flex: "1 1 0" }}>
        <div style={countersStyle}>
          <span>{`Subidas ${uploadsCount} de ${TATTOO_UPLOADS_MAX}`}</span>
          <span aria-hidden="true"> · </span>
          <span>{`Templates ${catalogCount} de ${TATTOO_CATALOG_MAX}`}</span>
        </div>
        <span
          aria-live="polite"
          style={{ color: statusColor[status], fontSize: 13, fontWeight: 700 }}
        >
          {TATTOO_SAVE_STATUS_TEXT[status]}
        </span>
      </div>
      <button
        type="button"
        className={styles.btnSecondary}
        style={{
          width: "auto",
          flex: "none",
          minHeight: 44,
          padding: "0.5rem 1rem",
          whiteSpace: "nowrap",
        }}
        onClick={onOpenSummary}
      >
        Ver seleccionado
      </button>
    </div>
  );
}
