// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReservationDatesSection } from "./ReservationDatesSection";
import type { ReservationDateRow } from "../utils/reservationDates";

describe("ReservationDatesSection", () => {
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
});
