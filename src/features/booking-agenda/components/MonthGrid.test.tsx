// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { YMD } from "../types";
import { blockCreateOptions } from "../utils/createOptions";
import { MonthGrid } from "./MonthGrid";

const ANCHOR: YMD = "2026-10-15";

describe("MonthGrid", () => {
  it("renders 7 weekday columns and every padding day of the month grid", () => {
    render(
      <MonthGrid entries={{}} anchor={ANCHOR} onDateSelect={vi.fn()} today="2026-09-20" />
    );

    ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].forEach((label) =>
      expect(screen.getByRole("columnheader", { name: label })).toBeTruthy()
    );
    // 5 weeks x 7 days for October 2026 (Sep 28 - Nov 1).
    expect(screen.getAllByRole("gridcell")).toHaveLength(35);
    expect(
      screen.getByRole("gridcell", { name: /28 de septiembre de 2026/ })
    ).toBeTruthy();
  });

  it("calls onDateSelect when a day cell is clicked", () => {
    const onDateSelect = vi.fn();
    render(
      <MonthGrid entries={{}} anchor={ANCHOR} onDateSelect={onDateSelect} today="2026-09-20" />
    );

    fireEvent.click(
      screen.getByRole("gridcell", { name: /10 de octubre de 2026/ })
    );
    expect(onDateSelect).toHaveBeenCalledWith("2026-10-10");
  });

  it("never renders inline create buttons inside day cells", () => {
    render(
      <MonthGrid
        entries={{}}
        anchor={ANCHOR}
        onDateSelect={vi.fn()}
        getCreateOptions={blockCreateOptions}
        onCreateRequest={vi.fn()}
        today="2026-09-20"
      />
    );

    expect(screen.queryAllByRole("button", { name: /Apartar/ })).toHaveLength(
      0
    );
  });

  it("shows a selected-day detail panel with create buttons when a policy is provided", () => {
    const onCreateRequest = vi.fn();
    render(
      <MonthGrid
        entries={{}}
        anchor={ANCHOR}
        selectedDate="2026-10-10"
        onDateSelect={vi.fn()}
        getCreateOptions={blockCreateOptions}
        onCreateRequest={onCreateRequest}
        today="2026-09-20"
      />
    );

    const panel = within(screen.getByLabelText("Detalle 2026-10-10"));
    const buttons = panel.getAllByRole("button", { name: /Apartar/ });
    expect(buttons.length).toBeGreaterThan(0);
    fireEvent.click(buttons[0]);
    expect(onCreateRequest).toHaveBeenCalled();
  });
});
