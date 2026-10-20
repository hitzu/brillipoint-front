// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AxiosError } from "axios";

const api = vi.hoisted(() => ({
  getBrands: vi.fn(),
  getPackages: vi.fn(),
  getExtras: vi.fn(),
  getUsers: vi.fn(),
  getPromotionsByBrandId: vi.fn(),
  getPublicBookingCalendar: vi.fn(),
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
vi.mock("../../../../services/publicBookingCalendar", () => ({
  getPublicBookingCalendar: api.getPublicBookingCalendar,
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

const fillContract = async (
  result: {
    current: ReturnType<typeof useContractForm>;
  },
  period: "am_block" | "pm_block" | "night_block" = "pm_block"
) => {
  await waitFor(() => expect(result.current.packages.length).toBeGreaterThan(0));
  // The date effect clears the period, so the date has to settle first —
  // picking a day and a block in one render would drop the block.
  await act(async () => {
    result.current.setFecha("2026-09-19");
  });
  await waitFor(() => expect(result.current.fecha).toBe("2026-09-19"));
  act(() => {
    result.current.setPeriod(period);
    result.current.setSelectedUserId(11);
    result.current.setNombre("Ana Ruiz");
    result.current.setEmail("ana@example.com");
    result.current.setTelefono("5512345678");
    result.current.setSelectedPackageId(pkg.id);
  });
  act(() => result.current.handleAgregar());
  await waitFor(() => expect(result.current.items.length).toBe(1));
};

const llaveros = {
  id: 7,
  name: "Upgrade llaveros",
  price: 700,
  brandId: 1,
  status: "active",
};

const addLlaveros = async (result: {
  current: ReturnType<typeof useContractForm>;
}) => {
  await waitFor(() => expect(result.current.extrasCatalog.length).toBe(1));
  act(() => result.current.setSelectedExtraId(llaveros.id));
  act(() => result.current.handleAgregarExtra());
  await waitFor(() => expect(result.current.extraItems.length).toBe(1));
};

describe("useContractForm — gifted extras", () => {
  beforeEach(() => {
    Object.values(api).forEach((mock) => mock.mockReset());
    api.getBrands.mockResolvedValue([{ id: 1, name: "Expo Bebé" }]);
    api.getPackages.mockResolvedValue([pkg]);
    api.getExtras.mockResolvedValue([llaveros]);
    api.getUsers.mockResolvedValue([{ id: 11, name: "Vendedor" }]);
    api.getPromotionsByBrandId.mockResolvedValue(null);
    api.getPublicBookingCalendar.mockResolvedValue({});
    api.generateContract.mockResolvedValue({ id: 88, token: "tok", sku: "sku" });
    api.createPayment.mockResolvedValue({ id: 1 });
    api.createNote.mockResolvedValue({ id: 1 });
    api.createBooking.mockResolvedValue({ id: 99 });
  });

  it("discounts a gifted extra in full", async () => {
    const { result } = renderHook(() => useContractForm({ lockedBrandId: 1 }));
    await addLlaveros(result);

    act(() => result.current.setExtraItemGift(llaveros.id, true));

    expect(result.current.extraItems[0].isGift).toBe(true);
    expect(result.current.discountTotal).toBe(700);
  });

  it("flags a gifted extra in the contract payload", async () => {
    const { result } = renderHook(() => useContractForm({ lockedBrandId: 1 }));
    await fillContract(result);
    await addLlaveros(result);
    act(() => result.current.setExtraItemGift(llaveros.id, true));
    act(() => result.current.setAnticipo("999999"));

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(api.generateContract.mock.calls[0][0].extras).toEqual([
      { extraId: llaveros.id, quantity: 1, packageClientRef: expect.anything(), isGift: true },
    ]);
  });

  it("leaves a non-gifted extra out of the gift flag", async () => {
    const { result } = renderHook(() => useContractForm({ lockedBrandId: 1 }));
    await fillContract(result);
    await addLlaveros(result);
    act(() => result.current.setAnticipo("999999"));

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(api.generateContract.mock.calls[0][0].extras[0]).not.toHaveProperty(
      "isGift",
    );
    expect(result.current.discountTotal).toBe(0);
  });
});
