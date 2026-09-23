import { describe, expect, it } from "vitest";
import type { AgendaEntry, YMD } from "../../types";
import { blockCreateOptions, exactCreateOptions } from "../createOptions";

const civilInstant = (date: YMD, time: string): string => {
  const [hour, minute] = time.split(":").map(Number);
  const instant = new Date(`${date}T00:00:00.000Z`);
  instant.setUTCHours(instant.getUTCHours() + hour + 6, minute);
  return instant.toISOString();
};

const entry = (
  date: YMD,
  startTime: string,
  endTime: string,
  id = 1
): AgendaEntry => ({
  key: `agenda:${id}`,
  id,
  bookingId: id,
  contractId: null,
  sku: null,
  title: "Ocupado",
  clientName: null,
  venueName: null,
  date,
  continuesFromPreviousDay: false,
  continuesNextDay: false,
  startsAt: civilInstant(date, startTime),
  endsAt: civilInstant(date, endTime),
  blocks: [],
  isApproximate: false,
});

const DATE: YMD = "2026-09-15";

describe("blockCreateOptions", () => {
  it("offers every block on an empty day", () => {
    expect(blockCreateOptions(DATE, {})).toEqual([
      { label: "Mañana", date: DATE, startsAt: "04:00", endsAt: "12:00", blockId: "am_block" },
      { label: "Tarde", date: DATE, startsAt: "12:00", endsAt: "20:00", blockId: "pm_block" },
      { label: "Noche", date: DATE, startsAt: "20:00", endsAt: "04:00", blockId: "night_block" },
    ]);
  });

  it("offers only the night block after an 11:00-14:00 booking", () => {
    const entries = { [DATE]: [entry(DATE, "11:00", "14:00")] };
    expect(blockCreateOptions(DATE, entries)).toEqual([
      { label: "Noche", date: DATE, startsAt: "20:00", endsAt: "04:00", blockId: "night_block" },
    ]);
  });
});

describe("exactCreateOptions", () => {
  it("offers the whole window as one option on an empty day", () => {
    expect(exactCreateOptions(DATE, {})).toEqual([
      { label: "Libre 04:00–04:00", date: DATE, startsAt: "04:00", endsAt: "04:00" },
    ]);
  });

  it("offers both free segments around an 11:00-14:00 booking", () => {
    const entries = { [DATE]: [entry(DATE, "11:00", "14:00")] };
    expect(exactCreateOptions(DATE, entries)).toEqual([
      { label: "Libre 04:00–11:00", date: DATE, startsAt: "04:00", endsAt: "11:00" },
      { label: "Libre 14:00–04:00", date: DATE, startsAt: "14:00", endsAt: "04:00" },
    ]);
  });
});
