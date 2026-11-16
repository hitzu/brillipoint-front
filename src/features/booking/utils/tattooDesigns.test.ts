import { describe, expect, it } from "vitest";
import {
  getTattooClosingDay,
  getTattooEventDate,
  hasTattooDesignsProduct,
  TATTOO_DESIGNS_MAX,
  TATTOO_DESIGNS_TRIGGER_PRODUCT_IDS,
} from "./tattooDesigns";

describe("tattooDesigns", () => {
  it("allows up to 5 designs", () => {
    expect(TATTOO_DESIGNS_MAX).toBe(5);
  });

  describe("hasTattooDesignsProduct", () => {
    it('triggers on "Tatuajes personalizados" of Glitter bar (131) and Photobooth (122)', () => {
      expect([...TATTOO_DESIGNS_TRIGGER_PRODUCT_IDS].sort()).toEqual([122, 131]);
    });

    it("is true when a contracted package delivers a trigger product", () => {
      expect(
        hasTattooDesignsProduct([
          { deliverables: [{ productId: 1 }] },
          { deliverables: [{ productId: 1 }, { productId: 122 }] },
        ]),
      ).toBe(true);
      expect(hasTattooDesignsProduct([{ deliverables: [{ productId: 131 }] }])).toBe(
        true,
      );
    });

    it("is false when no package delivers a trigger product", () => {
      expect(hasTattooDesignsProduct([{ deliverables: [{ productId: 1 }] }])).toBe(
        false,
      );
      expect(hasTattooDesignsProduct([{}])).toBe(false);
      expect(hasTattooDesignsProduct([])).toBe(false);
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
