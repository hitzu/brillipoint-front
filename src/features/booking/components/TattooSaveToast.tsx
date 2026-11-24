import React, { useEffect, useRef, useState } from "react";
import { TattooSaveStatus } from "../utils/tattooSaveStatus";

const TOAST_MS = 1000;

const toastStyle = {
  position: "fixed",
  top: 16,
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 1080,
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 16px",
  borderRadius: 999,
  background: "#fff",
  border: "1px solid #2E9E5B",
  boxShadow: "0 8px 24px rgba(44, 32, 28, 0.2)",
  color: "var(--bp-brown-1)",
  fontWeight: 800,
  fontSize: 14,
  pointerEvents: "none",
} as const;

const checkStyle = {
  display: "grid",
  placeItems: "center",
  width: 22,
  height: 22,
  borderRadius: "50%",
  background: "#2E9E5B",
  color: "#fff",
  fontSize: 14,
} as const;

/**
 * Brief green check shown when a save finishes well. Purely visual: the
 * selection bar already announces "Guardado ✓" to screen readers.
 */
export function TattooSaveToast({ status }: { status: TattooSaveStatus }) {
  const previous = useRef(status);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const justSaved = previous.current === "saving" && status === "saved";
    previous.current = status;
    if (!justSaved) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), TOAST_MS);
    return () => clearTimeout(timer);
  }, [status]);

  if (!visible) return null;
  return (
    <div data-testid="tattoo-save-toast" aria-hidden="true" style={toastStyle}>
      <span style={checkStyle}>✓</span>
      Guardado
    </div>
  );
}
