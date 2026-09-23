// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { push, hookState } = vi.hoisted(() => ({
  push: vi.fn(),
  hookState: {
    users: [],
    brands: [],
    packages: [],
    extrasCatalog: [] as any[],
    selectedUserId: "" as number | "",
    setSelectedUserId: vi.fn(),
    selectedBrandId: "" as number | "",
    setSelectedBrandId: vi.fn(),
    clientName: "",
    setClientName: vi.fn(),
    clientPhone: "",
    setClientPhone: vi.fn(),
    clientEmail: "",
    setClientEmail: vi.fn(),
    cart: [] as any[],
    addPackageToCart: vi.fn(),
    removePackageFromCart: vi.fn(),
    setCartItemQuantity: vi.fn(),
    extraCart: [] as any[],
    addExtraToCart: vi.fn(),
    removeExtraFromCart: vi.fn(),
    setExtraCartItemQuantity: vi.fn(),
    eventDate: "",
    setEventDate: vi.fn(),
    startTime: "",
    setStartTime: vi.fn(),
    endDate: "",
    setEndDate: vi.fn(),
    endTime: "",
    setEndTime: vi.fn(),
    applyAllDay: vi.fn(),
    depositAmount: "0",
    setDepositAmount: vi.fn(),
    paymentMethod: "cash" as const,
    setPaymentMethod: vi.fn(),
    publicNote: "",
    setPublicNote: vi.fn(),
    venueName: "",
    setVenueName: vi.fn(),
    mapsUrl: "",
    setMapsUrl: vi.fn(),
    subtotal: 0,
    balance: 0,
    contractLink: "",
    contract: null as { id: number; sku: string } | null,
    isSubmitting: false,
    errorMsg: null as string | null,
    bookingWarning: null as string | null,
    handleSubmit: vi.fn(),
    resetForm: vi.fn(),
  },
}));

vi.mock("next/router", () => ({
  useRouter: () => ({ push }),
}));
vi.mock("../../hooks/useCreateContractForm", () => ({
  useCreateContractForm: () => hookState,
}));

import { CreateContractPage } from "../CreateContractPage";

describe("CreateContractPage", () => {
  beforeEach(() => {
    push.mockReset();
    hookState.handleSubmit.mockReset();
    hookState.resetForm.mockReset();
    hookState.contract = null;
    hookState.contractLink = "";
    hookState.clientName = "";
    hookState.errorMsg = null;
    hookState.bookingWarning = null;
    hookState.isSubmitting = false;
  });

  it("renders every section", () => {
    render(<CreateContractPage />);
    expect(screen.getByText("Cliente")).toBeTruthy();
    expect(screen.getByText("Fecha y horario")).toBeTruthy();
    expect(screen.getByText("Paquetes")).toBeTruthy();
    expect(screen.getByText("Extras")).toBeTruthy();
    expect(screen.getByText("Pago")).toBeTruthy();
    expect(screen.getByText("Notas")).toBeTruthy();
  });

  it("submits the form through the hook", async () => {
    render(<CreateContractPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Crear contrato" }));
    });
    expect(hookState.handleSubmit).toHaveBeenCalledTimes(1);
  });

  it("shows the error message from the hook", () => {
    hookState.errorMsg = "Agrega al menos un paquete.";
    render(<CreateContractPage />);
    expect(screen.getByRole("alert").textContent).toContain(
      "Agrega al menos un paquete.",
    );
  });

  it("shows the success view instead of auto-navigating once the contract is created", () => {
    hookState.contract = { id: 88, sku: "sku-1" };
    hookState.contractLink = "https://app.test/reserva/tok-1?brandId=1";
    hookState.clientName = "Ana Ruiz";
    hookState.bookingWarning = null;
    render(<CreateContractPage />);

    expect(push).not.toHaveBeenCalled();
    expect(screen.getByText(/contrato generado/i)).toBeTruthy();
    expect(
      screen.getByText("https://app.test/reserva/tok-1?brandId=1"),
    ).toBeTruthy();
    expect(document.querySelector("svg")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /nuevo contrato/i }));
    expect(hookState.resetForm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /ir a contratos/i }));
    expect(push).toHaveBeenCalledWith("/contracts");
  });

  it("shows the booking warning inside the success view", () => {
    hookState.contract = { id: 88, sku: "sku-1" };
    hookState.contractLink = "https://app.test/reserva/tok-1?brandId=1";
    hookState.bookingWarning =
      "El contrato se generó, pero no se pudo apartar la fecha en la agenda.";
    render(<CreateContractPage />);

    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain(
      "no se pudo apartar la fecha",
    );
  });

  it("navigates to the contracts list when Cancelar is clicked", () => {
    render(<CreateContractPage />);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(push).toHaveBeenCalledWith("/contracts");
  });
});
