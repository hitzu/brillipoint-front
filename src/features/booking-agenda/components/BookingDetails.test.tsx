// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  getBookingDetail: vi.fn(),
  getBookingNotes: vi.fn(),
  createBookingNote: vi.fn(),
}));
vi.mock("../services/bookingDetailsService", () => api);
import { BookingDetails } from "./BookingDetails";

const entry = {
  key: "agenda:3",
  id: 3,
  bookingId: 3,
  contractId: 7,
  sku: "SKU-7",
  title: "Fiesta",
  clientName: null,
  venueName: "Foro",
  date: "2026-09-19",
  continuesFromPreviousDay: false,
  continuesNextDay: false,
  startsAt: "2026-09-19T18:00:00Z",
  endsAt: "2026-09-19T20:00:00Z",
  blocks: [],
  isApproximate: false,
};

describe("BookingDetails", () => {
  it("shows SKU with the reservation token and never exposes staff mutations in read-only mode", async () => {
    api.getBookingDetail.mockResolvedValue({
      ...entry,
      eventDate: entry.date,
      status: "confirmed",
      serviceStartsAt: entry.startsAt,
      serviceEndsAt: entry.endsAt,
      purpose: "event",
      mapsUrl: "javascript:alert(1)",
      contract: { sku: "SKU-7", token: "token-7" },
    });
    render(
      <BookingDetails
        entry={entry}
        readOnly
        onClose={() => undefined}
        onEdit={() => undefined}
      />
    );
    expect(await screen.findByText("SKU-7")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "SKU-7" })).toBeNull();
    const link = screen.getByRole("link", { name: "Ver página de reserva" });
    expect(link.getAttribute("href")).toBe("/reserva/token-7");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noreferrer");
    expect(link.className).toContain("btn");
    expect(screen.queryByRole("button", { name: "Editar" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Ver en Maps" })).toBeNull();
    expect(api.getBookingNotes).not.toHaveBeenCalled();
  });

  it("renders a safe Maps URL as a button-styled link opening in a new tab", async () => {
    api.getBookingDetail.mockResolvedValue({
      ...entry,
      eventDate: entry.date,
      status: "confirmed",
      serviceStartsAt: entry.startsAt,
      serviceEndsAt: entry.endsAt,
      purpose: "event",
      mapsUrl: "https://maps.google.com/?q=Foro",
      contract: { sku: "SKU-7", token: "token-7" },
    });
    render(
      <BookingDetails
        entry={entry}
        readOnly
        onClose={() => undefined}
        onEdit={() => undefined}
      />
    );
    const maps = await screen.findByRole("link", { name: "Ver en Maps" });
    expect(maps.getAttribute("target")).toBe("_blank");
    expect(maps.className).toContain("btn");
  });

  it("adds the retried pending note to the visible timeline", async () => {
    api.getBookingDetail.mockResolvedValue({
      ...entry,
      eventDate: entry.date,
      status: "confirmed",
      serviceStartsAt: entry.startsAt,
      serviceEndsAt: entry.endsAt,
      purpose: "event",
      mapsUrl: null,
      contract: null,
    });
    api.getBookingNotes.mockResolvedValue([]);
    api.createBookingNote.mockResolvedValue({
      id: 9,
      content: "Nota pendiente",
      kind: "internal",
      scope: "booking",
    });
    render(
      <BookingDetails
        entry={entry}
        readOnly={false}
        pendingNote="Nota pendiente"
        onClose={() => undefined}
        onEdit={() => undefined}
        onPendingNoteSaved={() => undefined}
      />
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Reintentar nota" })
    );
    expect(await screen.findByText("Nota pendiente")).toBeTruthy();
    expect(api.createBookingNote).toHaveBeenCalledTimes(1);
  });

  it("prevents dismissal while a note save is in progress", async () => {
    let resolveNote: (() => void) | undefined;
    api.getBookingDetail.mockResolvedValue({
      ...entry,
      eventDate: entry.date,
      status: "confirmed",
      serviceStartsAt: entry.startsAt,
      serviceEndsAt: entry.endsAt,
      purpose: "event",
      mapsUrl: null,
      contract: null,
    });
    api.getBookingNotes.mockResolvedValue([]);
    api.createBookingNote.mockReturnValue(
      new Promise((resolve) => {
        resolveNote = () =>
          resolve({ id: 1, content: "x", kind: "internal", scope: "booking" });
      })
    );
    const onClose = vi.fn();
    render(
      <BookingDetails
        entry={entry}
        readOnly={false}
        onClose={onClose}
        onEdit={() => undefined}
      />
    );
    fireEvent.change(await screen.findByLabelText("Nueva nota"), {
      target: { value: "x" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Agregar nota" }));
    await waitFor(() =>
      expect(
        (screen.getByRole("button", { name: "Cerrar" }) as HTMLButtonElement)
          .disabled
      ).toBe(true)
    );
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
    resolveNote?.();
    await waitFor(() =>
      expect(
        (screen.getByRole("button", { name: "Cerrar" }) as HTMLButtonElement)
          .disabled
      ).toBe(false)
    );
  });
});
