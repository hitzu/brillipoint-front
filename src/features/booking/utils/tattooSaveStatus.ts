// What the selection bar tells the client about saving. Every mutation of the
// tattoo tab (upload, choose, remove) saves by itself; this only makes it visible.
export type TattooSaveStatus = "idle" | "saving" | "saved" | "error" | "locked";

/** How the last finished mutation ended; "none" until the first one. */
export type TattooSaveOutcome = "none" | "saved" | "failed";

export const TATTOO_SAVE_STATUS_TEXT: Record<TattooSaveStatus, string> = {
  idle: "Tus cambios se guardan solos",
  saving: "Guardando…",
  saved: "Guardado ✓",
  error: "No se pudo guardar",
  locked: "Cerrado: ya no se pueden modificar",
};

export const deriveTattooSaveStatus = ({
  locked,
  isBusy,
  outcome,
}: {
  locked: boolean;
  isBusy: boolean;
  outcome: TattooSaveOutcome;
}): TattooSaveStatus => {
  if (locked) return "locked";
  if (isBusy) return "saving";
  if (outcome === "failed") return "error";
  if (outcome === "saved") return "saved";
  return "idle";
};
