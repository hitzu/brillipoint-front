// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { searchContracts } = vi.hoisted(() => ({ searchContracts: vi.fn() }));
vi.mock("../services/contractPickerService", () => ({ searchContracts }));

import { ContractPicker } from "./ContractPicker";

const options = [
  { id: 7, sku: "SKU-0007", clientName: "Ana Ruiz" },
  { id: 8, sku: "SKU-0008", clientName: "Bruno Díaz" },
];

describe("ContractPicker", () => {
  beforeEach(() => {
    searchContracts.mockReset();
    searchContracts.mockResolvedValue(options);
  });

  it("filters by sku or client name and reports the chosen contract id", async () => {
    const onChange = vi.fn();
    render(<ContractPicker value={null} onChange={onChange} />);

    const input = screen.getByLabelText("Contrato");
    fireEvent.focus(input);
    await waitFor(() => expect(searchContracts).toHaveBeenCalled());

    fireEvent.change(input, { target: { value: "bruno" } });
    const match = await screen.findByRole("option", {
      name: /SKU-0008 — Bruno Díaz/,
    });
    expect(screen.queryByRole("option", { name: /Ana Ruiz/ })).toBeNull();

    fireEvent.click(match);
    expect(onChange).toHaveBeenCalledWith(8);
  });

  it("matches on sku too, case-insensitively", async () => {
    render(<ContractPicker value={null} onChange={vi.fn()} />);
    const input = screen.getByLabelText("Contrato");
    fireEvent.focus(input);
    await waitFor(() => expect(searchContracts).toHaveBeenCalled());

    fireEvent.change(input, { target: { value: "sku-0007" } });
    expect(
      await screen.findByRole("option", { name: /SKU-0007 — Ana Ruiz/ })
    ).toBeTruthy();
    expect(screen.queryByRole("option", { name: /Bruno Díaz/ })).toBeNull();
  });

  it("clears the selection so a booking can go back to being internal", async () => {
    const onChange = vi.fn();
    render(<ContractPicker value={7} onChange={onChange} />);
    await waitFor(() => expect(searchContracts).toHaveBeenCalled());
    await screen.findByDisplayValue("SKU-0007 — Ana Ruiz");

    fireEvent.click(screen.getByRole("button", { name: "Quitar contrato" }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("locks the field and never queries when the contract is fixed by the caller", async () => {
    render(
      <ContractPicker
        value={7}
        onChange={vi.fn()}
        lockedLabel="SKU-0007 — Ana Ruiz"
      />
    );
    const input = screen.getByLabelText("Contrato") as HTMLInputElement;
    expect(input.disabled).toBe(true);
    expect(input.value).toBe("SKU-0007 — Ana Ruiz");
    expect(
      screen.queryByRole("button", { name: "Quitar contrato" })
    ).toBeNull();
    expect(searchContracts).not.toHaveBeenCalled();
  });

  it("stays usable when the contract list cannot be loaded", async () => {
    searchContracts.mockRejectedValue(new Error("network"));
    render(<ContractPicker value={null} onChange={vi.fn()} />);
    fireEvent.focus(screen.getByLabelText("Contrato"));
    expect(await screen.findByRole("status")).toBeTruthy();
    expect(
      (screen.getByLabelText("Contrato") as HTMLInputElement).disabled
    ).toBe(false);
  });
});
