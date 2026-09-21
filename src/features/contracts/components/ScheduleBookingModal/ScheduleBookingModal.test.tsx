// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createBooking, createBookingNote } = vi.hoisted(() => ({
  createBooking: vi.fn(),
  createBookingNote: vi.fn(),
}));
vi.mock("../../../booking-agenda/services/bookingDetailsService", () => ({
  createBooking,
  createBookingNote,
}));
vi.mock("../../../booking-agenda/services/contractPickerService", () => ({
  searchContracts: vi.fn().mockResolvedValue([]),
}));

import { ScheduleBookingModal } from "./ScheduleBookingModal";

const contract = { id: 7, sku: "SKU-0007", clientName: "Ana Ruiz" };

const renderModal = (onClose = vi.fn()) =>
  render(
    <ScheduleBookingModal
      show
      contract={contract}
      initialDate="2026-09-19"
      handleClose={onClose}
    />
  );

describe("ScheduleBookingModal", () => {
  beforeEach(() => {
    createBooking.mockReset().mockResolvedValue({ id: 42 });
    createBookingNote.mockReset().mockResolvedValue({ id: 1 });
  });

  it("renders nothing until it is shown", () => {
    render(
      <ScheduleBookingModal
        show={false}
        contract={contract}
        initialDate="2026-09-19"
        handleClose={vi.fn()}
      />
    );
    expect(screen.queryByLabelText("Contrato")).toBeNull();
  });

  it("locks the contract to the row it was opened from", () => {
    renderModal();
    const field = screen.getByLabelText("Contrato") as HTMLInputElement;
    expect(field.value).toBe("SKU-0007 — Ana Ruiz");
    expect(field.disabled).toBe(true);
  });

  it("creates the booking against that contract and closes", async () => {
    const onClose = vi.fn();
    renderModal(onClose);
    fireEvent.click(screen.getByRole("button", { name: "Tarde (12:00–20:00)" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(createBooking).toHaveBeenCalledTimes(1));
    expect(createBooking.mock.calls[0][0]).toMatchObject({
      scheduleType: "exact",
      eventDate: "2026-09-19",
      contractId: 7,
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("attaches an internal note to the booking it created", async () => {
    renderModal();
    fireEvent.change(screen.getByLabelText("Nota interna"), {
      target: { value: "Llevar kit" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(createBookingNote).toHaveBeenCalledWith(42, "Llevar kit"));
  });

  it("keeps the dialog open and shows the failure when saving fails", async () => {
    const onClose = vi.fn();
    createBooking.mockRejectedValue(new Error("boom"));
    renderModal(onClose);
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not lose the booking when only the note fails", async () => {
    createBookingNote.mockRejectedValue(new Error("note failed"));
    const onClose = vi.fn();
    renderModal(onClose);
    fireEvent.change(screen.getByLabelText("Nota interna"), {
      target: { value: "Llevar kit" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    // The booking is already created; a failed note must not surface as a
    // failed save or the seller will create the booking twice.
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(createBooking).toHaveBeenCalledTimes(1);
  });
});
