// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ContractFormVM } from "../../hooks/useContractForm";
import { ExtrasSection } from "../ExtrasSection";

const llaveros = { id: 7, name: "Upgrade llaveros", price: 700 };

const vmWith = (overrides: Partial<ContractFormVM> = {}) =>
  ({
    items: [],
    extrasCatalog: [llaveros],
    selectedExtraId: "",
    setSelectedExtraId: vi.fn(),
    selectedExtraPackageClientRef: "",
    setSelectedExtraPackageClientRef: vi.fn(),
    extraItems: [
      { extra: llaveros, quantity: 1, packageClientRef: null, isGift: false },
    ],
    getTierDiscount: () => 0,
    isLocked: false,
    handleAgregarExtra: vi.fn(),
    setExtraItemQuantity: vi.fn(),
    removeExtraItem: vi.fn(),
    setExtraItemGift: vi.fn(),
    ...overrides,
  }) as unknown as ContractFormVM;

describe("ExtrasSection", () => {
  it("marks an extra line as a gift", () => {
    const setExtraItemGift = vi.fn();
    render(<ExtrasSection vm={vmWith({ setExtraItemGift })} />);

    fireEvent.click(
      screen.getByRole("checkbox", { name: "Regalo: Upgrade llaveros" }),
    );

    expect(setExtraItemGift).toHaveBeenCalledWith(7, true);
  });

  it("shows a gifted extra line at no cost", () => {
    render(
      <ExtrasSection
        vm={vmWith({
          extraItems: [
            { extra: llaveros, quantity: 1, packageClientRef: null, isGift: true },
          ] as ContractFormVM["extraItems"],
        })}
      />,
    );

    expect(
      screen.getByRole("checkbox", { name: "Regalo: Upgrade llaveros" }),
    ).toHaveProperty("checked", true);
    expect(screen.getByText(/Regalo/, { selector: "span" })).toBeTruthy();
    expect(screen.queryByText("$700")).toBeNull();
  });

  it("locks the gift toggle once the contract is locked", () => {
    render(<ExtrasSection vm={vmWith({ isLocked: true })} />);

    expect(
      screen.getByRole("checkbox", { name: "Regalo: Upgrade llaveros" }),
    ).toHaveProperty("disabled", true);
  });
});
