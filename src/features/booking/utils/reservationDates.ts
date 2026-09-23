import type { ContractBooking } from "../../../interfaces";
import { CONTRACT_SLOT_PURPOSE } from "@common/translations";

export interface ReservationDateRow {
  key: string;
  purpose: string;
  /** YYYY-MM-DD for bookings, ISO timestamp for the creation date. */
  date: string;
}

const byEventDate = (a: ContractBooking, b: ContractBooking) =>
  a.eventDate.localeCompare(b.eventDate);

/**
 * Rows for the public reservation "Fechas de los eventos" card:
 * contract creation date first, then each booking by event date.
 */
export const toReservationDates = (
  contractCreatedAt: string,
  bookings: ContractBooking[] | undefined,
): ReservationDateRow[] => [
  {
    key: CONTRACT_SLOT_PURPOSE.CREATION_DATE,
    purpose: CONTRACT_SLOT_PURPOSE.CREATION_DATE,
    date: contractCreatedAt,
  },
  ...[...(bookings ?? [])].sort(byEventDate).map((booking) => ({
    key: `booking-${booking.id}`,
    purpose: booking.purpose ?? CONTRACT_SLOT_PURPOSE.OTHER,
    date: booking.eventDate,
  })),
];

/**
 * Main event date (YYYY-MM-DD): earliest event-purpose booking, otherwise
 * the earliest booking of any purpose.
 */
export const getEventDate = (
  bookings: ContractBooking[] | undefined,
): string | null => {
  const sorted = [...(bookings ?? [])].sort(byEventDate);
  const event = sorted.find(
    (booking) => booking.purpose === CONTRACT_SLOT_PURPOSE.EVENT,
  );
  return (event ?? sorted[0])?.eventDate ?? null;
};
