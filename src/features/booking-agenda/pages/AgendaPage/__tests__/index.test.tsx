// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
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
    // Default browse level is "Fines de semana": a month-fetch range.
    expect(agendaRangeSpy).toHaveBeenLastCalledWith("2026-09-04", "2026-09-28");

    rerender(<AgendaPage initialDate="2026-10-02" />);
    expect(agendaRangeSpy).toHaveBeenLastCalledWith("2026-10-02", "2026-11-02");
  });

  it("no longer offers the removed 'Apartar Libre' quick-create action (T4)", () => {
    render(<AgendaPage initialDate="2026-09-18" />);
    expect(
      screen.queryAllByRole("button", { name: /Apartar Libre/ })
    ).toHaveLength(0);
    expect(screen.queryByText(/Mayor hueco|Libre todo el día/)).toBeNull();
  });

  it("still opens a blank booking form for today via the 'Nuevo evento' button", () => {
    render(<AgendaPage initialDate="2026-09-18" />);

    fireEvent.click(screen.getByRole("button", { name: "Nuevo evento" }));

    expect(screen.getByRole("dialog", { name: "Nuevo evento" })).toBeTruthy();
    expect((screen.getByLabelText("Fecha") as HTMLInputElement).value).toBe(
      "2026-09-18"
    );
  });

  it("offers only Mes and Fines de semana at the top level (T5)", () => {
    render(<AgendaPage initialDate="2026-10-15" />);

    expect(screen.getByRole("button", { name: "Mes" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Fines de semana" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Resumen" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Horarios" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Volver/ })).toBeNull();
  });

  it("clicking a weekend date drills into its week detail with Resumen active and a Volver button", () => {
    render(<AgendaPage initialDate="2026-10-15" />);

    fireEvent.click(
      screen.getByRole("button", { name: "Sábado, 3 de octubre de 2026" })
    );

    expect(screen.getByRole("button", { name: /Volver/ })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Resumen" }).getAttribute("aria-pressed")
    ).toBe("true");
    expect(screen.getByRole("button", { name: "Horarios" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Mes" })).toBeNull();
    expect(screen.getByText(/28 sep.*4 oct 2026/)).toBeTruthy();
  });

  it("returns to the same month view when Volver is clicked", () => {
    render(<AgendaPage initialDate="2026-10-15" />);

    fireEvent.click(
      screen.getByRole("button", { name: "Sábado, 3 de octubre de 2026" })
    );
    fireEvent.click(screen.getByRole("button", { name: /Volver/ }));

    expect(screen.queryByRole("button", { name: /Volver/ })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Fines de semana" }).getAttribute("aria-pressed")
    ).toBe("true");
    expect(screen.getAllByText("Octubre 2026").length).toBeGreaterThan(0);
  });

  it("opens the create modal for the clicked date's day number inside the detail view", () => {
    render(<AgendaPage initialDate="2026-10-15" />);

    fireEvent.click(
      screen.getByRole("button", { name: "Sábado, 3 de octubre de 2026" })
    );
    const headings = document.querySelector(".agenda-summary-headings");
    if (!headings) throw new Error("Missing week strip");
    fireEvent.click(within(headings as HTMLElement).getAllByRole("button")[0]);

    expect(screen.getByRole("dialog", { name: "Nuevo evento" })).toBeTruthy();
    expect((screen.getByLabelText("Fecha") as HTMLInputElement).value).toBe(
      "2026-09-28"
    );
  });

  it("switching to Mes and clicking a day also drills into its week detail", () => {
    render(<AgendaPage initialDate="2026-10-15" />);

    fireEvent.click(screen.getByRole("button", { name: "Mes" }));
    fireEvent.click(
      screen.getByRole("gridcell", { name: /10 de octubre de 2026/ })
    );

    expect(screen.getByRole("button", { name: /Volver/ })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Resumen" }).getAttribute("aria-pressed")
    ).toBe("true");
  });
});
