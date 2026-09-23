// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
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

    fireEvent.change(screen.getByLabelText("Mes"), { target: { value: "1" } });
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
    fireEvent.click(screen.getByRole("button", { name: "Mes siguiente" }));
    expect(onSelectDate).toHaveBeenCalledWith("2026-11-15");
  });

  it("rolls the year over when stepping to the next month in December", () => {
    const onSelectDate = vi.fn();
    render(
      <AgendaNavigation
        selectedDate="2026-12-15"
        view="month-weekends"
        onSelectDate={onSelectDate}
        onViewChange={() => undefined}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Mes siguiente" }));
    expect(onSelectDate).toHaveBeenCalledWith("2027-01-15");
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
});
