// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MonthYearPicker } from "./MonthYearPicker";

const openPicker = () =>
  fireEvent.click(screen.getByRole("button", { name: /Octubre 2026/ }));

describe("MonthYearPicker", () => {
  it("shows the Spanish month and year as the trigger label, closed by default", () => {
    render(<MonthYearPicker year={2026} month={9} onChange={() => undefined} />);

    const trigger = screen.getByRole("button", { name: /Octubre 2026/ });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("uses a custom trigger label when given", () => {
    render(
      <MonthYearPicker
        year={2026}
        month={9}
        label="12 – 18 oct 2026"
        onChange={() => undefined}
      />
    );
    expect(screen.getByRole("button", { name: /12 – 18 oct 2026/ })).toBeTruthy();
  });

  it("opens a 12-month grid for the selected year with the selected month pressed", () => {
    render(<MonthYearPicker year={2026} month={9} onChange={() => undefined} />);
    openPicker();

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("2026")).toBeTruthy();
    const months = within(dialog).getByRole("group", { name: "Mes" });
    const buttons = within(months).getAllByRole("button");
    expect(buttons.map((button) => button.textContent)).toEqual([
      "ene", "feb", "mar", "abr", "may", "jun",
      "jul", "ago", "sep", "oct", "nov", "dic",
    ]);
    expect(
      within(months).getByRole("button", { name: "Octubre" }).getAttribute("aria-pressed")
    ).toBe("true");
    expect(
      within(months).getByRole("button", { name: "Enero" }).getAttribute("aria-pressed")
    ).toBe("false");
  });

  it("browses years without changing the selection until a month is chosen", () => {
    const onChange = vi.fn();
    render(<MonthYearPicker year={2026} month={9} onChange={onChange} />);
    openPicker();

    fireEvent.click(screen.getByRole("button", { name: "Año siguiente" }));
    expect(onChange).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("2027")).toBeTruthy();
    expect(
      within(dialog).getByRole("button", { name: "Octubre" }).getAttribute("aria-pressed")
    ).toBe("false");

    fireEvent.click(within(dialog).getByRole("button", { name: "Marzo" }));
    expect(onChange).toHaveBeenCalledWith(2027, 2);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("steps back a year", () => {
    const onChange = vi.fn();
    render(<MonthYearPicker year={2026} month={9} onChange={onChange} />);
    openPicker();

    fireEvent.click(screen.getByRole("button", { name: "Año anterior" }));
    fireEvent.click(screen.getByRole("button", { name: "Diciembre" }));
    expect(onChange).toHaveBeenCalledWith(2025, 11);
  });

  it("reopens on the selected year after browsing away", () => {
    render(<MonthYearPicker year={2026} month={9} onChange={() => undefined} />);
    openPicker();
    fireEvent.click(screen.getByRole("button", { name: "Año siguiente" }));
    fireEvent.keyDown(document, { key: "Escape" });
    openPicker();

    expect(within(screen.getByRole("dialog")).getByText("2026")).toBeTruthy();
  });

  it("closes on Escape and on an outside click", () => {
    render(
      <div>
        <span>fuera</span>
        <MonthYearPicker year={2026} month={9} onChange={() => undefined} />
      </div>
    );
    openPicker();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();

    openPicker();
    fireEvent.mouseDown(screen.getByText("fuera"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
