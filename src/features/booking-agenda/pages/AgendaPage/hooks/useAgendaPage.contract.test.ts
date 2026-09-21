// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createBooking, createBookingNote, rescheduleBooking } = vi.hoisted(
  () => ({
    createBooking: vi.fn(),
    createBookingNote: vi.fn(),
    rescheduleBooking: vi.fn(),
  })
);

vi.mock("../../../services/bookingDetailsService", () => ({
  createBooking,
  createBookingNote,
  rescheduleBooking,
}));

import { useAgendaPage } from "./useAgendaPage";

const payload = {
  scheduleType: "exact" as const,
  eventDate: "2026-09-19",
  serviceStartsAt: "2026-09-19T18:00:00.000Z",
  serviceEndsAt: "2026-09-20T02:00:00.000Z",
};

const setup = () =>
  renderHook(() =>
    useAgendaPage({ initialDate: "2026-09-19", readOnly: false })
  );

describe("useAgendaPage — creating a booking", () => {
  beforeEach(() => {
    createBooking.mockReset().mockResolvedValue({ id: 31 });
    createBookingNote.mockReset().mockResolvedValue({ id: 1 });
    rescheduleBooking.mockReset().mockResolvedValue({ id: 31 });
  });

  it("carries the picked contract as a field on the payload", async () => {
    const { result } = setup();
    act(() => result.current.setEditing("new"));
    await act(async () => {
      await result.current.saveBooking(payload, "", () => undefined, 7);
    });
    expect(createBooking).toHaveBeenCalledWith({ ...payload, contractId: 7 });
  });

  it("omits the field entirely when no contract was picked", async () => {
    const { result } = setup();
    act(() => result.current.setEditing("new"));
    await act(async () => {
      await result.current.saveBooking(payload, "", () => undefined, null);
    });
    expect(createBooking).toHaveBeenCalledWith(payload);
    expect(createBooking.mock.calls[0][0]).not.toHaveProperty("contractId");
  });

  it("attaches the internal note to the booking it just created", async () => {
    const { result } = setup();
    act(() => result.current.setEditing("new"));
    await act(async () => {
      await result.current.saveBooking(payload, "Llevar kit", () => undefined, 7);
    });
    expect(createBookingNote).toHaveBeenCalledWith(31, "Llevar kit");
  });

  it("reschedules an existing booking instead of creating one", async () => {
    const { result } = setup();
    act(() =>
      result.current.setEditing({
        id: 5,
        status: "confirmed",
        eventDate: "2026-09-19",
        serviceStartsAt: null,
        serviceEndsAt: null,
        title: null,
        purpose: null,
        venueName: null,
        mapsUrl: null,
      })
    );
    await act(async () => {
      await result.current.saveBooking(payload, "", () => undefined, null);
    });
    expect(rescheduleBooking).toHaveBeenCalledWith(5, payload);
    expect(createBooking).not.toHaveBeenCalled();
  });
});
