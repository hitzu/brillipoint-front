import { describe, expect, it } from "vitest";
import {
  buildWeekendRows,
  detectSwipe,
  stepMonth,
  toYMD,
} from "../calendar";

describe("toYMD", () => {
  it("zero-pads month and day and shifts the 0-based month", () => {
    expect(toYMD(2026, 0, 1)).toBe("2026-01-01");
    expect(toYMD(2026, 11, 25)).toBe("2026-12-25");
  });
});

describe("buildWeekendRows", () => {
  it("only includes Fridays, Saturdays and Sundays", () => {
    const rows = buildWeekendRows(2026, 0); // January 2026
    const days = rows.flatMap((r) => [r.fri, r.sat, r.sun].filter(Boolean));
    for (const day of days) {
      const dow = new Date(2026, 0, day as number).getDay();
      expect([5, 6, 0]).toContain(dow);
    }
  });

  it("groups the same weekend (Fri/Sat/Sun) into one row", () => {
    const rows = buildWeekendRows(2026, 0);
    // 2026-01-02 is Friday, 03 Saturday, 04 Sunday → same week row.
    const firstWeekend = rows.find((r) => r.fri === 2);
    expect(firstWeekend).toBeDefined();
    expect(firstWeekend?.sat).toBe(3);
    expect(firstWeekend?.sun).toBe(4);
  });

  it("returns rows sorted by week", () => {
    const rows = buildWeekendRows(2026, 0);
    const keys = rows.map((r) => r.key);
    expect(keys).toEqual([...keys].sort((a, b) => a - b));
  });
});

describe("detectSwipe", () => {
  it("returns prev when dragging right beyond threshold", () => {
    expect(detectSwipe(60)).toBe("prev");
  });

  it("returns next when dragging left beyond threshold", () => {
    expect(detectSwipe(-60)).toBe("next");
  });

  it("returns null when movement is within threshold", () => {
    expect(detectSwipe(40)).toBeNull();
    expect(detectSwipe(-40)).toBeNull();
  });
});

describe("stepMonth", () => {
  it("moves to previous month within same year", () => {
    expect(stepMonth(2026, 5, "prev", 2025, 2027)).toEqual({
      year: 2026,
      monthIdx: 4,
    });
  });

  it("moves across year boundaries when allowed", () => {
    expect(stepMonth(2026, 0, "prev", 2025, 2027)).toEqual({
      year: 2025,
      monthIdx: 11,
    });
    expect(stepMonth(2026, 11, "next", 2025, 2027)).toEqual({
      year: 2027,
      monthIdx: 0,
    });
  });

  it("returns null when movement would exceed limits", () => {
    expect(stepMonth(2025, 0, "prev", 2025, 2027)).toBeNull();
    expect(stepMonth(2027, 11, "next", 2025, 2027)).toBeNull();
  });
});
