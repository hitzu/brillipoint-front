// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ContractFormVM } from "../../hooks/useContractForm";
import { DateSlotSection } from "../DateSlotSection";

const vmWith = (overrides: Partial<ContractFormVM> = {}) =>
  ({
    fecha: "2026-09-12",
    setFecha: vi.fn(),
    isLocked: false,
    period: null,
    setPeriod: vi.fn(),
    blockAvailability: {
      am_block: true,
      pm_block: true,
      night_block: true,
    },
    selectedUserId: "",
    setSelectedUserId: vi.fn(),
    users: [],
    selectedBrandName: "Expo Bebé",
    ...overrides,
  }) as unknown as ContractFormVM;

const slot = (name: RegExp) => screen.getByRole("button", { name });

describe("DateSlotSection", () => {
  it("shows each block's real range, the one it is sold and booked with", () => {
    render(<DateSlotSection vm={vmWith()} />);
    expect(slot(/Mañana/)).toHaveProperty("disabled", false);
    expect(screen.getByText("04:00 – 12:00")).toBeTruthy();
    expect(screen.getByText("12:00 – 20:00")).toBeTruthy();
  });

  it("disables a block that is already taken and refuses to select it", () => {
    const setPeriod = vi.fn();
    render(
      <DateSlotSection
        vm={vmWith({
          setPeriod,
          blockAvailability: {
            am_block: true,
            pm_block: false,
            night_block: true,
          },
        })}
      />
    );

    const tarde = slot(/Tarde/) as HTMLButtonElement;
    expect(tarde.disabled).toBe(true);
    expect(screen.getByText("No disponible")).toBeTruthy();

    // Expo sells the whole block, so a taken block cannot be sold again.
    // The API guard is what actually closes the race; this only keeps the
    // seller from walking into it.
    fireEvent.click(tarde);
    expect(setPeriod).not.toHaveBeenCalled();

    expect((slot(/Mañana/) as HTMLButtonElement).disabled).toBe(false);
  });

  it("selects an available block", () => {
    const setPeriod = vi.fn();
    render(<DateSlotSection vm={vmWith({ setPeriod })} />);
    fireEvent.click(slot(/Tarde/));
    expect(setPeriod).toHaveBeenCalledWith("pm_block");
  });

  it("locks every block while the form is locked", () => {
    render(<DateSlotSection vm={vmWith({ isLocked: true })} />);
    expect((slot(/Mañana/) as HTMLButtonElement).disabled).toBe(true);
    expect((slot(/Tarde/) as HTMLButtonElement).disabled).toBe(true);
  });

  it("offers all three blocks, including Noche with its overnight range", () => {
    render(<DateSlotSection vm={vmWith()} />);
    expect(slot(/Noche/)).toHaveProperty("disabled", false);
    expect(screen.getByText("20:00 – 04:00")).toBeTruthy();
  });

  it("disables Noche when the night block is not available", () => {
    render(
      <DateSlotSection
        vm={vmWith({
          blockAvailability: {
            am_block: true,
            pm_block: true,
            night_block: false,
          },
        })}
      />
    );
    expect((slot(/Noche/) as HTMLButtonElement).disabled).toBe(true);
  });
});
