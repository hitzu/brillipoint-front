// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AgendaEntry, YMD } from "../types";
import { blockCreateOptions } from "../utils/createOptions";
import { MonthWeekendsGrid } from "./MonthWeekendsGrid";

const ANCHOR: YMD = "2026-10-15";

const civilInstant = (date: YMD, time: string): string => {
  const [hour, minute] = time.split(":").map(Number);
  const instant = new Date(`${date}T00:00:00.000Z`);
  instant.setUTCHours(instant.getUTCHours() + hour + 6, minute);
  return instant.toISOString();
};

const exactEntry = (date: YMD, startTime: string, endTime: string): AgendaEntry => ({
  key: "agenda:1",
  id: 1,
  bookingId: 1,
  contractId: null,
  sku: null,
  title: "Boda",
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

const cellFor = (date: YMD): HTMLElement => {
  const cell = document.querySelector(`[data-date="${date}"]`);
  if (!cell) throw new Error(`No cell rendered for ${date}`);
  return cell as HTMLElement;
};

describe("MonthWeekendsGrid", () => {
  it("renders only Fri/Sat/Sun cells for every week of the month", () => {
    render(
      <MonthWeekendsGrid
        entries={{}}
        anchor={ANCHOR}
        onDateSelect={vi.fn()}
        today="2026-09-20"
      />
    );

    expect(screen.getByRole("columnheader", { name: "Viernes" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Sábado" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Domingo" })).toBeTruthy();
    // 5 weeks touch October 2026, 3 weekend days each.
    expect(screen.getAllByRole("gridcell")).toHaveLength(15);
  });

  it("shows exact times and a single 'Apartar Noche' block button after an 11-14 booking", () => {
    const onCreateRequest = vi.fn();
    render(
      <MonthWeekendsGrid
        entries={{ "2026-10-03": [exactEntry("2026-10-03", "11:00", "14:00")] }}
        anchor={ANCHOR}
        onDateSelect={vi.fn()}
        getCreateOptions={blockCreateOptions}
        onCreateRequest={onCreateRequest}
        timelineScale="blocks"
        today="2026-09-20"
      />
    );

    const cell = within(cellFor("2026-10-03"));
    expect(
      cell.getByRole("listitem", { name: /Ocupado 11:00–14:00/ })
    ).toBeTruthy();
    const buttons = cell.getAllByRole("button", { name: /Apartar Noche/ });
    expect(buttons).toHaveLength(1);
    fireEvent.click(buttons[0]);
    expect(onCreateRequest).toHaveBeenCalledWith({
      label: "Noche",
      date: "2026-10-03",
      startsAt: "20:00",
      endsAt: "04:00",
      blockId: "night_block",
    });
  });

  it("never offers create buttons on a past day even when it is fully free", () => {
    render(
      <MonthWeekendsGrid
        entries={{}}
        anchor={ANCHOR}
        onDateSelect={vi.fn()}
        getCreateOptions={blockCreateOptions}
        onCreateRequest={vi.fn()}
        today="2026-10-20"
      />
    );

    // 2026-10-16 (Friday) is before today (2026-10-20) and fully free.
    const cell = within(cellFor("2026-10-16"));
    expect(cell.queryAllByRole("button", { name: /Apartar/ })).toHaveLength(0);
    expect(cellFor("2026-10-16").getAttribute("data-past")).toBe("true");
    expect(cell.getByText("Fecha pasada")).toBeTruthy();
  });

  it("marks days outside the anchor month as dimmed", () => {
    render(
      <MonthWeekendsGrid
        entries={{}}
        anchor={ANCHOR}
        onDateSelect={vi.fn()}
        today="2026-09-20"
      />
    );

    // The last weekend-week of October spills into November 1st.
    expect(cellFor("2026-11-01").getAttribute("data-outside-month")).toBe(
      "true"
    );
    expect(cellFor("2026-10-16").getAttribute("data-outside-month")).toBe(
      "false"
    );
  });

  it("offers no create actions on the hours scale: agenda weekends keep only \"Nuevo evento\" (T4)", () => {
    render(
      <MonthWeekendsGrid
        entries={{ "2026-10-03": [exactEntry("2026-10-03", "11:00", "14:00")] }}
        anchor={ANCHOR}
        onDateSelect={vi.fn()}
        getCreateOptions={blockCreateOptions}
        onCreateRequest={vi.fn()}
        today="2026-09-20"
      />
    );

    const cell = within(cellFor("2026-10-03"));
    expect(cell.getByText("Ocupado 11:00–14:00")).toBeTruthy();
    expect(cell.queryAllByRole("button", { name: /Apartar/ })).toHaveLength(0);
  });

  it("calls onDateSelect when the day header is clicked", () => {
    const onDateSelect = vi.fn();
    render(
      <MonthWeekendsGrid
        entries={{}}
        anchor={ANCHOR}
        onDateSelect={onDateSelect}
        today="2026-09-20"
      />
    );

    const cell = within(cellFor("2026-10-03"));
    fireEvent.click(cell.getByRole("button", { name: /3 de octubre de 2026/ }));
    expect(onDateSelect).toHaveBeenCalledWith("2026-10-03");
  });
});
