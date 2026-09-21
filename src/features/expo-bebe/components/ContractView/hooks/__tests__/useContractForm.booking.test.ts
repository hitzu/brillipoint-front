// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  getBrands: vi.fn(),
  getPackages: vi.fn(),
  getExtras: vi.fn(),
  getUsers: vi.fn(),
  getPromotionsByBrandId: vi.fn(),
  getSlots: vi.fn(),
  getSlotsByMonthAndYear: vi.fn(),
  holdSlot: vi.fn(),
  generateContract: vi.fn(),
  createPayment: vi.fn(),
  createNote: vi.fn(),
  createBooking: vi.fn(),
}));

vi.mock("../../../../../../api/services/brandService", () => ({
  getBrands: api.getBrands,
}));
vi.mock("../../../../../../api/services/packageService", () => ({
  getPackages: api.getPackages,
}));
vi.mock("../../../../../../api/services/extrasService", () => ({
  getExtras: api.getExtras,
}));
vi.mock("../../../../../../api/services/usersService", () => ({
  getUsers: api.getUsers,
}));
vi.mock("../../../../../../api/services/promotionsService", () => ({
  getPromotionsByBrandId: api.getPromotionsByBrandId,
}));
vi.mock("../../../../../../api/services/slotsService", () => ({
  getSlots: api.getSlots,
  getSlotsByMonthAndYear: api.getSlotsByMonthAndYear,
  holdSlot: api.holdSlot,
}));
vi.mock("../../../../../../api/services/contractService", () => ({
  generateContract: api.generateContract,
}));
vi.mock("../../../../../../api/services/paymentService", () => ({
  createPayment: api.createPayment,
}));
vi.mock("../../../../../../api/services/notesService", () => ({
  createNote: api.createNote,
}));
vi.mock("../../../../../booking-agenda/services/bookingDetailsService", () => ({
  createBooking: api.createBooking,
}));

import { useContractForm } from "../useContractForm";

const pkg = {
  id: 3,
  name: "Fotobooth",
  price: 10000,
  brandId: 1,
  isActive: true,
};

const fillAndSubmit = async (result: {
  current: ReturnType<typeof useContractForm>;
}) => {
  await waitFor(() => expect(result.current.packages.length).toBeGreaterThan(0));
  // The date effect clears the period, so the date has to settle first —
  // picking a day and a block in one render would drop the block.
  await act(async () => {
    result.current.setFecha("2026-09-19");
  });
  await waitFor(() => expect(result.current.fecha).toBe("2026-09-19"));
  act(() => {
    result.current.setPeriod("pm_block");
    result.current.setSelectedUserId(11);
    result.current.setNombre("Ana Ruiz");
    result.current.setEmail("ana@example.com");
    result.current.setTelefono("5512345678");
    result.current.setSelectedPackageId(pkg.id);
  });
  act(() => result.current.handleAgregar());
  await waitFor(() => expect(result.current.items.length).toBe(1));
  act(() => result.current.setAnticipo("999999"));
  await act(async () => {
    await result.current.handleSubmit();
  });
};

describe("useContractForm — the contract's booking", () => {
  beforeEach(() => {
    Object.values(api).forEach((mock) => mock.mockReset());
    api.getBrands.mockResolvedValue([{ id: 1, name: "Expo Bebé" }]);
    api.getPackages.mockResolvedValue([pkg]);
    api.getExtras.mockResolvedValue([]);
    api.getUsers.mockResolvedValue([{ id: 11, name: "Vendedor" }]);
    api.getPromotionsByBrandId.mockResolvedValue(null);
    api.getSlots.mockResolvedValue([]);
    api.getSlotsByMonthAndYear.mockResolvedValue([]);
    api.holdSlot.mockResolvedValue({ id: 5, eventDate: "2026-09-19" });
    api.generateContract.mockResolvedValue({ id: 88, token: "tok", sku: "sku" });
    api.createPayment.mockResolvedValue({ id: 1 });
    api.createNote.mockResolvedValue({ id: 1 });
    api.createBooking.mockResolvedValue({ id: 99 });
  });

  it("books the sold block against the contract it just created", async () => {
    const { result } = renderHook(() => useContractForm({ lockedBrandId: 1 }));
    await fillAndSubmit(result);

    expect(api.generateContract).toHaveBeenCalledTimes(1);
    expect(api.createBooking).toHaveBeenCalledTimes(1);
    // The sale picked "Tarde", so the booking carries that block's hours —
    // 12:00–20:00 Mexico City — not an hour anyone typed.
    expect(api.createBooking.mock.calls[0][0]).toMatchObject({
      scheduleType: "exact",
      eventDate: "2026-09-19",
      serviceStartsAt: "2026-09-19T18:00:00.000Z",
      serviceEndsAt: "2026-09-20T02:00:00.000Z",
      contractId: 88,
      purpose: "event",
    });
    expect(result.current.bookingWarning).toBeNull();
  });

  it("creates the booking only after the contract exists", async () => {
    const order: string[] = [];
    api.generateContract.mockImplementation(async () => {
      order.push("contract");
      return { id: 88, token: "tok", sku: "sku" };
    });
    api.createBooking.mockImplementation(async () => {
      order.push("booking");
      return { id: 99 };
    });
    const { result } = renderHook(() => useContractForm({ lockedBrandId: 1 }));
    await fillAndSubmit(result);
    expect(order).toEqual(["contract", "booking"]);
  });

  it("warns without failing the sale when the booking cannot be created", async () => {
    api.createBooking.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useContractForm({ lockedBrandId: 1 }));
    await fillAndSubmit(result);

    // The contract and its deposit already exist. Reporting this as a contract
    // error would push the seller to sell the same thing twice.
    expect(result.current.errorMsg).toBeNull();
    expect(result.current.contract).toMatchObject({ id: 88 });
    expect(result.current.bookingWarning).toContain("agenda");
  });

  it("clears the warning when the form is reset for the next sale", async () => {
    api.createBooking.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useContractForm({ lockedBrandId: 1 }));
    await fillAndSubmit(result);
    expect(result.current.bookingWarning).not.toBeNull();
    act(() => result.current.resetForm());
    expect(result.current.bookingWarning).toBeNull();
  });
});
