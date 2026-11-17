import { describe, expect, it } from "vitest";
import {
  getTattooClosingDay,
  getTattooEventDate,
  hasTattooDesignsInContract,
  isTattooDesignsName,
  TATTOO_CATALOG_MAX,
  TATTOO_UPLOADS_MAX,
} from "./tattooDesigns";

describe("tattooDesigns", () => {
  it("allows up to 10 uploads and 10 catalog choices, independently", () => {
    expect(TATTOO_UPLOADS_MAX).toBe(10);
    expect(TATTOO_CATALOG_MAX).toBe(10);
  });

  describe("isTattooDesignsName", () => {
    it.each([
      "Tatuajes personalizados",
      "TATUAJES PERSONALIZADOS",
      "Tatuajes personalizados (precio especial)",
      "Tatuaje personalizado",
      "Diseños personalizados de tatuajes",
      "Tátuajes personalizádos",
    ])('matches "%s"', (name) => {
      expect(isTattooDesignsName(name)).toBe(true);
    });

    it.each([
      "Tatuajes temporales",
      "Glitter tattoo",
      "Accesorios personalizados",
      "",
      null,
      undefined,
    ])("does not match %p", (name) => {
      expect(isTattooDesignsName(name)).toBe(false);
    });
  });

  describe("hasTattooDesignsInContract", () => {
    it("is true when a contracted package delivers a product with a matching name", () => {
      expect(
        hasTattooDesignsInContract({
          packages: [
            { deliverables: [{ name: "Glitter" }, { name: "Tatuajes personalizados" }] },
          ],
          extras: [],
        }),
      ).toBe(true);
    });

    it("is true when a paid extra delivers a matching product", () => {
      expect(
        hasTattooDesignsInContract({
          packages: [{ deliverables: [{ name: "Glitter" }] }],
          extras: [
            { nameSnapshot: "Beneficio a elegir", deliverables: [{ name: "Tatuajes personalizados" }] },
          ],
        }),
      ).toBe(true);
    });

    it("is true when the paid extra itself is named after the tattoo designs, even without products", () => {
      expect(
        hasTattooDesignsInContract({
          packages: [],
          extras: [
            { nameSnapshot: "Tatuajes personalizados (precio especial)", deliverables: [] },
          ],
        }),
      ).toBe(true);
    });

    it("is false when no package, extra or product name matches", () => {
      expect(
        hasTattooDesignsInContract({
          packages: [{ deliverables: [{ name: "Tatuajes temporales" }] }],
          extras: [{ nameSnapshot: "1 hora extra", deliverables: [{ name: "Maquillista" }] }],
        }),
      ).toBe(false);
      expect(hasTattooDesignsInContract({})).toBe(false);
      expect(hasTattooDesignsInContract(undefined)).toBe(false);
    });
  });

  describe("getTattooEventDate", () => {
    it("uses only the booking whose purpose is event", () => {
      expect(
        getTattooEventDate([
          { purpose: "trial_makeup", eventDate: "2026-08-01" },
          { purpose: "event", eventDate: "2026-09-20" },
        ]),
      ).toBe("2026-09-20");
    });

    it("returns null when there is no event booking", () => {
      expect(
        getTattooEventDate([{ purpose: "meeting", eventDate: "2026-08-01" }]),
      ).toBeNull();
      expect(getTattooEventDate(undefined)).toBeNull();
    });
  });

  describe("getTattooClosingDay", () => {
    it("is the last day the client can still change designs: 8 days before the event", () => {
      // The API closes when the event is 7 days away or closer.
      expect(getTattooClosingDay("2026-09-20")).toBe("2026-09-12");
    });

    it("crosses month boundaries", () => {
      expect(getTattooClosingDay("2026-03-05")).toBe("2026-02-25");
    });
  });
});
