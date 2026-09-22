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

const fillAndSubmit = async (
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
    api.getPublicBookingCalendar.mockResolvedValue({});
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

  it("books the night block end to end, spanning midnight into the next civil day", async () => {
    const { result } = renderHook(() => useContractForm({ lockedBrandId: 1 }));
    await fillAndSubmit(result, "night_block");

    expect(api.createBooking).toHaveBeenCalledTimes(1);
    // Noche is 20:00-04:00 Mexico City on 2026-09-19: it starts the same
    // civil day but ends on the 20th — the whole reason night_block needed
    // its own third case instead of reusing am/pm.
    expect(api.createBooking.mock.calls[0][0]).toMatchObject({
      scheduleType: "exact",
      eventDate: "2026-09-19",
      serviceStartsAt: "2026-09-20T02:00:00.000Z",
      serviceEndsAt: "2026-09-20T10:00:00.000Z",
      contractId: 88,
      purpose: "event",
    });
    expect(result.current.bookingWarning).toBeNull();
  });

  it("creates the contract without a slotId", async () => {
    const { result } = renderHook(() => useContractForm({ lockedBrandId: 1 }));
    await fillAndSubmit(result);

    // The slot layer is retired from the expo sale: a contract no longer
    // needs a held slot to exist (the API made slotId optional).
    expect(api.generateContract.mock.calls[0][0]).not.toHaveProperty(
      "slotId"
    );
  });

  it("builds the sku from the picked date", async () => {
    const { result } = renderHook(() => useContractForm({ lockedBrandId: 1 }));
    await fillAndSubmit(result);

    // fillAndSubmit picks 2026-09-19; the sku must encode that date directly,
    // with no slot response in the path to source it from.
    const payload = api.generateContract.mock.calls[0][0];
    expect(payload.sku).toContain("19Sep26");
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

  it("names the conflicting booking in the warning on a 409, without touching errorMsg", async () => {
    const conflictError = new AxiosError(
      "Request failed with status code 409",
      "ERR_BAD_REQUEST",
      undefined,
      undefined,
      {
        status: 409,
        statusText: "Conflict",
        headers: {},
        config: {} as never,
        data: {
          conflict: {
            id: 7,
            title: "Otra fiesta",
            serviceStartsAt: "2026-09-19T18:00:00.000Z",
            serviceEndsAt: "2026-09-20T02:00:00.000Z",
          },
        },
      } as never
    );
    api.createBooking.mockRejectedValue(conflictError);
    const { result } = renderHook(() => useContractForm({ lockedBrandId: 1 }));
    await fillAndSubmit(result);

    expect(result.current.errorMsg).toBeNull();
    expect(result.current.contract).toMatchObject({ id: 88 });
    expect(result.current.bookingWarning).toContain("Otra fiesta");
    expect(result.current.bookingWarning).not.toContain("status code");
    // The contract exists and the deposit was charged by the time the booking
    // is attempted. A warning that only names the conflict reads like the sale
    // failed, which is what makes a seller sell the same thing twice.
    expect(result.current.bookingWarning).toContain("contrato se generó");
    expect(result.current.bookingWarning).toContain("coordinación");
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

const occupiedAt = (date: string, startsAt: string, endsAt: string) => ({
  key: `agenda:${date}:${startsAt}`,
  id: 1,
  bookingId: 1,
  contractId: null,
  sku: null,
  title: "Ocupado",
  clientName: null,
  venueName: null,
  date,
  continuesFromPreviousDay: false,
  continuesNextDay: false,
  startsAt,
  endsAt,
  blocks: [],
  isApproximate: false,
});

describe("useContractForm — pre-submit availability precheck", () => {
  beforeEach(() => {
    Object.values(api).forEach((mock) => mock.mockReset());
    api.getBrands.mockResolvedValue([{ id: 1, name: "Expo Bebé" }]);
    api.getPackages.mockResolvedValue([pkg]);
    api.getExtras.mockResolvedValue([]);
    api.getUsers.mockResolvedValue([{ id: 11, name: "Vendedor" }]);
    api.getPromotionsByBrandId.mockResolvedValue(null);
    api.getPublicBookingCalendar.mockResolvedValue({});
    api.generateContract.mockResolvedValue({ id: 88, token: "tok", sku: "sku" });
    api.createPayment.mockResolvedValue({ id: 1 });
    api.createNote.mockResolvedValue({ id: 1 });
    api.createBooking.mockResolvedValue({ id: 99 });
  });

  it("refuses the sale when the picked block was taken between load and submit", async () => {
    // 18:00-20:00 Mexico City on the 19th, inside the 12:00-20:00 Tarde block.
    api.getPublicBookingCalendar.mockResolvedValue({
      "2026-09-19": [
        occupiedAt(
          "2026-09-19",
          "2026-09-20T00:00:00.000Z",
          "2026-09-20T02:00:00.000Z"
        ),
      ],
    });
    const { result } = renderHook(() => useContractForm({ lockedBrandId: 1 }));
    await fillAndSubmit(result, "pm_block");

    expect(api.generateContract).not.toHaveBeenCalled();
    expect(result.current.errorMsg).toBeTruthy();
    expect(result.current.contract).toBeNull();
  });

  it("updates availability so the refused block reads as unavailable afterwards", async () => {
    // Available when the form loaded and the date was picked...
    const { result } = renderHook(() => useContractForm({ lockedBrandId: 1 }));
    await waitFor(() => expect(result.current.packages.length).toBeGreaterThan(0));
    await act(async () => {
      result.current.setFecha("2026-09-19");
    });
    await waitFor(() => expect(result.current.fecha).toBe("2026-09-19"));
    await waitFor(() => expect(result.current.blockAvailability.pm_block).toBe(true));

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

    // ...but taken by the time the seller actually submits.
    api.getPublicBookingCalendar.mockResolvedValue({
      "2026-09-19": [
        occupiedAt(
          "2026-09-19",
          "2026-09-20T00:00:00.000Z",
          "2026-09-20T02:00:00.000Z"
        ),
      ],
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.blockAvailability.pm_block).toBe(false);
  });

  it("sells normally when the picked block is still available", async () => {
    const { result } = renderHook(() => useContractForm({ lockedBrandId: 1 }));
    await fillAndSubmit(result, "pm_block");

    expect(api.generateContract).toHaveBeenCalledTimes(1);
    expect(result.current.errorMsg).toBeNull();
  });

  it("does not block the sale when the precheck read fails", async () => {
    api.getPublicBookingCalendar.mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useContractForm({ lockedBrandId: 1 }));
    await fillAndSubmit(result, "pm_block");

    expect(api.generateContract).toHaveBeenCalledTimes(1);
  });

  it("catches a night-block conflict living in the small hours of the following civil day", async () => {
    // 01:00-02:00 Mexico City on the 20th — inside night_block's 20:00-04:00
    // tail, which only shows up by reading the next civil day.
    api.getPublicBookingCalendar.mockResolvedValue({
      "2026-09-20": [
        occupiedAt(
          "2026-09-20",
          "2026-09-20T07:00:00.000Z",
          "2026-09-20T08:00:00.000Z"
        ),
      ],
    });
    const { result } = renderHook(() => useContractForm({ lockedBrandId: 1 }));
    await fillAndSubmit(result, "night_block");

    expect(api.generateContract).not.toHaveBeenCalled();
    expect(result.current.errorMsg).toBeTruthy();
  });
});
