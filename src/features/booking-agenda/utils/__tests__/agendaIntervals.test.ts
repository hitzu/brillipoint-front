import { describe, expect, it } from "vitest";
import type { AgendaEntry } from "../../types";
import { entryIntervalsForDay } from "../agendaIntervals";
import { dayAvailability } from "../agendaAvailability";
import { agendaEntriesToCalendarEvents } from "../agendaCalendar";

const entry = (overrides: Partial<AgendaEntry>): AgendaEntry => ({
  key: "agenda:1",
  id: 1,
  bookingId: 1,
  contractId: 1,
  sku: "SKU-1",
  title: null,
  clientName: null,
  venueName: null,
  date: "2026-09-18",
  startsAt: null,
  endsAt: null,
  blocks: [],
  isApproximate: true,
  continuesFromPreviousDay: false,
  continuesNextDay: false,
  ...overrides,
});

describe("agenda civil-day intervals", () => {
  it("keeps non-contiguous blocks separate in cards, free time, and time-grid events", () => {
    const event = entry({ blocks: ["am_block", "night_block"] });
    expect(entryIntervalsForDay("2026-09-18", event)).toEqual([
      { start: 240, end: 720, allDay: false },
      { start: 1200, end: 1440, allDay: false },
    ]);
    expect(dayAvailability("2026-09-18", [event]).freeIntervals).toEqual([
      { start: 0, end: 240 },
      { start: 720, end: 1200 },
    ]);
    expect(agendaEntriesToCalendarEvents({ "2026-09-18": [event] })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          start: "2026-09-18T04:00:00",
          end: "2026-09-18T12:00:00",
          allDay: false,
        }),
        expect.objectContaining({
          start: "2026-09-18T20:00:00",
          end: "2026-09-19T00:00:00",
          allDay: false,
        }),
      ])
    );
  });

  it("carries an overnight event into the visible next-day range", () => {
    const event = entry({
      date: "2026-09-20",
      startsAt: "2026-09-21T04:00:00Z",
      endsAt: "2026-09-21T08:00:00Z",
    });
    expect(entryIntervalsForDay("2026-09-21", event)).toEqual([
      { start: 0, end: 120, allDay: false },
    ]);
  });

  it("uses an all-day event only when the API supplied neither times nor blocks", () => {
    expect(
      agendaEntriesToCalendarEvents({
        "2026-09-18": [entry({ blocks: [] })],
      })[0]
    ).toEqual(expect.objectContaining({ allDay: true }));
  });
});

it("does not project a midnight-exclusive ending as a second all-day card", () => {
  const event = entry({
    startsAt: "2026-09-18T15:00:00Z",
    endsAt: "2026-09-19T06:00:00Z",
  });
  expect(entryIntervalsForDay("2026-09-19", event)).toEqual([]);
});
