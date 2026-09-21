import { describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("../../../api/config/axiosConfig", () => ({
  axiosInstanceWithoutToken: { get },
  axiosInstanceWithToken: { get: vi.fn() },
}));

import { getPublicBookingCalendar } from "./publicBookingCalendar";

describe("getPublicBookingCalendar", () => {
  it("uses the public monthly endpoint and returns only anonymous occupied entries", async () => {
    get.mockResolvedValueOnce({
      data: {
        from: "2026-10-01",
        to: "2026-10-31",
        days: [
          {
            date: "2026-10-02",
            entries: [
              {
                id: 42,
                contractId: 99,
                sku: "PRIVATE-SKU",
                clientName: "Private client",
                title: "Private title",
                venueName: "Private venue",
                segmentStartsAt: "2026-10-02T18:00:00.000Z",
                segmentEndsAt: "2026-10-03T02:00:00.000Z",
              },
            ],
          },
        ],
      },
    });

    await expect(getPublicBookingCalendar(2026, 10)).resolves.toEqual({
      "2026-10-02": [
        expect.objectContaining({
          key: "public:2026-10-02:0",
          id: 1,
          bookingId: 1,
          contractId: null,
          sku: null,
          clientName: null,
          title: "Ocupado",
          venueName: null,
        }),
      ],
    });
    expect(get).toHaveBeenCalledWith("/bookings/calendar?year=2026&month=10", {
      signal: undefined,
    });
  });
});
