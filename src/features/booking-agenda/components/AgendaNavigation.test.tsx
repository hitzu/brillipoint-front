// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AgendaNavigation } from "./AgendaNavigation";

describe("AgendaNavigation", () => {
  it("keeps navigation on a valid civil date when a 31-day month changes to February", () => {
    const onSelectDate = vi.fn();
    render(
      <AgendaNavigation
        selectedDate="2026-01-31"
        view="summary"
        onSelectDate={onSelectDate}
        onViewChange={() => undefined}
        showViewPicker={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Febrero" }));
    expect(onSelectDate).toHaveBeenCalledWith("2026-02-28");
  });

  it("steps by month and shows the Spanish month title in a month view", () => {
    const onSelectDate = vi.fn();
    render(
      <AgendaNavigation
        selectedDate="2026-10-15"
        view="month"
        onSelectDate={onSelectDate}
        onViewChange={() => undefined}
      />
    );

    expect(screen.getByText("Octubre 2026")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Noviembre" }));
    expect(onSelectDate).toHaveBeenCalledWith("2026-11-15");
  });

  it("keeps the current year when clicking an earlier month chip (year buttons control the year)", () => {
    const onSelectDate = vi.fn();
    render(
      <AgendaNavigation
        selectedDate="2026-12-15"
        view="month-weekends"
        onSelectDate={onSelectDate}
        onViewChange={() => undefined}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Enero" }));
    expect(onSelectDate).toHaveBeenCalledWith("2026-01-15");
  });

  it("restricts the view picker to the given views prop", () => {
    render(
      <AgendaNavigation
        selectedDate="2026-10-15"
        view="month-weekends"
        onSelectDate={() => undefined}
        onViewChange={() => undefined}
        views={["month", "month-weekends"]}
      />
    );

    expect(
      screen.getByRole("button", { name: "Fines de semana" })
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mes" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Resumen" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Horarios" })).toBeNull();
  });

  it("renders 12 month chips with 3-letter labels and marks the selected one", () => {
    render(
      <AgendaNavigation
        selectedDate="2026-10-15"
        view="month"
        onSelectDate={() => undefined}
        onViewChange={() => undefined}
      />
    );

    const group = screen.getByRole("group", { name: "Mes" });
    const chips = within(group).getAllByRole("button");
    expect(chips.map((chip) => chip.textContent)).toEqual([
      "ene",
      "feb",
      "mar",
      "abr",
      "may",
      "jun",
      "jul",
      "ago",
      "sep",
      "oct",
      "nov",
      "dic",
    ]);
    expect(
      within(group).getByRole("button", { name: "Octubre" }).getAttribute("aria-pressed")
    ).toBe("true");
    expect(
      within(group).getByRole("button", { name: "Enero" }).getAttribute("aria-pressed")
    ).toBe("false");
  });

  it("hides the week arrows in month views and keeps them in detail views", () => {
    const { rerender } = render(
      <AgendaNavigation
        selectedDate="2026-10-15"
        view="month"
        onSelectDate={() => undefined}
        onViewChange={() => undefined}
      />
    );
    expect(screen.queryByRole("button", { name: /Mes anterior|Mes siguiente/ })).toBeNull();

    rerender(
      <AgendaNavigation
        selectedDate="2026-10-15"
        view="summary"
        onSelectDate={() => undefined}
        onViewChange={() => undefined}
      />
    );
    expect(screen.getByRole("button", { name: "Semana anterior" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Semana siguiente" })).toBeTruthy();
  });

  it("renders a back button only when onBack is provided", () => {
    const onBack = vi.fn();
    render(
      <AgendaNavigation
        selectedDate="2026-10-15"
        view="summary"
        onSelectDate={() => undefined}
        onViewChange={() => undefined}
        onBack={onBack}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Volver/ }));
    expect(onBack).toHaveBeenCalled();
  });

  it("stays out of the dark-theme selector when tone is public", () => {
    render(
      <AgendaNavigation
        selectedDate="2026-10-15"
        view="month"
        onSelectDate={() => undefined}
        onViewChange={() => undefined}
        tone="public"
      />
    );
    expect(
      screen.getByLabelText("Navegación de agenda").getAttribute("data-tone")
    ).toBe("public");
  });
});
