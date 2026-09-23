import { describe, expect, it } from "vitest";
import type { AgendaEntry, YMD } from "../../types";
import { addDays } from "../businessDate";
import {
  isFullyFree,
  largestFreeGap,
  TIMELINE_TICKS,
  timelineSegments,
} from "../dayTimeline";

/** Mexico City civil time has no DST: UTC = civil + 6h. */
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

describe("timelineSegments", () => {
  it("returns a single free segment covering the whole window on an empty day", () => {
    const segments = timelineSegments(DATE, {});
    expect(segments).toEqual([
      {
        kind: "free",
        start: 0,
        end: 1440,
        startsAt: "04:00",
        endsAt: "04:00",
      },
    ]);
    expect(isFullyFree(segments)).toBe(true);
    expect(largestFreeGap(segments)).toEqual(segments[0]);
  });

  it("splits the window around an 11:00-14:00 booking on the date", () => {
    const entries = { [DATE]: [entry(DATE, "11:00", "14:00")] };
    const segments = timelineSegments(DATE, entries);

    expect(segments).toHaveLength(3);
    expect(segments[0]).toMatchObject({
      kind: "free",
      start: 0,
      end: 420,
      startsAt: "04:00",
      endsAt: "11:00",
    });
    expect(segments[1]).toMatchObject({
      kind: "occupied",
      start: 420,
      end: 600,
      startsAt: "11:00",
      endsAt: "14:00",
    });
    expect(segments[2]).toMatchObject({
      kind: "free",
      start: 600,
      end: 1440,
      startsAt: "14:00",
      endsAt: "04:00",
    });
    expect(isFullyFree(segments)).toBe(false);

    const largest = largestFreeGap(segments);
    expect(largest).toMatchObject({ start: 600, end: 1440 });
    expect(largest!.end - largest!.start).toBe(840);
  });

  it("places an early-hours booking on the next day at the end of the window", () => {
    const nextDate = addDays(DATE, 1);
    const entries = { [nextDate]: [entry(nextDate, "01:00", "03:00")] };
    const segments = timelineSegments(DATE, entries);

    const occupied = segments.find((segment) => segment.kind === "occupied");
    expect(occupied).toMatchObject({
      start: 1260,
      end: 1380,
      startsAt: "01:00",
      endsAt: "03:00",
    });
  });

  it("clips a booking that starts before the window to the window start", () => {
    const entries = { [DATE]: [entry(DATE, "02:00", "05:00")] };
    const segments = timelineSegments(DATE, entries);

    const occupied = segments.find((segment) => segment.kind === "occupied");
    expect(occupied).toMatchObject({
      start: 0,
      end: 60,
      startsAt: "04:00",
      endsAt: "05:00",
    });
  });
});

describe("TIMELINE_TICKS", () => {
  it("marks every 4h across the window", () => {
    expect(TIMELINE_TICKS.map((tick) => tick.label)).toEqual([
      "04:00",
      "08:00",
      "12:00",
      "16:00",
      "20:00",
      "00:00",
      "04:00",
    ]);
    expect(TIMELINE_TICKS.map((tick) => tick.offset)).toEqual([
      0, 240, 480, 720, 960, 1200, 1440,
    ]);
  });
});
