// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
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
  it("uses the inclusive Monday-through-Sunday API range and follows controlled initial dates", () => {
    const { rerender } = render(<AgendaPage initialDate="2026-09-18" />);
    expect(agendaRangeSpy).toHaveBeenLastCalledWith("2026-09-14", "2026-09-20");
    expect(screen.getByText(/14 sep/i)).toBeTruthy();

    rerender(<AgendaPage initialDate="2026-10-02" />);
    expect(screen.getByText(/28 sep/i)).toBeTruthy();
    expect(agendaRangeSpy).toHaveBeenLastCalledWith("2026-09-28", "2026-10-04");
  });
});
