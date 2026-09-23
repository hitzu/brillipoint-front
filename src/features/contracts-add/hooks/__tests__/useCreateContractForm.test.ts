// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  getUsers: vi.fn(),
  getBrands: vi.fn(),
  getPackages: vi.fn(),
  getExtras: vi.fn(),
  generateContract: vi.fn(),
  createPayment: vi.fn(),
  createNote: vi.fn(),
  createBooking: vi.fn(),
}));

vi.mock("../../../../api/services/usersService", () => ({
  getUsers: api.getUsers,
}));
vi.mock("../../../../api/services/brandService", () => ({
  getBrands: api.getBrands,
}));
vi.mock("../../../../api/services/packageService", () => ({
  getPackages: api.getPackages,
}));
vi.mock("../../../../api/services/extrasService", () => ({
  getExtras: api.getExtras,
}));
vi.mock("../../../../api/services/contractService", () => ({
  generateContract: api.generateContract,
}));
vi.mock("../../../../api/services/paymentService", () => ({
  createPayment: api.createPayment,
}));
vi.mock("../../../../api/services/notesService", () => ({
  createNote: api.createNote,
}));
vi.mock("../../../booking-agenda/services/bookingDetailsService", () => ({
  createBooking: api.createBooking,
}));

import { useCreateContractForm } from "../useCreateContractForm";

const photoboothPkg = {
  id: 1,
  name: "Fotobooth Clásico",
  basePrice: 5000,
  discount: null,
  status: "active",
  brandId: 1,
  brand: { id: 1, name: "Marca" },
  packageProducts: [],
};

const glitterPkg = {
  id: 2,
  name: "Glitter Bar",
  basePrice: 3000,
  discount: null,
  status: "active",
  brandId: 2,
  brand: { id: 2, name: "Otra Marca" },
  packageProducts: [],
};

const fillValidForm = async (result: {
  current: ReturnType<typeof useCreateContractForm>;
}) => {
  act(() => result.current.setSelectedBrandId(1));
  await waitFor(() => expect(result.current.packages.length).toBe(1));
  act(() => {
    result.current.setSelectedUserId(11);
    result.current.setClientName("Ana Ruiz");
    result.current.setClientPhone("5512345678");
    result.current.setClientEmail("ana@example.com");
  });
  act(() => result.current.addPackageToCart(photoboothPkg.id));
  await waitFor(() => expect(result.current.cart.length).toBe(1));
  act(() => {
    result.current.setEventDate("2026-09-19");
    result.current.setStartTime("12:00");
    result.current.setEndTime("18:00");
    result.current.setDepositAmount("1000");
  });
};

describe("useCreateContractForm — brand-driven catalog and cart", () => {
  beforeEach(() => {
    Object.values(api).forEach((mock) => mock.mockReset());
    api.getUsers.mockResolvedValue([{ id: 11, name: "Vendedor" }]);
    api.getBrands.mockResolvedValue([
      { id: 1, name: "Marca" },
      { id: 2, name: "Otra Marca" },
    ]);
    api.getPackages.mockImplementation(
      async ({ brandId }: { brandId?: number }) =>
        [photoboothPkg, glitterPkg].filter((pkg) => pkg.brandId === brandId),
    );
    api.getExtras.mockResolvedValue([]);
    api.generateContract.mockResolvedValue({
      id: 88,
      token: "tok",
      sku: "sku",
    });
    api.createPayment.mockResolvedValue({ id: 1 });
    api.createNote.mockResolvedValue({ id: 1 });
    api.createBooking.mockResolvedValue({ id: 99 });
  });

  it("does not load packages before a brand is selected", async () => {
    const { result } = renderHook(() => useCreateContractForm());
    expect(result.current.packages).toEqual([]);
    expect(api.getPackages).not.toHaveBeenCalled();
  });

  it("loads only the selected brand's packages", async () => {
    const { result } = renderHook(() => useCreateContractForm());
    act(() => result.current.setSelectedBrandId(1));
    await waitFor(() => expect(result.current.packages.length).toBe(1));
    expect(result.current.packages).toEqual([photoboothPkg]);
    expect(api.getPackages).toHaveBeenCalledWith({ brandId: 1 });
  });

  it("clears cart lines that no longer belong to the newly selected brand", async () => {
    const { result } = renderHook(() => useCreateContractForm());
    act(() => result.current.setSelectedBrandId(1));
    await waitFor(() => expect(result.current.packages.length).toBe(1));
    act(() => result.current.addPackageToCart(photoboothPkg.id));
    await waitFor(() => expect(result.current.cart.length).toBe(1));

    act(() => result.current.setSelectedBrandId(2));
    await waitFor(() => expect(result.current.packages.length).toBe(1));
    expect(result.current.cart).toEqual([]);
  });
});

