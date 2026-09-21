// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { pickedDate } = vi.hoisted(() => ({
  pickedDate: { value: "2026-10-02" },
}));

vi.mock("next/router", () => ({
  useRouter: () => ({ query: { brandId: "1" } }),
}));
vi.mock("../components/CalendarView", () => ({
  CalendarView: ({ onPickDate }: { onPickDate?: (date: string) => void }) => (
    <button type="button" onClick={() => onPickDate?.(pickedDate.value)}>
      Seleccionar fecha
    </button>
  ),
}));
vi.mock("../components/ContractView", () => ({
  ContractView: ({
    initialFecha,
    initialPeriod,
  }: {
    initialFecha?: string;
    initialPeriod?: string;
  }) => (
    <div
      data-testid="contract-seed"
      data-date={initialFecha ?? ""}
      data-period={initialPeriod ?? ""}
    />
  ),
}));
vi.mock("../components/ServiceDetail", () => ({ ServiceDetail: () => null }));
vi.mock("../components/Tabs", () => ({
  Tabs: ({ onChange }: { onChange: (tab: "cal" | "ctr") => void }) => (
    <button type="button" onClick={() => onChange("cal")}>
      Calendario
    </button>
  ),
}));
vi.mock("../services/carousels", () => ({
  getExpoBebeCarousel: vi.fn().mockResolvedValue([]),
}));
vi.mock("../../../api/services/brandService", () => ({
  getBrandById: vi.fn().mockResolvedValue({ name: "Lusso" }),
}));

import { ExpoBebePage } from "./ExpoBebePage";

describe("ExpoBebePage", () => {
  it("passes a date-only calendar seed to the existing contract flow and replaces it after returning", () => {
    render(<ExpoBebePage />);

    fireEvent.click(screen.getByRole("button", { name: "Seleccionar fecha" }));
    expect(screen.getByTestId("contract-seed").getAttribute("data-date")).toBe(
      "2026-10-02"
    );
    expect(
      screen.getByTestId("contract-seed").getAttribute("data-period")
    ).toBe("");

    fireEvent.click(screen.getByRole("button", { name: "Calendario" }));
    pickedDate.value = "2026-10-09";
    fireEvent.click(screen.getByRole("button", { name: "Seleccionar fecha" }));
    expect(screen.getByTestId("contract-seed").getAttribute("data-date")).toBe(
      "2026-10-09"
    );
    expect(
      screen.getByTestId("contract-seed").getAttribute("data-period")
    ).toBe("");
  });
});
