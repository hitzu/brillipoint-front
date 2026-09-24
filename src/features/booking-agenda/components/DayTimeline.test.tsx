// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AgendaEntry, YMD } from "../types";
import { blockCreateOptions, exactCreateOptions } from "../utils/createOptions";
import { DayTimeline } from "./DayTimeline";
import styles from "./DayTimeline.module.css";

const DATE: YMD = "2026-09-15";
const NEXT_DATE: YMD = "2026-09-16";

const civilInstant = (date: YMD, time: string): string => {
  const [hour, minute] = time.split(":").map(Number);
  const instant = new Date(`${date}T00:00:00.000Z`);
  instant.setUTCHours(instant.getUTCHours() + hour + 6, minute);
  return instant.toISOString();
};

const exactEntry = (
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

const overnightEntry = (date: YMD): AgendaEntry => ({
  key: "agenda:overnight",
  id: 9,
  bookingId: 9,
  contractId: null,
  sku: null,
  title: "Boda nocturna",
  clientName: null,
  venueName: null,
  date: DATE,
  continuesFromPreviousDay: date === NEXT_DATE,
  continuesNextDay: date === DATE,
  startsAt: null,
  endsAt: null,
  blocks: [],
  isApproximate: false,
});

describe("DayTimeline", () => {
  it("never shows the removed summary/actions text on the hours scale (T4)", () => {
    const entries = { [DATE]: [exactEntry(DATE, "11:00", "14:00")] };
    render(
      <DayTimeline
        date={DATE}
        entries={entries}
        getCreateOptions={exactCreateOptions}
        onCreateRequest={vi.fn()}
      />
    );
    expect(screen.queryByText("Libre todo el día")).toBeNull();
    expect(screen.queryByText(/Mayor hueco/)).toBeNull();
    expect(screen.queryByText(/Apartar Libre/)).toBeNull();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("shows exact occupied and free segment times in full density", () => {
    const entries = { [DATE]: [exactEntry(DATE, "11:00", "14:00")] };
    render(<DayTimeline date={DATE} entries={entries} density="full" />);
    expect(screen.getByText("Ocupado 11:00–14:00")).toBeTruthy();
    expect(screen.getByText("Libre 14:00–04:00")).toBeTruthy();
    expect(screen.getByText("Libre 04:00–11:00")).toBeTruthy();
  });

  it("renders no create buttons without a policy", () => {
    const entries = { [DATE]: [exactEntry(DATE, "11:00", "14:00")] };
    render(
      <DayTimeline
        date={DATE}
        entries={entries}
        onCreateRequest={vi.fn()}
      />
    );
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("dedupes an overnight entry that the API returns from both days", () => {
    const entries = {
      [DATE]: [overnightEntry(DATE)],
      [NEXT_DATE]: [overnightEntry(NEXT_DATE)],
    };
    render(<DayTimeline date={DATE} entries={entries} density="full" />);
    expect(screen.getAllByText("Boda nocturna")).toHaveLength(1);
  });

  it("positions every segment absolutely inside the bar", () => {
    render(
      <DayTimeline
        date={DATE}
        entries={{ [DATE]: [exactEntry(DATE, "14:00", "18:00")] }}
      />
    );

    const segments = screen.getAllByRole("listitem");
    expect(segments).toHaveLength(3);
    segments.forEach((segment) =>
      expect(segment.classList.contains(styles.segment)).toBe(true)
    );
  });

  it("shows a block scale instead of hour labels when scale is blocks", () => {
    render(
      <DayTimeline
        date={DATE}
        entries={{ [DATE]: [exactEntry(DATE, "14:00", "18:00")] }}
        scale="blocks"
      />
    );

    expect(screen.getByText("Mañana")).toBeTruthy();
    expect(screen.getByText("Tarde")).toBeTruthy();
    expect(screen.getByText("Noche")).toBeTruthy();
    expect(screen.queryByText("08:00")).toBeNull();
    expect(screen.queryByText(/Libre 04:00/)).toBeNull();
    // Exact times stay available to assistive tech and tooltips.
    expect(
      screen.getByRole("listitem", { name: /Ocupado 14:00–18:00/ })
    ).toBeTruthy();
  });

  it("turns the block scale into one button per block, disabling unavailable ones", () => {
    const onCreateRequest = vi.fn();
    render(
      <DayTimeline
        date={DATE}
        entries={{ [DATE]: [exactEntry(DATE, "11:00", "14:00")] }}
        scale="blocks"
        getCreateOptions={blockCreateOptions}
        onCreateRequest={onCreateRequest}
      />
    );

    const morning = screen.getByRole("button", { name: /Apartar Mañana/ });
    const afternoon = screen.getByRole("button", { name: /Apartar Tarde/ });
    const night = screen.getByRole("button", { name: /Apartar Noche/ });
    expect((morning as HTMLButtonElement).disabled).toBe(true);
    expect((afternoon as HTMLButtonElement).disabled).toBe(true);
    expect((night as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getAllByRole("button")).toHaveLength(3);
    expect(screen.queryByText(/Mayor hueco|Libre todo el día/)).toBeNull();

    fireEvent.click(night);
    expect(onCreateRequest).toHaveBeenCalledWith(
      expect.objectContaining({ blockId: "night_block", date: DATE })
    );
  });

  it("disables every block button when no create policy is given", () => {
    render(<DayTimeline date={DATE} entries={{}} scale="blocks" />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    buttons.forEach((button) =>
      expect((button as HTMLButtonElement).disabled).toBe(true)
    );
  });
});