describe("useCreateContractForm — validation", () => {
  beforeEach(() => {
    Object.values(api).forEach((mock) => mock.mockReset());
    api.getUsers.mockResolvedValue([{ id: 11, name: "Vendedor" }]);
    api.getBrands.mockResolvedValue([{ id: 1, name: "Marca" }]);
    api.getPackages.mockResolvedValue([photoboothPkg]);
    api.getExtras.mockResolvedValue([]);
  });

  it("rejects submit with an empty cart", async () => {
    const { result } = renderHook(() => useCreateContractForm());
    act(() => result.current.setSelectedBrandId(1));
    await waitFor(() => expect(result.current.packages.length).toBe(1));
    act(() => {
      result.current.setSelectedUserId(11);
      result.current.setClientName("Ana Ruiz");
      result.current.setEventDate("2026-09-19");
      result.current.setStartTime("12:00");
      result.current.setEndTime("18:00");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.errorMsg).toBe("Agrega al menos un paquete.");
    expect(api.generateContract).not.toHaveBeenCalled();
  });

  it("rejects submit when the start time is not before the end time", async () => {
    const { result } = renderHook(() => useCreateContractForm());
    act(() => result.current.setSelectedBrandId(1));
    await waitFor(() => expect(result.current.packages.length).toBe(1));
    act(() => {
      result.current.setSelectedUserId(11);
      result.current.setClientName("Ana Ruiz");
    });
    act(() => result.current.addPackageToCart(photoboothPkg.id));
    await waitFor(() => expect(result.current.cart.length).toBe(1));
    act(() => {
      result.current.setEventDate("2026-09-19");
      result.current.setStartTime("18:00");
      result.current.setEndTime("12:00");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.errorMsg).toBe(
      "La hora de inicio debe ser anterior a la hora de fin.",
    );
    expect(api.generateContract).not.toHaveBeenCalled();
  });

  it("keeps only digits in the phone, capped at 10", () => {
    const { result } = renderHook(() => useCreateContractForm());

    act(() => result.current.setClientPhone("55-1234-5678 99"));

    expect(result.current.clientPhone).toBe("5512345678");
  });

  it("rejects submit when the phone does not have 10 digits", async () => {
    const { result } = renderHook(() => useCreateContractForm());
    await fillValidForm(result);
    act(() => result.current.setClientPhone("55123"));

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.errorMsg).toBe(
      "El teléfono debe tener exactamente 10 dígitos.",
    );
    expect(api.generateContract).not.toHaveBeenCalled();
  });

  it("rejects submit when the email is malformed", async () => {
    const { result } = renderHook(() => useCreateContractForm());
    await fillValidForm(result);
    act(() => result.current.setClientEmail("ana@example"));

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.errorMsg).toBe("Ingresa un email válido.");
    expect(api.generateContract).not.toHaveBeenCalled();
  });

  it("rejects submit when the end date is before the start date", async () => {
    const { result } = renderHook(() => useCreateContractForm());
    await fillValidForm(result);
    // The end date follows the start date by default; picking an earlier
    // one overrides that, and it must still be refused.
    act(() => result.current.setEndDate("2026-09-18"));

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.errorMsg).toBe(
      "La hora de inicio debe ser anterior a la hora de fin.",
    );
    expect(api.generateContract).not.toHaveBeenCalled();
  });
});

