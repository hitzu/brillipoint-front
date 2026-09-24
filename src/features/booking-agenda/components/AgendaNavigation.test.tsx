// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AgendaNavigation } from "./AgendaNavigation";

const pickMonth = (monthName: string, yearSteps = 0) => {
  const trigger = screen
    .getAllByRole("button")
    .find((button) => button.getAttribute("aria-haspopup") === "dialog");
  fireEvent.click(trigger!);
  const dialog = screen.getByRole("dialog");
  const stepLabel = yearSteps > 0 ? "Año siguiente" : "Año anterior";
  for (let i = 0; i < Math.abs(yearSteps); i += 1) {
    fireEvent.click(within(dialog).getByRole("button", { name: stepLabel }));
  }
  fireEvent.click(within(dialog).getByRole("button", { name: monthName }));
};

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

    pickMonth("Febrero");
    expect(onSelectDate).toHaveBeenCalledWith("2026-02-28");
  });

  it("shows the Spanish month title in a month view and jumps through the picker", () => {
    const onSelectDate = vi.fn();
    render(
      <AgendaNavigation
        selectedDate="2026-10-15"
        view="month"
        onSelectDate={onSelectDate}
        onViewChange={() => undefined}
      />
    );

    expect(screen.getByRole("button", { name: /Octubre 2026/ })).toBeTruthy();
    pickMonth("Noviembre");
    expect(onSelectDate).toHaveBeenCalledWith("2026-11-15");
  });

  it("changes the year through the picker's year arrows", () => {
    const onSelectDate = vi.fn();
    render(
      <AgendaNavigation
        selectedDate="2026-12-15"
        view="month-weekends"
        onSelectDate={onSelectDate}
        onViewChange={() => undefined}
      />
    );

    pickMonth("Enero", 1);
    expect(onSelectDate).toHaveBeenCalledWith("2027-01-15");
  });

  it("steps by month in month views, clamping the day and crossing years", () => {
    const onSelectDate = vi.fn();
    const { rerender } = render(
      <AgendaNavigation
        selectedDate="2026-01-31"
        view="month"
        onSelectDate={onSelectDate}
        onViewChange={() => undefined}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Mes siguiente" }));
    expect(onSelectDate).toHaveBeenLastCalledWith("2026-02-28");

    rerender(
      <AgendaNavigation
        selectedDate="2026-01-15"
        view="month"
        onSelectDate={onSelectDate}
        onViewChange={() => undefined}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Mes anterior" }));
    expect(onSelectDate).toHaveBeenLastCalledWith("2025-12-15");
  });

  it("steps by week in detail views", () => {
    const onSelectDate = vi.fn();
    render(
      <AgendaNavigation
        selectedDate="2026-10-15"
        view="summary"
        onSelectDate={onSelectDate}
        onViewChange={() => undefined}
      />
    );
    expect(screen.queryByRole("button", { name: /Mes anterior|Mes siguiente/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Semana siguiente" }));
    expect(onSelectDate).toHaveBeenLastCalledWith("2026-10-22");
    fireEvent.click(screen.getByRole("button", { name: "Semana anterior" }));
    expect(onSelectDate).toHaveBeenLastCalledWith("2026-10-08");
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

  it("orders the toolbar as arrows, title, Hoy, then toggle and Volver last", () => {
    const { container } = render(
      <AgendaNavigation
        selectedDate="2026-09-10"
        view="summary"
        onSelectDate={() => undefined}
        onViewChange={() => undefined}
        onBack={() => undefined}
      />
    );

    const period = container.querySelector(".agenda-period");
    expect(period).toBeTruthy();
    const periodLabels = Array.from(period!.children).map((el) => el.textContent);
    expect(periodLabels[0]).toContain("‹");
    expect(periodLabels[0]).toContain("›");
    expect(periodLabels[1]).toMatch(/–/);
    expect(periodLabels[2]).toBe("Hoy");

    const actions = container.querySelector(".agenda-week-actions");
    const actionLabels = Array.from(actions!.children).map((el) => el.textContent);
    expect(actionLabels[0]).toContain("Resumen");
    expect(actionLabels[0]).toContain("Horarios");
    expect(actionLabels[actionLabels.length - 1]).toContain("Volver");
  });

  it("'Hoy' moves the selected date to today's civil Mexico City date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-15T12:00:00Z"));
    const onSelectDate = vi.fn();
    render(
      <AgendaNavigation
        selectedDate="2026-01-05"
        view="summary"
        onSelectDate={onSelectDate}
        onViewChange={() => undefined}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Hoy" }));
    expect(onSelectDate).toHaveBeenCalledWith("2026-09-15");
    vi.useRealTimers();
  });

  it("renders Hoy in month views too", () => {
    render(
      <AgendaNavigation
        selectedDate="2026-10-15"
        view="month"
        onSelectDate={() => undefined}
        onViewChange={() => undefined}
      />
    );
    expect(screen.getByRole("button", { name: "Hoy" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Semana/ })).toBeNull();
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
