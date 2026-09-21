// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CalendarView } from "./CalendarView";

const { getPublicBookingCalendar } = vi.hoisted(() => ({
  getPublicBookingCalendar: vi.fn(),
}));
vi.mock("../services/publicBookingCalendar", () => ({
  getPublicBookingCalendar,
}));

const empty = {};

describe("CalendarView", () => {
  beforeEach(() => vi.clearAllMocks());
  it("waits for every cross-month request before rendering free days and seeds only a date", async () => {
    let resolveSeptember!: (value: typeof empty) => void;
    let resolveOctober!: (value: typeof empty) => void;
    getPublicBookingCalendar
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSeptember = resolve;
          })
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOctober = resolve;
          })
      );
    const onPickDate = vi.fn();

    render(<CalendarView initialDate="2026-10-04" onPickDate={onPickDate} />);

    expect(screen.getByText("Cargando disponibilidad…")).toBeTruthy();
    expect(screen.queryByText("Sin eventos")).toBeNull();
    expect(screen.queryByText(/Libre/)).toBeNull();
    expect(getPublicBookingCalendar).toHaveBeenNthCalledWith(
      1,
      2026,
      9,
      expect.any(AbortSignal)
    );
    expect(getPublicBookingCalendar).toHaveBeenNthCalledWith(
      2,
      2026,
      10,
      expect.any(AbortSignal)
    );

    resolveSeptember({});
    resolveOctober({
      "2026-10-02": [
        {
          key: "public:2026-10-02:0",
          id: 1,
          bookingId: 1,
          contractId: null,
          sku: null,
          title: "Ocupado",
          clientName: null,
          venueName: null,
          date: "2026-10-02",
          continuesFromPreviousDay: false,
          continuesNextDay: false,
          startsAt: "2026-10-02T18:00:00.000Z",
          endsAt: "2026-10-02T20:00:00.000Z",
          blocks: [],
          isApproximate: false,
        },
      ],
    });

    await screen.findByText("Ocupado");
    expect(screen.queryByText("Private client")).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Editar|Nuevo evento/i })
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Vie2" }));
    expect(onPickDate).toHaveBeenCalledWith("2026-10-02");
  });

  it("shows an error instead of an unverified free week and retries", async () => {
    getPublicBookingCalendar.mockRejectedValueOnce(new Error("network"));
    render(<CalendarView initialDate="2026-10-04" />);

    expect((await screen.findByRole("alert")).textContent).toContain(
      "No se pudo cargar la disponibilidad."
    );
    expect(screen.queryByText("Sin eventos")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await waitFor(() =>
      expect(getPublicBookingCalendar).toHaveBeenCalledTimes(4)
    );
  });
});
