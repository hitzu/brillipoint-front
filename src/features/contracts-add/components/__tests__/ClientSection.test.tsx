// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ClientSection } from "../ClientSection";

const users = [{ id: 11, email: "a@a.com", role: "seller", firstName: "Ana", lastName: "Vendedora", phone: "" }];
const brands = [{ id: 1, key: "brand", name: "Marca Uno", logoUrl: null, phoneNumber: null, email: null, theme: null, minAmountHoldSlot: null }];

describe("ClientSection", () => {
  it("renders vendor and brand options and client fields", () => {
    render(
      <ClientSection
        users={users as any}
        brands={brands as any}
        selectedUserId=""
        onUserChange={vi.fn()}
        selectedBrandId=""
        onBrandChange={vi.fn()}
        clientName=""
        onClientNameChange={vi.fn()}
        clientPhone=""
        onClientPhoneChange={vi.fn()}
        clientEmail=""
        onClientEmailChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Vendedor")).toBeTruthy();
    expect(screen.getByLabelText("Marca")).toBeTruthy();
    expect(screen.getByText("Ana Vendedora")).toBeTruthy();
    expect(screen.getByText("Marca Uno")).toBeTruthy();
  });

  it("calls the client name handler on change", () => {
    const onClientNameChange = vi.fn();
    render(
      <ClientSection
        users={users as any}
        brands={brands as any}
        selectedUserId=""
        onUserChange={vi.fn()}
        selectedBrandId=""
        onBrandChange={vi.fn()}
        clientName=""
        onClientNameChange={onClientNameChange}
        clientPhone=""
        onClientPhoneChange={vi.fn()}
        clientEmail=""
        onClientEmailChange={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Nombre del cliente"), {
      target: { value: "Ana Ruiz" },
    });
    expect(onClientNameChange).toHaveBeenCalledWith("Ana Ruiz");
  });
});
