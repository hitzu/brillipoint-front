import { describe, expect, it } from "vitest";
import type { AgendaEntry, YMD } from "../../types";
import { blockAvailability } from "../blockAvailability";

const entry = (
  date: YMD,
  startsAt: string,
  endsAt: string,
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
  startsAt,
  endsAt,
  blocks: [],
  isApproximate: false,
});

describe("blockAvailability", () => {
  it("offers every block on an empty day", () => {
    expect(blockAvailability("2026-09-12", {})).toEqual({
      am_block: true,
      pm_block: true,
      night_block: true,
    });
  });

  it("withdraws only the block an event overlaps", () => {
    // The Sept 12 case: an 18:00-20:00 event against the 12:00-20:00 Tarde
    // block. Tarde cannot be delivered; the rest of the day is untouched.
    const entries = {
      "2026-09-12": [
        entry("2026-09-12", "2026-09-13T00:00:00.000Z", "2026-09-13T02:00:00.000Z"),
      ],
    };
    expect(blockAvailability("2026-09-12", entries)).toEqual({
      am_block: true,
      pm_block: false,
      night_block: true,
    });
  });

  it("treats a booking that merely touches a boundary as no overlap", () => {
    // 08:00-12:00 ends exactly where Tarde starts, so Tarde stays sellable.
    const entries = {
      "2026-09-12": [
        entry("2026-09-12", "2026-09-12T14:00:00.000Z", "2026-09-12T18:00:00.000Z"),
      ],
    };
    expect(blockAvailability("2026-09-12", entries)).toMatchObject({
      am_block: false,
      pm_block: true,
    });
  });

  it("bills the small hours to the previous day's night block", () => {
    // 01:00-03:00 on the 13th. The blocks start at 04:00, so those hours are
    // not the 13th's morning — they are the tail of the night sold on the
    // 12th (20:00 -> 04:00). The 12th loses its night; the 13th loses nothing.
    const entries = {
      "2026-09-13": [
        entry("2026-09-13", "2026-09-13T07:00:00.000Z", "2026-09-13T09:00:00.000Z"),
      ],
    };
    expect(blockAvailability("2026-09-12", entries)).toEqual({
      am_block: true,
      pm_block: true,
      night_block: false,
    });
    expect(blockAvailability("2026-09-13", entries)).toEqual({
      am_block: true,
      pm_block: true,
      night_block: true,
    });
  });

  it("withdraws every block an all-day booking covers", () => {
    // This is how a date gets blocked: the agenda's all-day preset writes a
    // 00:00-23:59 booking, and every block overlaps it. One mechanism — a
    // booking — instead of a separate blocking rule nobody can see.
    const entries = {
      "2026-09-12": [
        entry("2026-09-12", "2026-09-12T06:00:00.000Z", "2026-09-13T05:59:00.000Z"),
      ],
    };
    expect(blockAvailability("2026-09-12", entries)).toEqual({
      am_block: false,
      pm_block: false,
      night_block: false,
    });
  });

  it("also takes down the night sold on the day before a blocked date", () => {
    // The 11th's night runs 20:00 -> 04:00, so its tail lands inside the
    // blocked 12th. Blocking a date has to reach backwards or the venue gets
    // promised from 20:00 on the 11th into a day that is closed.
    const entries = {
      "2026-09-12": [
        entry("2026-09-12", "2026-09-12T06:00:00.000Z", "2026-09-13T05:59:00.000Z"),
      ],
    };
    expect(blockAvailability("2026-09-11", entries)).toEqual({
      am_block: true,
      pm_block: true,
      night_block: false,
    });
  });
});
