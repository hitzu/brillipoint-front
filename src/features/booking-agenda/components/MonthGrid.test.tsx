// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AgendaEntry, YMD } from "../types";
import { MonthGrid } from "./MonthGrid";

const ANCHOR: YMD = "2026-10-15";

/** Civil (America/Mexico_City, UTC-6) time on `date` as an ISO instant. */
const civilInstant = (date: YMD, time: string): string => {
  const [hour, minute] = time.split(":").map(Number);
  const instant = new Date(`${date}T00:00:00.000Z`);
  instant.setUTCHours(hour + 6, minute);
  return instant.toISOString();
};

const entry = (
  id: number,
  date: YMD,
  start: string,
  end: string,
  title: string
): AgendaEntry => ({
  key: `agenda:${id}`,
  id,
  bookingId: id,
  contractId: null,
  sku: null,
  title,
  clientName: null,
  venueName: null,
  date,
  continuesFromPreviousDay: false,
  continuesNextDay: false,
  startsAt: civilInstant(date, start),
  endsAt: civilInstant(date, end),
  blocks: [],
  isApproximate: false,
});

describe("MonthGrid", () => {
  it("renders 7 weekday columns and every padding day of the month grid", () => {
    render(
      <MonthGrid entries={{}} anchor={ANCHOR} onDateSelect={vi.fn()} today="2026-09-20" />
    );

    ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].forEach((label) =>
      expect(screen.getByRole("columnheader", { name: label })).toBeTruthy()
    );
    // 5 weeks x 7 days for October 2026 (Sep 28 - Nov 1).
    expect(screen.getAllByRole("gridcell")).toHaveLength(35);
    expect(
      screen.getByRole("gridcell", { name: /28 de septiembre de 2026/ })
    ).toBeTruthy();
  });

  it("calls onDateSelect when a day cell is clicked", () => {
    const onDateSelect = vi.fn();
    render(
      <MonthGrid entries={{}} anchor={ANCHOR} onDateSelect={onDateSelect} today="2026-09-20" />
    );

    fireEvent.click(
      screen.getByRole("gridcell", { name: /10 de octubre de 2026/ })
    );
    expect(onDateSelect).toHaveBeenCalledWith("2026-10-10");
  });

  it("never renders inline create buttons inside day cells", () => {
    render(
      <MonthGrid
        entries={{}}
        anchor={ANCHOR}
        onDateSelect={vi.fn()}
        today="2026-09-20"
      />
    );

    expect(screen.queryAllByRole("button", { name: /Apartar/ })).toHaveLength(
      0
    );
  });

  it("lists up to two events per day with time and label, then '+N más'", () => {
    const day: YMD = "2026-10-10";
    render(
      <MonthGrid
        entries={{
          [day]: [
            entry(1, day, "10:00", "12:00", "Boda"),
            entry(2, day, "14:00", "18:00", "XV años"),
            entry(3, day, "19:00", "22:00", "Bautizo"),
          ],
        }}
        anchor={ANCHOR}
        onDateSelect={vi.fn()}
        today="2026-09-20"
      />
    );

    const cell = within(
      screen.getByRole("gridcell", { name: /10 de octubre de 2026/ })
    );
    expect(cell.getByText("10:00 – 12:00 · Boda")).toBeTruthy();
    expect(cell.getByText("14:00 – 18:00 · XV años")).toBeTruthy();
    expect(cell.queryByText(/Bautizo/)).toBeNull();
    expect(cell.getByText("+1 más")).toBeTruthy();
  });

  it("shows no event text for an empty day", () => {
    render(
      <MonthGrid entries={{}} anchor={ANCHOR} onDateSelect={vi.fn()} today="2026-09-20" />
    );

    expect(screen.queryByText(/eventos?$/)).toBeNull();
  });

  it("renders no day detail panel below the grid: clicking a date drills into its detail", () => {
    render(
      <MonthGrid
        entries={{}}
        anchor={ANCHOR}
        selectedDate="2026-10-10"
        onDateSelect={vi.fn()}
        today="2026-09-20"
      />
    );

    expect(screen.queryByLabelText("Detalle 2026-10-10")).toBeNull();
    expect(
      screen.queryByRole("heading", { name: /10 de octubre de 2026/ })
    ).toBeNull();
    expect(
      screen
        .getByRole("gridcell", { name: /10 de octubre de 2026/ })
        .getAttribute("aria-selected")
    ).toBe("true");
  });

  it("opens an event from the day cell without selecting the date", () => {
    const day: YMD = "2026-10-10";
    const boda = entry(1, day, "10:00", "12:00", "Boda");
    const onDateSelect = vi.fn();
    const onEventSelect = vi.fn();
    render(
      <MonthGrid
        entries={{ [day]: [boda] }}
        anchor={ANCHOR}
        onDateSelect={onDateSelect}
        onEventSelect={onEventSelect}
        today="2026-09-20"
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "10:00 – 12:00 · Boda" })
    );

    expect(onEventSelect).toHaveBeenCalledWith(boda);
    expect(onDateSelect).not.toHaveBeenCalled();
  });

  it("keeps a keyboard-reachable button to select the date", () => {
    const onDateSelect = vi.fn();
    render(
      <MonthGrid
        entries={{}}
        anchor={ANCHOR}
        onDateSelect={onDateSelect}
        today="2026-09-20"
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /^Ver .*10 de octubre de 2026$/ })
    );

    expect(onDateSelect).toHaveBeenCalledWith("2026-10-10");
  });

  it("renders events as plain text when no event handler is given", () => {
    const day: YMD = "2026-10-10";
    render(
      <MonthGrid
        entries={{ [day]: [entry(1, day, "10:00", "12:00", "Boda")] }}
        anchor={ANCHOR}
        onDateSelect={vi.fn()}
        today="2026-09-20"
      />
    );

    expect(
      screen.queryByRole("button", { name: "10:00 – 12:00 · Boda" })
    ).toBeNull();
  });
});
