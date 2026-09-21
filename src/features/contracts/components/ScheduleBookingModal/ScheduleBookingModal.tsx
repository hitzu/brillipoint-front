import { BookingForm } from "../../../booking-agenda/components/BookingForm";
import {
  createBooking,
  createBookingNote,
} from "../../../booking-agenda/services/bookingDetailsService";
import type {
  ContractOption,
  ExactBookingPayload,
  YMD,
} from "../../../booking-agenda/types";

interface ScheduleBookingModalProps {
  show: boolean;
  /** The contract row this was opened from. Fixes the form's contract field. */
  contract: ContractOption | null;
  initialDate: YMD;
  handleClose: () => void;
  /** Called after a booking is created, so a caller can refresh its data. */
  onCreated?: () => void;
}

export function ScheduleBookingModal({
  show,
  contract,
  initialDate,
  handleClose,
  onCreated,
}: ScheduleBookingModalProps) {
  if (!show || !contract) return null;

  const save = async (
    payload: ExactBookingPayload,
    note: string,
    contractId: number | null
  ) => {
    const saved = await createBooking(
      contractId === null ? payload : { ...payload, contractId }
    );
    if (note) {
      // The booking exists at this point. Letting a failed note reject would
      // show the save as failed and invite a duplicate booking.
      try {
        await createBookingNote(saved.id, note);
      } catch (error) {
        console.error("Error creating booking note:", error);
      }
    }
    onCreated?.();
    handleClose();
  };

  return (
    <BookingForm
      initialDate={initialDate}
      contract={contract}
      onCancel={handleClose}
      onSave={save}
    />
  );
}
