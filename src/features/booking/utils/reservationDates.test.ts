import { describe, expect, it } from "vitest";
import type { ContractBooking } from "../../../interfaces";
import { getEventDate, toReservationDates } from "./reservationDates";

const booking = (overrides: Partial<ContractBooking>): ContractBooking => ({
  id: 1,
  status: "confirmed",
  purpose: "event",
  eventDate: "2120-01-16",
  serviceStartsAt: "2120-01-16T20:00:00.000Z",
  serviceEndsAt: "2120-01-17T00:00:00.000Z",
  title: null,
  venueName: null,
  ...overrides,
});

const createdAt = "2026-09-23T06:08:17.718Z";

describe("toReservationDates", () => {
  it("returns only the creation date row when there are no bookings", () => {
    expect(toReservationDates(createdAt, [])).toEqual([
      { key: "creation_date", purpose: "creation_date", date: createdAt },
    ]);
  });

  it("appends bookings after the creation date, sorted by event date", () => {
    const rows = toReservationDates(createdAt, [
      booking({ id: 2, purpose: "event", eventDate: "2120-01-16" }),
      booking({ id: 3, purpose: "trial_makeup", eventDate: "2119-12-01" }),
    ]);

    expect(rows).toEqual([
      { key: "creation_date", purpose: "creation_date", date: createdAt },
      { key: "booking-3", purpose: "trial_makeup", date: "2119-12-01" },
      { key: "booking-2", purpose: "event", date: "2120-01-16" },
    ]);
  });

  it("labels bookings without purpose as other", () => {
    const rows = toReservationDates(createdAt, [booking({ purpose: null })]);

    expect(rows[1].purpose).toBe("other");
  });

  it("tolerates a missing bookings array", () => {
    expect(toReservationDates(createdAt, undefined)).toHaveLength(1);
  });
});

describe("getEventDate", () => {
  it("returns the earliest event-purpose booking date", () => {
    const date = getEventDate([
      booking({ id: 1, purpose: "trial_hair", eventDate: "2119-11-01" }),
      booking({ id: 2, purpose: "event", eventDate: "2120-03-01" }),
      booking({ id: 3, purpose: "event", eventDate: "2120-01-16" }),
    ]);

    expect(date).toBe("2120-01-16");
  });

  it("falls back to the earliest booking when none is an event", () => {
    const date = getEventDate([
      booking({ id: 1, purpose: "meeting", eventDate: "2120-02-01" }),
      booking({ id: 2, purpose: "trial_nail", eventDate: "2120-01-05" }),
    ]);

    expect(date).toBe("2120-01-05");
  });

  it("returns null without bookings", () => {
    expect(getEventDate([])).toBeNull();
    expect(getEventDate(undefined)).toBeNull();
  });
});
