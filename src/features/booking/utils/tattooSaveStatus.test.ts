import { describe, expect, it } from "vitest";
import { deriveTattooSaveStatus, TATTOO_SAVE_STATUS_TEXT } from "./tattooSaveStatus";

describe("deriveTattooSaveStatus", () => {
  const base = { locked: false, isBusy: false, outcome: "none" as const };

  it("starts idle until the first action", () => {
    expect(deriveTattooSaveStatus(base)).toBe("idle");
  });

  it("is saving while a mutation runs, whatever the last outcome was", () => {
    expect(deriveTattooSaveStatus({ ...base, isBusy: true })).toBe("saving");
    expect(deriveTattooSaveStatus({ ...base, isBusy: true, outcome: "failed" })).toBe("saving");
  });

  it("reports the last outcome once the mutation ends", () => {
    expect(deriveTattooSaveStatus({ ...base, outcome: "saved" })).toBe("saved");
    expect(deriveTattooSaveStatus({ ...base, outcome: "failed" })).toBe("error");
  });

  it("is locked above everything else", () => {
    expect(
      deriveTattooSaveStatus({ locked: true, isBusy: true, outcome: "saved" }),
    ).toBe("locked");
  });

  it("uses the exact copy from the issue", () => {
    expect(TATTOO_SAVE_STATUS_TEXT.idle).toBe("Tus cambios se guardan solos");
    expect(TATTOO_SAVE_STATUS_TEXT.saving).toBe("Guardando…");
    expect(TATTOO_SAVE_STATUS_TEXT.saved).toBe("Guardado ✓");
    expect(TATTOO_SAVE_STATUS_TEXT.locked).toBe("Cerrado: ya no se pueden modificar");
  });
});
