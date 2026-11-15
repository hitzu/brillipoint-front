import { describe, expect, it } from "vitest";
import {
  getTattooClosingDay,
  getTattooEventDate,
  hasGlitterBarPackage,
  TATTOO_DESIGNS_MAX,
} from "./tattooDesigns";

describe("tattooDesigns", () => {
  it("allows up to 5 designs", () => {
    expect(TATTOO_DESIGNS_MAX).toBe(5);
  });

  describe("hasGlitterBarPackage", () => {
    it("is true only when some package belongs to brand 1 (Glitter bar)", () => {
      expect(hasGlitterBarPackage([{ brandId: 2 }])).toBe(false);
      expect(hasGlitterBarPackage([{ brandId: 2 }, { brandId: 1 }])).toBe(true);
      expect(hasGlitterBarPackage([])).toBe(false);
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
