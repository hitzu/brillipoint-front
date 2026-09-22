// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  getBrands: vi.fn(),
  getPackages: vi.fn(),
  getExtras: vi.fn(),
  getUsers: vi.fn(),
  getPromotionsByBrandId: vi.fn(),
  getPublicBookingCalendar: vi.fn(),
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
  generateContract: vi.fn(),
}));
vi.mock("../../../../../../api/services/paymentService", () => ({
  createPayment: vi.fn(),
}));
vi.mock("../../../../../../api/services/notesService", () => ({
  createNote: vi.fn(),
}));
vi.mock("../../../../../booking-agenda/services/bookingDetailsService", () => ({
  createBooking: vi.fn(),
}));

import { useContractForm } from "../useContractForm";

const occupied = (startsAt: string, endsAt: string) => ({
  key: "agenda:1",
  id: 1,
  bookingId: 1,
  contractId: null,
  sku: null,
  title: "Ocupado",
  clientName: null,
  venueName: null,
  date: "2026-09-19",
  continuesFromPreviousDay: false,
  continuesNextDay: false,
  startsAt,
  endsAt,
  blocks: [],
  isApproximate: false,
});

const pickDate = async (
  result: { current: ReturnType<typeof useContractForm> },
  date: string
) => {
  await act(async () => {
    result.current.setFecha(date);
  });
  await waitFor(() => expect(result.current.fecha).toBe(date));
};

describe("useContractForm — block availability comes from bookings", () => {
  beforeEach(() => {
    Object.values(api).forEach((mock) => mock.mockReset());
    api.getBrands.mockResolvedValue([{ id: 1, name: "Expo Bebé" }]);
    api.getPackages.mockResolvedValue([]);
    api.getExtras.mockResolvedValue([]);
    api.getUsers.mockResolvedValue([]);
    api.getPromotionsByBrandId.mockResolvedValue(null);
    api.getPublicBookingCalendar.mockResolvedValue({});
  });

  it("offers every block on a day with no bookings", async () => {
    const { result } = renderHook(() => useContractForm({ lockedBrandId: 1 }));
    await pickDate(result, "2026-09-19");
    await waitFor(() =>
      expect(result.current.blockAvailability).toEqual({
        am_block: true,
        pm_block: true,
        night_block: true,
      })
    );
  });

  it("withdraws only the block an existing booking overlaps", async () => {
    // 18:00-20:00 Mexico City, inside the 12:00-20:00 Tarde block.
    api.getPublicBookingCalendar.mockResolvedValue({
      "2026-09-19": [
        occupied("2026-09-20T00:00:00.000Z", "2026-09-20T02:00:00.000Z"),
      ],
    });
    const { result } = renderHook(() => useContractForm({ lockedBrandId: 1 }));
    await pickDate(result, "2026-09-19");
    await waitFor(() =>
      expect(result.current.blockAvailability.pm_block).toBe(false)
    );
    expect(result.current.blockAvailability.am_block).toBe(true);
  });

  it("offers every block when the calendar cannot be read", async () => {
    // Never block a sale on a failed read: the seller has a client in front of
    // them, and a false "no disponible" costs more than a rare double booking
    // the agenda will surface.
    api.getPublicBookingCalendar.mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useContractForm({ lockedBrandId: 1 }));
    await pickDate(result, "2026-09-19");
    await waitFor(() =>
      expect(result.current.blockAvailability).toEqual({
        am_block: true,
        pm_block: true,
        night_block: true,
      })
    );
  });

  it("reads the next month too, so the night block sees past a month end", async () => {
    const { result } = renderHook(() => useContractForm({ lockedBrandId: 1 }));
    await pickDate(result, "2026-09-30");
    await waitFor(() =>
      expect(api.getPublicBookingCalendar).toHaveBeenCalledWith(2026, 9)
    );
    expect(api.getPublicBookingCalendar).toHaveBeenCalledWith(2026, 10);
  });
});
