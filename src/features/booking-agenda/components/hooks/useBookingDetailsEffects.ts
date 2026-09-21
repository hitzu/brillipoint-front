import { useEffect } from "react";
import type { BookingDetail, BookingNote } from "../../types";
import {
  getBookingDetail,
  getBookingNotes,
} from "../../services/bookingDetailsService";
interface Args {
  bookingId: number;
  readOnly: boolean;
  updatedDetail?: BookingDetail | null;
  setDetail: (detail: BookingDetail | null) => void;
  setError: (error: string | null) => void;
  setNotes: (notes: BookingNote[]) => void;
}
export const useBookingDetailsEffects = ({
  bookingId,
  readOnly,
  setDetail,
  setError,
  setNotes,
  updatedDetail,
}: Args) => {
  useEffect(() => {
    let active = true;
    setDetail(updatedDetail ?? null);
    setNotes([]);
    setError(null);
    Promise.all([
      updatedDetail
        ? Promise.resolve(updatedDetail)
        : getBookingDetail(bookingId),
      readOnly ? Promise.resolve([]) : getBookingNotes(bookingId),
    ])
      .then(([booking, loadedNotes]) => {
        if (active) {
          setDetail(booking);
          setNotes(loadedNotes);
        }
      })
      .catch(() => {
        if (active) setError("No se pudieron cargar los detalles del evento.");
      });
    return () => {
      active = false;
    };
  }, [bookingId, readOnly, updatedDetail]);
};
