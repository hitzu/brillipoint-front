// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BookingCalendar } from "../components/BookingCalendar";
import type { AgendaEntry } from "../types";

const entry: AgendaEntry = {
  key: "agenda:1",
  id: 1,
  bookingId: 1,
  contractId: 10,
  sku: "SKU-1",
  title: null,
  clientName: "Cliente",
  venueName: null,
  date: "2026-09-18",
  continuesFromPreviousDay: false,
  continuesNextDay: false,
  startsAt: "2026-09-18T15:00:00Z",
  endsAt: "2026-09-18T17:00:00Z",
  blocks: [],
  isApproximate: false,
};

describe("BookingCalendar", () => {
  it("selects dates and keeps the independent read-only/weekend props", () => {
    const onDateSelect = vi.fn();
    render(
      <BookingCalendar
        entries={{ "2026-09-18": [entry] }}
        selectedDate="2026-09-18"
        weekendsOnly
        readOnly
        onDateSelect={onDateSelect}
      />
    );
    expect(
      screen.getByTestId("agenda-weekend-filter").getAttribute("data-readonly")
    ).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Vie18" }));
    expect(onDateSelect).toHaveBeenCalledWith("2026-09-18");
    expect(screen.getAllByText("SKU-1").length).toBeGreaterThan(0);
  });
});

it("mounts only the mobile calendar tree at the mobile breakpoint", () => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({
      matches: true,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  });

  render(
    <BookingCalendar
      entries={{ "2026-09-18": [entry] }}
      selectedDate="2026-09-18"
    />
  );

  expect(
    screen.getByRole("region", { name: "Disponibilidad móvil" })
  ).toBeTruthy();
  expect(screen.queryByRole("region", { name: "Resumen semanal" })).toBeNull();
});