describe("useCreateContractForm — end date", () => {
  beforeEach(() => {
    Object.values(api).forEach((mock) => mock.mockReset());
    api.getUsers.mockResolvedValue([{ id: 11, name: "Vendedor" }]);
    api.getBrands.mockResolvedValue([{ id: 1, name: "Marca" }]);
    api.getPackages.mockResolvedValue([photoboothPkg]);
    api.getExtras.mockResolvedValue([]);
  });

  it("follows the start date when it hasn't been picked separately", () => {
    const { result } = renderHook(() => useCreateContractForm());
    act(() => result.current.setEventDate("2026-09-19"));
    expect(result.current.endDate).toBe("2026-09-19");

    act(() => result.current.setEventDate("2026-09-20"));
    expect(result.current.endDate).toBe("2026-09-20");
  });

  it("keeps a manually picked end date as the start date moves earlier", () => {
    const { result } = renderHook(() => useCreateContractForm());
    act(() => result.current.setEventDate("2026-09-20"));
    act(() => result.current.setEndDate("2026-09-22"));

    act(() => result.current.setEventDate("2026-09-21"));
    expect(result.current.endDate).toBe("2026-09-22");
  });

  it("clamps a manually picked end date back to the start date when it would precede it", () => {
    const { result } = renderHook(() => useCreateContractForm());
    act(() => result.current.setEventDate("2026-09-20"));
    act(() => result.current.setEndDate("2026-09-22"));

    act(() => result.current.setEventDate("2026-09-25"));
    expect(result.current.endDate).toBe("2026-09-25");
  });

  it("sets the end date to the start date with the all-day preset", () => {
    const { result } = renderHook(() => useCreateContractForm());
    act(() => result.current.setEventDate("2026-09-19"));
    act(() => result.current.setEndDate("2026-09-22"));

    act(() => result.current.applyAllDay());
    expect(result.current.endDate).toBe("2026-09-19");
  });
});

