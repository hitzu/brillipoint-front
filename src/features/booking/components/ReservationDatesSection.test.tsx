// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ReservationDatesSection } from "./ReservationDatesSection";
import type { ReservationDateRow } from "../utils/reservationDates";

describe("ReservationDatesSection", () => {
  const originalTz = process.env.TZ;

  beforeEach(() => {
    process.env.TZ = "America/Mexico_City";
  });

  afterEach(() => {
    process.env.TZ = originalTz;
  });

  it("renders the creation date and event rows with long Spanish dates", () => {
    const dates: ReservationDateRow[] = [
      {
        key: "creation_date",
        purpose: "creation_date",
        date: "2026-01-10T15:00:00.000Z",
      },
      {
        key: "booking-1",
        purpose: "event",
        date: "2026-01-16",
      },
    ];

    render(<ReservationDatesSection dates={dates} />);

    expect(screen.getByText("Fecha de contratación")).toBeTruthy();
    expect(screen.getByText("Evento Principal")).toBeTruthy();
    expect(screen.getByText(/16 de enero de 2026/)).toBeTruthy();
  });

  it("shows the creation timestamp in local time, not the UTC day", () => {
    const dates: ReservationDateRow[] = [
      {
        key: "creation_date",
        purpose: "creation_date",
        // 03:00 UTC on the 23rd is still the 22nd in Mexico City (UTC-6).
        date: "2026-09-23T03:00:00.000Z",
      },
    ];

    render(<ReservationDatesSection dates={dates} />);

    expect(screen.getByText(/22 de septiembre de 2026/)).toBeTruthy();
  });
});
