// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  getBookingDetail: vi.fn(),
  getBookingNotes: vi.fn(),
  createBookingNote: vi.fn(),
  createInternalBooking: vi.fn(),
  confirmBooking: vi.fn(),
  rescheduleBooking: vi.fn(),
}));
vi.mock("../../hooks/useAgendaRange", () => ({
  useAgendaRange: () => ({
    entries: {},
    status: "ready",
    error: null,
    isRefreshing: false,
    refetch: vi.fn(),
  }),
}));
vi.mock("../../components/AgendaNavigation", () => ({
  AgendaNavigation: () => <div />,
}));
vi.mock("../../components/BookingCalendar", () => ({
  BookingCalendar: ({
    onEventSelect,
  }: {
    onEventSelect: (entry: unknown) => void;
  }) => (
    <button type="button" onClick={() => onEventSelect(entry)}>
      Abrir evento
    </button>
  ),
}));
vi.mock("../../services/bookingDetailsService", () => api);
import { AgendaPage } from ".";

const entry = {
  key: "agenda:4",
  id: 4,
  bookingId: 4,
  contractId: null,
  sku: null,
  title: "Antes",
  clientName: null,
  venueName: null,
  date: "2026-09-19",
  continuesFromPreviousDay: false,
  continuesNextDay: false,
  startsAt: "2026-09-19T18:00:00.000Z",
  endsAt: "2026-09-19T20:00:00.000Z",
  blocks: [],
  isApproximate: false,
};
const hold = {
  ...entry,
  status: "hold",
  eventDate: entry.date,
  serviceStartsAt: entry.startsAt,
  serviceEndsAt: entry.endsAt,
  purpose: "event",
  mapsUrl: null,
  contract: null,
};
const confirmed = { ...hold, status: "confirmed", title: "Después" };

const openEdit = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Abrir evento" }));
  await screen.findByRole("button", { name: "Editar" });
  fireEvent.click(screen.getByRole("button", { name: "Editar" }));
};

describe("AgendaPage mutations", () => {
  beforeEach(() => {
    Object.values(api).forEach((mock) => mock.mockReset());
    api.getBookingNotes.mockResolvedValue([]);
    api.getBookingDetail.mockResolvedValue(hold);
  });
  it("does not confirm a hold twice when metadata save is retried", async () => {
    api.confirmBooking.mockResolvedValue({ ...hold, status: "confirmed" });
    api.rescheduleBooking
      .mockRejectedValueOnce(new Error("metadata failed"))
      .mockResolvedValue(confirmed);
    render(<AgendaPage initialDate="2026-09-19" />);
    await openEdit();
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(api.rescheduleBooking).toHaveBeenCalledTimes(2));
    expect(api.confirmBooking).toHaveBeenCalledTimes(1);
  });
  it("closes the booking form without opening event details after saving", async () => {
    api.rescheduleBooking.mockResolvedValue(confirmed);
    render(<AgendaPage initialDate="2026-09-19" />);
    await openEdit();
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.queryByText("Detalles del evento")).toBeNull();
  });
  it("keeps only one booking dialog visible when editing an event", async () => {
    render(<AgendaPage initialDate="2026-09-19" />);
    await openEdit();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });
});