describe("useCreateContractForm — submit flow", () => {
  beforeEach(() => {
    Object.values(api).forEach((mock) => mock.mockReset());
    api.getUsers.mockResolvedValue([{ id: 11, name: "Vendedor" }]);
    api.getBrands.mockResolvedValue([
      { id: 1, name: "Marca" },
      { id: 2, name: "Otra Marca" },
    ]);
    api.getPackages.mockResolvedValue([photoboothPkg]);
    api.getExtras.mockResolvedValue([]);
    api.generateContract.mockResolvedValue({
      id: 88,
      token: "tok",
      sku: "sku",
    });
    api.createPayment.mockResolvedValue({ id: 1 });
    api.createNote.mockResolvedValue({ id: 1 });
    api.createBooking.mockResolvedValue({ id: 99 });
  });

  it("submits the contract, payment and booking in order, with exact times and no slotId", async () => {
    const { result } = renderHook(() => useCreateContractForm());
    await fillValidForm(result);

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(api.generateContract).toHaveBeenCalledTimes(1);
    const contractPayload = api.generateContract.mock.calls[0][0];
    expect(contractPayload).not.toHaveProperty("slotId");
    expect(contractPayload).toMatchObject({
      userId: 11,
      brandId: 1,
      clientName: "Ana Ruiz",
      clientPhone: "5512345678",
      clientEmail: "ana@example.com",
      packages: [{ packageId: photoboothPkg.id, quantity: 1 }],
      extras: [],
    });

    expect(api.createPayment).toHaveBeenCalledTimes(1);
    expect(api.createPayment.mock.calls[0][0]).toMatchObject({
      contractId: 88,
      amount: 1000,
      note: "Depósito inicial",
    });

    expect(api.createBooking).toHaveBeenCalledTimes(1);
    expect(api.createBooking.mock.calls[0][0]).toMatchObject({
      scheduleType: "exact",
      eventDate: "2026-09-19",
      serviceStartsAt: "2026-09-19T18:00:00.000Z",
      serviceEndsAt: "2026-09-20T00:00:00.000Z",
      contractId: 88,
      purpose: "event",
      title: "Ana Ruiz",
    });

    expect(result.current.contract).toMatchObject({ id: 88 });
    expect(result.current.errorMsg).toBeNull();
    expect(result.current.bookingWarning).toBeNull();
  });

  it("creates the booking only after the contract and payment exist", async () => {
    const order: string[] = [];
    api.generateContract.mockImplementation(async () => {
      order.push("contract");
      return { id: 88, token: "tok", sku: "sku" };
    });
    api.createPayment.mockImplementation(async () => {
      order.push("payment");
      return { id: 1 };
    });
    api.createBooking.mockImplementation(async () => {
      order.push("booking");
      return { id: 99 };
    });

    const { result } = renderHook(() => useCreateContractForm());
    await fillValidForm(result);

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(order).toEqual(["contract", "payment", "booking"]);
  });

  it("warns without failing the sale when the booking cannot be created", async () => {
    api.createBooking.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useCreateContractForm());
    await fillValidForm(result);

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.errorMsg).toBeNull();
    expect(result.current.contract).toMatchObject({ id: 88 });
    expect(result.current.bookingWarning).toContain("agenda");
  });

  it("reports an error and never calls createBooking when the contract fails", async () => {
    api.generateContract.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useCreateContractForm());
    await fillValidForm(result);

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.errorMsg).toBeTruthy();
    expect(result.current.contract).toBeNull();
    expect(api.createPayment).not.toHaveBeenCalled();
    expect(api.createBooking).not.toHaveBeenCalled();
  });

  it("reports an error and never calls createBooking when the payment fails", async () => {
    api.createPayment.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useCreateContractForm());
    await fillValidForm(result);

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.errorMsg).toBeTruthy();
    expect(api.createBooking).not.toHaveBeenCalled();
  });

  it("books an event that crosses midnight into the next civil day", async () => {
    const { result } = renderHook(() => useCreateContractForm());
    await fillValidForm(result);
    act(() => {
      result.current.setEventDate("2026-09-24");
      result.current.setStartTime("23:00");
      result.current.setEndDate("2026-09-25");
      result.current.setEndTime("03:00");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(api.createBooking).toHaveBeenCalledTimes(1);
    expect(api.createBooking.mock.calls[0][0]).toMatchObject({
      eventDate: "2026-09-24",
      serviceStartsAt: "2026-09-25T05:00:00.000Z",
      serviceEndsAt: "2026-09-25T09:00:00.000Z",
    });
  });

  it("sends a valid, trimmed Maps URL on the booking", async () => {
    const { result } = renderHook(() => useCreateContractForm());
    await fillValidForm(result);
    act(() => result.current.setMapsUrl("  https://maps.google.com/?q=venue  "));

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(api.createBooking).toHaveBeenCalledTimes(1);
    expect(api.createBooking.mock.calls[0][0]).toMatchObject({
      mapsUrl: "https://maps.google.com/?q=venue",
    });
  });

  it("omits the Maps URL from the booking when it was left empty", async () => {
    const { result } = renderHook(() => useCreateContractForm());
    await fillValidForm(result);

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(api.createBooking).toHaveBeenCalledTimes(1);
    expect(api.createBooking.mock.calls[0][0]).not.toHaveProperty("mapsUrl");
  });

  it("rejects submit with an invalid Maps URL, before generateContract is called", async () => {
    const { result } = renderHook(() => useCreateContractForm());
    await fillValidForm(result);
    act(() => result.current.setMapsUrl("not-a-url"));

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.errorMsg).toBe("Ingresa una URL de Maps válida.");
    expect(api.generateContract).not.toHaveBeenCalled();
  });
});

