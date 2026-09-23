import { describe, expect, it } from "vitest";
import { isWeekendAgendaDay } from "../businessDate";
import {
  isSameMonth,
  monthFetchRange,
  monthGridDates,
  monthRange,
  monthsInRange,
} from "../monthGrid";

describe("monthGridDates", () => {
  it("starts the grid on the Monday of the week containing the 1st (Thu Oct 1 2026)", () => {
    const grid = monthGridDates("2026-10-01");
    expect(grid[0][0]).toBe("2026-09-28");
    expect(grid.at(-1)!.at(-1)).toBe("2026-11-01");
    expect(grid.length).toBeGreaterThanOrEqual(4);
    expect(grid.length).toBeLessThanOrEqual(6);
    for (const week of grid) expect(week).toHaveLength(7);
  });

  it("starts on the anchor itself when the month begins on a Monday (2026-06-01)", () => {
    const grid = monthGridDates("2026-06-01");
    expect(grid[0][0]).toBe("2026-06-01");
  });

  it("keeps only Fri/Sat/Sun per week when weekendsOnly is set", () => {
    const grid = monthGridDates("2026-10-01", { weekendsOnly: true });
    for (const week of grid) {
      expect(week).toHaveLength(3);
      for (const date of week) expect(isWeekendAgendaDay(date)).toBe(true);
    }
  });

  it("drops weeks whose Fri/Sat/Sun all fall outside the anchor month", () => {
    const full = monthGridDates("2026-10-01");
    const weekendOnly = monthGridDates("2026-10-01", { weekendsOnly: true });
    expect(weekendOnly.length).toBeLessThanOrEqual(full.length);
    // First week of the grid (Sep 28 - Oct 4) has its Fri/Sat/Sun in October.
    expect(weekendOnly[0]).toEqual(["2026-10-02", "2026-10-03", "2026-10-04"]);
  });
});

describe("monthRange", () => {
  it("returns the first and last grid dates, inclusive", () => {
    expect(monthRange("2026-10-01")).toEqual({
      from: "2026-09-28",
      to: "2026-11-01",
    });
  });
});

describe("monthFetchRange", () => {
  it("adds one extra day past the grid end for the last day's early-hours timeline", () => {
    expect(monthFetchRange("2026-10-01")).toEqual({
      from: "2026-09-28",
      to: "2026-11-02",
    });
  });
});

describe("isSameMonth", () => {
  it("compares by year-month", () => {
    expect(isSameMonth("2026-10-15", "2026-10-01")).toBe(true);
    expect(isSameMonth("2026-11-01", "2026-10-01")).toBe(false);
  });
});

describe("monthsInRange", () => {
  it("returns only the months the weekend view's fetch range actually needs, no duplicates", () => {
    const { from, to } = monthFetchRange("2026-10-15", { weekendsOnly: true });
    expect({ from, to }).toEqual({ from: "2026-10-02", to: "2026-11-02" });
    expect(monthsInRange(from, to)).toEqual([
      { year: 2026, month: 10 },
      { year: 2026, month: 11 },
    ]);
  });

  it("spans three months for the wider month view's fetch range", () => {
    const { from, to } = monthFetchRange("2026-10-15");
    expect({ from, to }).toEqual({ from: "2026-09-28", to: "2026-11-02" });
    expect(monthsInRange(from, to)).toEqual([
      { year: 2026, month: 9 },
      { year: 2026, month: 10 },
      { year: 2026, month: 11 },
    ]);
  });

  it("rolls the year over across a December/January boundary", () => {
    expect(monthsInRange("2026-12-28", "2027-01-03")).toEqual([
      { year: 2026, month: 12 },
      { year: 2027, month: 1 },
    ]);
  });

  it("returns a single month when the range does not cross a boundary", () => {
    expect(monthsInRange("2030-10-04", "2030-10-28")).toEqual([
      { year: 2030, month: 10 },
    ]);
  });
});
