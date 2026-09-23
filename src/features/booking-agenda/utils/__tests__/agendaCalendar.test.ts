import { describe, expect, it } from "vitest";
import { civilSelectionRange } from "../agendaCalendar";

describe("civilSelectionRange", () => {
  it("reads the civil date and HH:mm bounds from a same-day selection", () => {
    const start = new Date("2026-09-15T14:00:00.000Z");
    const end = new Date("2026-09-15T20:00:00.000Z");
    expect(civilSelectionRange(start, end)).toEqual({
      date: "2026-09-15",
      startsAt: "14:00",
      endsAt: "20:00",
    });
  });

  it("keeps the start's civil date when the selection crosses midnight", () => {
    const start = new Date("2026-09-15T20:00:00.000Z");
    const end = new Date("2026-09-16T04:00:00.000Z");
    expect(civilSelectionRange(start, end)).toEqual({
      date: "2026-09-15",
      startsAt: "20:00",
      endsAt: "04:00",
    });
  });
});
