import { describe, expect, it } from "vitest";
import {
  addDays,
  isWeekendAgendaDay,
  rangeDates,
  weekStart,
} from "../businessDate";

describe("booking agenda dates", () => {
  it("covers the inclusive Monday through Sunday agenda range", () => {
    const start = weekStart("2026-09-16");
    expect(start).toBe("2026-09-14");
    expect(addDays(start, 6)).toBe("2026-09-20");
    expect(rangeDates(start, addDays(start, 7))).toHaveLength(7);
  });
  it("treats Friday, Saturday and Sunday as weekend agenda days", () => {
    expect(
      ["2026-09-18", "2026-09-19", "2026-09-20"].every(isWeekendAgendaDay)
    ).toBe(true);
    expect(isWeekendAgendaDay("2026-09-17")).toBe(false);
  });
});
