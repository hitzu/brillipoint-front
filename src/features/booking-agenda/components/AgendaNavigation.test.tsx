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
});
