import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock("../../../api/config/axiosConfig", () => ({
  axiosInstanceWithToken: { get, post },
}));
import {
  confirmBooking,
  createBookingNote,
  createInternalBooking,
  getBookingDetail,
  getBookingNotes,
  rescheduleBooking,
} from "./bookingDetailsService";

const payload = {
  scheduleType: "exact" as const,
  eventDate: "2026-09-19",
  serviceStartsAt: "2026-09-19T18:00:00.000Z",
  serviceEndsAt: "2026-09-20T02:00:00.000Z",
  title: "Evento",
  purpose: "event",
  venueName: "Foro",
  mapsUrl: "https://maps.example",
};

describe("booking details service", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });
  it("uses the verified booking detail and internal notes contracts", async () => {
    get
      .mockResolvedValueOnce({ data: { id: 9 } })
      .mockResolvedValueOnce({ data: [{ id: 1 }] });
    await expect(getBookingDetail(9)).resolves.toEqual({ id: 9 });
    await expect(getBookingNotes(9)).resolves.toEqual([{ id: 1 }]);
    expect(get).toHaveBeenNthCalledWith(1, "/bookings/9");
    expect(get).toHaveBeenNthCalledWith(2, "/notes/booking/9?kind=internal");
  });
  it("sends exact creation, hold confirmation, metadata rescheduling, and append-only notes", async () => {
    post.mockResolvedValue({ data: { id: 9 } });
    await createInternalBooking(payload);
    await confirmBooking(9, payload);
    await rescheduleBooking(9, payload);
    await createBookingNote(9, "Llegar temprano");
    expect(post).toHaveBeenNthCalledWith(1, "/bookings/internal", payload);
    expect(post).toHaveBeenNthCalledWith(2, "/bookings/9/confirm", {
      serviceStartsAt: payload.serviceStartsAt,
      serviceEndsAt: payload.serviceEndsAt,
    });
    expect(post).toHaveBeenNthCalledWith(3, "/bookings/9/reschedule", payload);
    expect(post).toHaveBeenNthCalledWith(4, "/notes", {
      content: "Llegar temprano",
      kind: "internal",
      targetId: 9,
      scope: "booking",
    });
  });
});
