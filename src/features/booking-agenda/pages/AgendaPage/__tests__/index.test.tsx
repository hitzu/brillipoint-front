// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AgendaPage } from "..";

const agendaRangeSpy = vi.hoisted(() => vi.fn());

vi.mock("../../../hooks/useAgendaRange", () => ({
  useAgendaRange: agendaRangeSpy.mockImplementation(() => ({
    entries: {},
    status: "success",
    error: null,
    isRefreshing: false,
    refetch: vi.fn(),
  })),
}));

describe("AgendaPage", () => {
  it("uses the inclusive Monday-through-Sunday API range (plus one day for the timeline) and follows controlled initial dates", () => {
    const { rerender } = render(<AgendaPage initialDate="2026-09-18" />);
    // Week range is start..start+7 (one day past the ISO week) so the last
    // grid day's 04:00->04:00 DayTimeline sees the next day's early hours.
    expect(agendaRangeSpy).toHaveBeenLastCalledWith("2026-09-14", "2026-09-21");
    expect(screen.getByText(/14 sep/i)).toBeTruthy();

    rerender(<AgendaPage initialDate="2026-10-02" />);
    expect(screen.getByText(/28 sep/i)).toBeTruthy();
    expect(agendaRangeSpy).toHaveBeenLastCalledWith("2026-09-28", "2026-10-05");
  });

  it("opens the booking form prefilled when a free day-timeline segment is clicked", () => {
    render(<AgendaPage initialDate="2026-09-18" />);

    fireEvent.click(
      screen.getAllByRole("button", { name: /Apartar Libre/ })[0]
    );

    expect(screen.getByRole("dialog", { name: "Nuevo evento" })).toBeTruthy();
    expect((screen.getByLabelText("Fecha") as HTMLInputElement).value).toBe(
      "2026-09-14"
    );
    expect((screen.getByLabelText("Inicio") as HTMLInputElement).value).toBe(
      "04:00"
    );
  });

  it("switching to 'Fines de semana' renders the weekend grid and requests the month fetch range", () => {
    render(<AgendaPage initialDate="2026-10-15" />);

    fireEvent.click(screen.getByRole("button", { name: "Fines de semana" }));

    expect(screen.getByRole("columnheader", { name: "Viernes" })).toBeTruthy();
    // Weekend grid for October 2026 spans Fri Oct 2 .. Sun Nov 1, plus one
    // fetch day for the timeline.
    expect(agendaRangeSpy).toHaveBeenLastCalledWith("2026-10-02", "2026-11-02");
  });
});
