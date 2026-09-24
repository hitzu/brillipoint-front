// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgendaEntry, YMD } from "../../booking-agenda/types";
import { CalendarView } from "./CalendarView";

const { getPublicBookingCalendar } = vi.hoisted(() => ({
  getPublicBookingCalendar: vi.fn(),
}));
vi.mock("../services/publicBookingCalendar", () => ({
  getPublicBookingCalendar,
}));

/** Mexico City civil time has no DST: UTC = civil + 6h. */
const civilInstant = (date: YMD, time: string): string => {
  const [hour, minute] = time.split(":").map(Number);
  const instant = new Date(`${date}T00:00:00.000Z`);
  instant.setUTCHours(instant.getUTCHours() + hour + 6, minute);
  return instant.toISOString();
};

const occupiedEntry = (
  date: YMD,
  startTime: string,
  endTime: string
): AgendaEntry => ({
  key: `public:${date}:0`,
  id: 1,
  bookingId: 1,
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

const cellFor = (date: YMD): HTMLElement => {
  const cell = document.querySelector(`[data-date="${date}"]`);
  if (!cell) throw new Error(`No cell rendered for ${date}`);
  return cell as HTMLElement;
};

// Dates comfortably in the future relative to any real run date, so grid
// cells never fall into the "past" branch that hides create buttons.
const FREE_WEEKEND_DAY: YMD = "2030-10-04";
const BOOKED_WEEKEND_DAY: YMD = "2030-10-11";
const ANCHOR: YMD = "2030-10-15";

describe("CalendarView", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the month-weekends grid by default", async () => {
    getPublicBookingCalendar.mockResolvedValue({});
    render(<CalendarView initialDate={ANCHOR} />);

    await waitFor(() =>
      expect(screen.getByRole("columnheader", { name: "Viernes" })).toBeTruthy()
    );
    expect(screen.getByRole("columnheader", { name: "Sábado" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Domingo" })).toBeTruthy();
  });

  it("switches to the month grid via the restricted view picker", async () => {
    getPublicBookingCalendar.mockResolvedValue({});
    render(<CalendarView initialDate={ANCHOR} />);

    await waitFor(() =>
      expect(screen.getByRole("columnheader", { name: "Viernes" })).toBeTruthy()
    );

    // The picker offers only the two views this task restricts it to.
    expect(screen.queryByRole("button", { name: "Resumen" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Horarios" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Mes" }));

    await waitFor(() =>
      expect(screen.getByRole("region", { name: "Mes" })).toBeTruthy()
    );
    expect(screen.queryByRole("columnheader", { name: "Viernes" })).toBeNull();
  });

  it("shows one button per free block on a fully free future weekend day", async () => {
    getPublicBookingCalendar.mockResolvedValue({});
    render(<CalendarView initialDate={ANCHOR} />);

    await waitFor(() => expect(cellFor(FREE_WEEKEND_DAY)).toBeTruthy());

    const cell = within(cellFor(FREE_WEEKEND_DAY));
    expect(cell.getByRole("button", { name: /Apartar Mañana/ })).toBeTruthy();
    expect(cell.getByRole("button", { name: /Apartar Tarde/ })).toBeTruthy();
    expect(cell.getByRole("button", { name: /Apartar Noche/ })).toBeTruthy();
  });

  it("offers only the night block after an 11:00-14:00 booking, without exposing client data", async () => {
    getPublicBookingCalendar.mockResolvedValue({
      [BOOKED_WEEKEND_DAY]: [occupiedEntry(BOOKED_WEEKEND_DAY, "11:00", "14:00")],
    });
    render(<CalendarView initialDate={ANCHOR} />);

    await waitFor(() => expect(cellFor(BOOKED_WEEKEND_DAY)).toBeTruthy());

    const cell = within(cellFor(BOOKED_WEEKEND_DAY));
    const disabled = (name: RegExp) =>
      (cell.getByRole("button", { name }) as HTMLButtonElement).disabled;
    expect(disabled(/Apartar Mañana/)).toBe(true);
    expect(disabled(/Apartar Tarde/)).toBe(true);
    expect(disabled(/Apartar Noche/)).toBe(false);
    // Public entries never carry a client name — only the anonymous "Ocupado".
    expect(cell.getAllByText("Ocupado").length).toBeGreaterThan(0);
    expect(cell.queryByText(/@|tel|client/i)).toBeNull();
  });

  it("calls onReserve with the date and block when a block button is clicked", async () => {
    getPublicBookingCalendar.mockResolvedValue({
      [BOOKED_WEEKEND_DAY]: [occupiedEntry(BOOKED_WEEKEND_DAY, "11:00", "14:00")],
    });
    const onReserve = vi.fn();
    render(<CalendarView initialDate={ANCHOR} onReserve={onReserve} />);

    await waitFor(() => expect(cellFor(BOOKED_WEEKEND_DAY)).toBeTruthy());
    fireEvent.click(
      within(cellFor(BOOKED_WEEKEND_DAY)).getByRole("button", {
        name: /Apartar Noche/,
      })
    );

    expect(onReserve).toHaveBeenCalledWith({
      date: BOOKED_WEEKEND_DAY,
      blockId: "night_block",
    });
  });

  it("still calls onPickDate when a day header is clicked (no block)", async () => {
    getPublicBookingCalendar.mockResolvedValue({});
    const onPickDate = vi.fn();
    render(<CalendarView initialDate={ANCHOR} onPickDate={onPickDate} />);

    await waitFor(() => expect(cellFor(FREE_WEEKEND_DAY)).toBeTruthy());
    fireEvent.click(
      within(cellFor(FREE_WEEKEND_DAY)).getByRole("button", {
        name: /4 de octubre de 2030/,
      })
    );

    expect(onPickDate).toHaveBeenCalledWith(FREE_WEEKEND_DAY);
  });

  it("navigates months without leaving the calendar", async () => {
    getPublicBookingCalendar.mockResolvedValue({});
    const onPickDate = vi.fn();
    render(<CalendarView initialDate={ANCHOR} onPickDate={onPickDate} />);

    await waitFor(() => expect(cellFor(FREE_WEEKEND_DAY)).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Noviembre" }));

    expect(onPickDate).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getAllByText(/Noviembre 2030/).length).toBeGreaterThan(0)
    );
  });

  it("waits for every cross-month request before rendering free days", async () => {
    let resolveNovember!: (value: Record<string, never>) => void;
    let resolveDecember!: (value: Record<string, never>) => void;
    getPublicBookingCalendar
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveNovember = resolve;
          })
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveDecember = resolve;
          })
      );

    render(<CalendarView initialDate="2030-11-01" />);

    expect(screen.getByText("Cargando disponibilidad…")).toBeTruthy();
    expect(getPublicBookingCalendar).toHaveBeenNthCalledWith(
      1,
      2030,
      11,
      expect.any(AbortSignal)
    );
    expect(getPublicBookingCalendar).toHaveBeenNthCalledWith(
      2,
      2030,
      12,
      expect.any(AbortSignal)
    );

    resolveNovember({});
    resolveDecember({});

    await waitFor(() =>
      expect(screen.queryByText("Cargando disponibilidad…")).toBeNull()
    );
  });

  it("shows an error instead of an unverified free grid and retries", async () => {
    getPublicBookingCalendar.mockRejectedValueOnce(new Error("network"));
    render(<CalendarView initialDate={ANCHOR} />);

    expect((await screen.findByRole("alert")).textContent).toContain(
      "No se pudo cargar la disponibilidad."
    );
    getPublicBookingCalendar.mockResolvedValueOnce({});
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await waitFor(() =>
      expect(getPublicBookingCalendar).toHaveBeenCalledTimes(2)
    );
  });

  it("uses the block scale, not hour labels, in expo", async () => {
    getPublicBookingCalendar.mockResolvedValue({});
    render(<CalendarView initialDate={ANCHOR} />);

    await waitFor(() => expect(cellFor(FREE_WEEKEND_DAY)).toBeTruthy());
    const cell = within(cellFor(FREE_WEEKEND_DAY));
    expect(cell.queryByText("08:00")).toBeNull();
    expect(cell.getByText("Tarde")).toBeTruthy();
  });

  it("renders with the public tone so the dark theme never applies to expo", async () => {
    getPublicBookingCalendar.mockResolvedValue({});
    render(<CalendarView initialDate={ANCHOR} />);

    await waitFor(() =>
      expect(screen.getByRole("navigation").getAttribute("data-tone")).toBe(
        "public"
      )
    );
    expect(screen.getByTestId("agenda-weekend-filter").getAttribute("data-tone")).toBe(
      "public"
    );
  });
});

