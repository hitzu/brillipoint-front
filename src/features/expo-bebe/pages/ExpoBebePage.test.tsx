// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { pickedDate, routerQuery } = vi.hoisted(() => ({
  pickedDate: { value: "2026-10-02" },
  routerQuery: {} as Record<string, string | string[]>,
}));

vi.mock("next/router", () => ({
  useRouter: () => ({ query: routerQuery }),
}));
vi.mock("../components/CalendarView", () => ({
  CalendarView: ({
    onPickDate,
    onReserve,
  }: {
    onPickDate?: (date: string) => void;
    onReserve?: (selection: { date: string; blockId: string }) => void;
  }) => (
    <>
      <button type="button" onClick={() => onPickDate?.(pickedDate.value)}>
        Seleccionar fecha
      </button>
      <button
        type="button"
        onClick={() =>
          onReserve?.({ date: pickedDate.value, blockId: "night_block" })
        }
      >
        Reservar bloque
      </button>
    </>
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
vi.mock("../components/ServiceDetail", () => ({
  ServiceDetail: ({
    isOpen,
    modeLabel,
  }: {
    isOpen: boolean;
    modeLabel: string;
  }) => <div role="dialog" aria-label={modeLabel} hidden={!isOpen} />,
}));
vi.mock("../services/carousels", () => ({
  getExpoBebeCarousel: vi.fn().mockResolvedValue([]),
}));
vi.mock("../../../api/services/brandService", () => ({
  getBrandById: vi.fn().mockResolvedValue({ name: "Lusso" }),
}));

import { ExpoBebePage } from "./ExpoBebePage";

describe("ExpoBebePage", () => {
  beforeEach(() => {
    Object.keys(routerQuery).forEach((key) => delete routerQuery[key]);
    routerQuery.brandId = "1";
    pickedDate.value = "2026-10-02";
  });

  it("retains decorations and photo catalog actions without display parameters", () => {
    const { container } = render(<ExpoBebePage />);
    expect(container.querySelectorAll('img[src*="sticker-"]')).toHaveLength(4);
    expect(screen.getByRole("tab", { name: "Servicios" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Extras" })).toBeTruthy();
    expect(screen.getByRole("tablist", { name: "Expo" })).toBeTruthy();
  });

  it.each(["Servicios", "Extras"])(
    "keeps the %s photo action working and closes it when hidden by query",
    (label) => {
      const { rerender } = render(<ExpoBebePage />);
      fireEvent.click(screen.getByRole("tab", { name: label }));
      expect(screen.getByRole("dialog", { name: label })).toBeTruthy();
      routerQuery.hidePhotos = "1";
      rerender(<ExpoBebePage />);
      expect(screen.queryByRole("dialog", { name: label })).toBeNull();
      expect(
        screen
          .getByRole("tab", { name: "Disponibilidad" })
          .getAttribute("aria-selected")
      ).toBe("true");
    }
  );

  it("hides only decorative animals with hideIcons=1", () => {
    routerQuery.hideIcons = "1";
    const { container } = render(<ExpoBebePage />);
    expect(container.querySelectorAll('img[src*="sticker-"]')).toHaveLength(0);
    expect(screen.getByRole("tab", { name: "Servicios" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Extras" })).toBeTruthy();
    expect(
      screen.getByRole("tab", { name: "Disponibilidad" }).querySelector("svg")
    ).toBeTruthy();
  });

  it("hides only photo catalog actions with hidePhotos=1", () => {
    routerQuery.hidePhotos = "1";
    const { container } = render(<ExpoBebePage />);
    expect(screen.queryByRole("tab", { name: "Servicios" })).toBeNull();
    expect(screen.queryByRole("tab", { name: "Extras" })).toBeNull();
    expect(container.querySelectorAll('img[src*="sticker-"]')).toHaveLength(4);
    fireEvent.click(screen.getByRole("tab", { name: "Contrato" }));
    expect(screen.getByTestId("contract-seed")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Disponibilidad" }));
    expect(
      screen.getByRole("button", { name: "Reservar bloque" })
    ).toBeTruthy();
  });

  it("applies both menu parameters and restores visibility on query changes", () => {
    routerQuery.hideIcons = "1";
    routerQuery.hidePhotos = "1";
    const { container, rerender } = render(<ExpoBebePage />);
    expect(container.querySelectorAll('img[src*="sticker-"]')).toHaveLength(0);
    expect(screen.queryByRole("tab", { name: "Servicios" })).toBeNull();
    expect(screen.queryByRole("tab", { name: "Extras" })).toBeNull();
    routerQuery.hideIcons = "0";
    routerQuery.hidePhotos = "0";
    rerender(<ExpoBebePage />);
    expect(container.querySelectorAll('img[src*="sticker-"]')).toHaveLength(4);
    expect(screen.getByRole("tab", { name: "Servicios" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Extras" })).toBeTruthy();
  });

  it("uses the first value for repeated display parameters", () => {
    routerQuery.hideIcons = ["1", "0"];
    routerQuery.hidePhotos = ["0", "1"];
    const { container } = render(<ExpoBebePage />);
    expect(container.querySelectorAll('img[src*="sticker-"]')).toHaveLength(0);
    expect(screen.getByRole("tab", { name: "Servicios" })).toBeTruthy();
  });

  it("passes a date-only calendar seed to the existing contract flow and replaces it after returning", () => {
    render(<ExpoBebePage />);

    fireEvent.click(screen.getByRole("button", { name: "Seleccionar fecha" }));
    expect(screen.getByTestId("contract-seed").getAttribute("data-date")).toBe(
      "2026-10-02"
    );
    expect(
      screen.getByTestId("contract-seed").getAttribute("data-period")
    ).toBe("");

    fireEvent.click(screen.getByRole("tab", { name: "Disponibilidad" }));
    pickedDate.value = "2026-10-09";
    fireEvent.click(screen.getByRole("button", { name: "Seleccionar fecha" }));
    expect(screen.getByTestId("contract-seed").getAttribute("data-date")).toBe(
      "2026-10-09"
    );
    expect(
      screen.getByTestId("contract-seed").getAttribute("data-period")
    ).toBe("");
  });

  it("seeds the contract tab with date and block when reserving a free block from the calendar", () => {
    render(<ExpoBebePage />);

    pickedDate.value = "2026-10-11";
    fireEvent.click(screen.getByRole("button", { name: "Reservar bloque" }));

    expect(screen.getByTestId("contract-seed").getAttribute("data-date")).toBe(
      "2026-10-11"
    );
    expect(
      screen.getByTestId("contract-seed").getAttribute("data-period")
    ).toBe("night_block");
  });

  it("clears a previously reserved block once a date-only pick follows it", () => {
    render(<ExpoBebePage />);

    pickedDate.value = "2026-10-11";
    fireEvent.click(screen.getByRole("button", { name: "Reservar bloque" }));
    expect(
      screen.getByTestId("contract-seed").getAttribute("data-period")
    ).toBe("night_block");

    fireEvent.click(screen.getByRole("tab", { name: "Disponibilidad" }));
    pickedDate.value = "2026-10-16";
    fireEvent.click(screen.getByRole("button", { name: "Seleccionar fecha" }));

    expect(screen.getByTestId("contract-seed").getAttribute("data-date")).toBe(
      "2026-10-16"
    );
    expect(
      screen.getByTestId("contract-seed").getAttribute("data-period")
    ).toBe("");
  });
});