const drinkExtra = {
  id: 5,
  brandId: 1,
  name: "Barra de bebidas",
  description: null,
  price: 800,
  status: "active",
  brand: { id: 1, name: "Marca" },
};

const inactiveExtra = {
  id: 6,
  brandId: 1,
  name: "Descontinuado",
  description: null,
  price: 100,
  status: "inactive",
  brand: { id: 1, name: "Marca" },
};

const otherBrandExtra = {
  id: 7,
  brandId: 2,
  name: "Extra de otra marca",
  description: null,
  price: 200,
  status: "active",
  brand: { id: 2, name: "Otra Marca" },
};

describe("useCreateContractForm — extras", () => {
  beforeEach(() => {
    Object.values(api).forEach((mock) => mock.mockReset());
    api.getUsers.mockResolvedValue([{ id: 11, name: "Vendedor" }]);
    api.getBrands.mockResolvedValue([
      { id: 1, name: "Marca" },
      { id: 2, name: "Otra Marca" },
    ]);
    api.getPackages.mockImplementation(
      async ({ brandId }: { brandId?: number }) =>
        [photoboothPkg, glitterPkg].filter((pkg) => pkg.brandId === brandId),
    );
    api.getExtras.mockImplementation(
      async ({ brandId }: { brandId?: number }) =>
        [drinkExtra, inactiveExtra, otherBrandExtra].filter(
          (extra) => extra.brandId === brandId,
        ),
    );
    api.generateContract.mockResolvedValue({
      id: 88,
      token: "tok",
      sku: "sku",
    });
    api.createPayment.mockResolvedValue({ id: 1 });
    api.createNote.mockResolvedValue({ id: 1 });
    api.createBooking.mockResolvedValue({ id: 99 });
  });

  it("does not load extras before a brand is selected", () => {
    const { result } = renderHook(() => useCreateContractForm());
    expect(result.current.extrasCatalog).toEqual([]);
    expect(api.getExtras).not.toHaveBeenCalled();
  });

  it("loads only active extras of the selected brand", async () => {
    const { result } = renderHook(() => useCreateContractForm());
    act(() => result.current.setSelectedBrandId(1));
    await waitFor(() =>
      expect(result.current.extrasCatalog.length).toBe(1),
    );
    expect(result.current.extrasCatalog).toEqual([drinkExtra]);
    expect(api.getExtras).toHaveBeenCalledWith({ brandId: 1 });
  });

  it("clears extra cart lines that no longer belong to the newly selected brand", async () => {
    const { result } = renderHook(() => useCreateContractForm());
    act(() => result.current.setSelectedBrandId(1));
    await waitFor(() => expect(result.current.extrasCatalog.length).toBe(1));
    act(() => result.current.addExtraToCart(drinkExtra.id));
    await waitFor(() => expect(result.current.extraCart.length).toBe(1));

    act(() => result.current.setSelectedBrandId(2));
    await waitFor(() =>
      expect(result.current.extrasCatalog).toEqual([otherBrandExtra]),
    );
    expect(result.current.extraCart).toEqual([]);
  });

  it("adds an extra's price to the subtotal", async () => {
    const { result } = renderHook(() => useCreateContractForm());
    act(() => result.current.setSelectedBrandId(1));
    await waitFor(() => expect(result.current.packages.length).toBe(1));
    act(() => result.current.addPackageToCart(photoboothPkg.id));
    await waitFor(() => expect(result.current.cart.length).toBe(1));
    await waitFor(() => expect(result.current.extrasCatalog.length).toBe(1));

    act(() => result.current.addExtraToCart(drinkExtra.id));
    await waitFor(() => expect(result.current.extraCart.length).toBe(1));

    expect(result.current.subtotal).toBe(
      photoboothPkg.basePrice + drinkExtra.price,
    );
  });

  it("sends extras linked to a cart package's clientRef in the submit payload", async () => {
    const { result } = renderHook(() => useCreateContractForm());
    act(() => result.current.setSelectedBrandId(1));
    await waitFor(() => expect(result.current.packages.length).toBe(1));
    act(() => {
      result.current.setSelectedUserId(11);
      result.current.setClientName("Ana Ruiz");
    });
    act(() => result.current.addPackageToCart(photoboothPkg.id));
    await waitFor(() => expect(result.current.cart.length).toBe(1));
    await waitFor(() => expect(result.current.extrasCatalog.length).toBe(1));

    const packageClientRef = result.current.cart[0].clientRef;
    act(() => result.current.addExtraToCart(drinkExtra.id, packageClientRef));
    await waitFor(() => expect(result.current.extraCart.length).toBe(1));

    act(() => {
      result.current.setEventDate("2026-09-19");
      result.current.setStartTime("12:00");
      result.current.setEndTime("18:00");
      result.current.setDepositAmount("1000");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(api.generateContract).toHaveBeenCalledTimes(1);
    const contractPayload = api.generateContract.mock.calls[0][0];
    expect(contractPayload.extras).toEqual([
      { extraId: drinkExtra.id, quantity: 1, packageClientRef },
    ]);
  });
});

describe("useCreateContractForm — success state", () => {
  beforeEach(() => {
    Object.values(api).forEach((mock) => mock.mockReset());
    api.getUsers.mockResolvedValue([{ id: 11, name: "Vendedor" }]);
    api.getBrands.mockResolvedValue([
      { id: 1, name: "Marca" },
      { id: 2, name: "Otra Marca" },
    ]);
    api.getPackages.mockResolvedValue([photoboothPkg]);
    api.getExtras.mockResolvedValue([]);
    api.generateContract.mockResolvedValue({
      id: 88,
      token: "tok-1",
      sku: "sku",
    });
    api.createPayment.mockResolvedValue({ id: 1 });
    api.createNote.mockResolvedValue({ id: 1 });
    api.createBooking.mockResolvedValue({ id: 99 });
  });

  it("has no reservation link before a contract exists", () => {
    const { result } = renderHook(() => useCreateContractForm());
    expect(result.current.contractLink).toBe("");
  });

  it("builds the reservation link from the created contract's token and the selected brand", async () => {
    const { result } = renderHook(() => useCreateContractForm());
    await fillValidForm(result);

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.contractLink).toBe(
      `${window.location.origin}/reserva/tok-1?brandId=1`,
    );
  });

  it("resets the form to a clean state, including the created contract", async () => {
    const { result } = renderHook(() => useCreateContractForm());
    await fillValidForm(result);

    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(result.current.contract).not.toBeNull();

    act(() => result.current.resetForm());

    expect(result.current.contract).toBeNull();
    expect(result.current.contractLink).toBe("");
    expect(result.current.bookingWarning).toBeNull();
    expect(result.current.errorMsg).toBeNull();
    expect(result.current.selectedUserId).toBe("");
    expect(result.current.selectedBrandId).toBe("");
    expect(result.current.clientName).toBe("");
    expect(result.current.clientPhone).toBe("");
    expect(result.current.clientEmail).toBe("");
    expect(result.current.cart).toEqual([]);
    expect(result.current.extraCart).toEqual([]);
    expect(result.current.eventDate).toBe("");
    expect(result.current.startTime).toBe("");
    expect(result.current.endTime).toBe("");
    expect(result.current.depositAmount).toBe("0");
    expect(result.current.paymentMethod).toBe("cash");
    expect(result.current.publicNote).toBe("");
    expect(result.current.venueName).toBe("");
  });
});
