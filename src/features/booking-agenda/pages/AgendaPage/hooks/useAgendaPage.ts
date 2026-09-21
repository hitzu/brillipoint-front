import { useMemo, useState } from "react";
import type {
  AgendaEntry,
  BookingDetail,
  ExactBookingPayload,
  YMD,
} from "../../../types";
import {
  createBooking,
  createBookingNote,
  rescheduleBooking,
} from "../../../services/bookingDetailsService";
type EditingBooking = BookingDetail | "new" | null;
interface Args {
  initialDate: YMD;
  onDateSelect?: (date: YMD) => void;
  onEventSelect?: (entry: AgendaEntry) => void;
  readOnly: boolean;
}
export const useAgendaPage = ({
  initialDate,
  onDateSelect,
  onEventSelect,
  readOnly,
}: Args) => {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [view, setView] = useState<"summary" | "hours">("summary");
  const [selectedEntry, setSelectedEntry] = useState<AgendaEntry | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<BookingDetail | null>(
    null
  );
  const [editing, setEditing] = useState<EditingBooking>(null);
  const [pendingNote, setPendingNote] = useState<{
    bookingId: number;
    content: string;
  } | null>(null);
  const title = useMemo(
    () => (readOnly ? "Disponibilidad" : "Agenda"),
    [readOnly]
  );
  const selectDate = (date: YMD) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };
  const selectEvent = (entry: AgendaEntry) => {
    setSelectedDetail(null);
    setSelectedEntry(entry);
    onEventSelect?.(entry);
  };
  const closeDetails = () => {
    setSelectedEntry(null);
    setSelectedDetail(null);
  };
  const startEditing = (detail: BookingDetail) => {
    closeDetails();
    setEditing(detail);
  };
  const saveBooking = async (
    payload: ExactBookingPayload,
    note: string,
    refetch: () => void,
    contractId: number | null = null
  ) => {
    // The contract is a field on the payload, not a different endpoint: the
    // API creates every booking through POST /bookings.
    const saved =
      editing && editing !== "new"
        ? await rescheduleBooking(editing.id, payload)
        : await createBooking(
            contractId === null ? payload : { ...payload, contractId }
          );
    if (note) {
      try {
        await createBookingNote(saved.id, note);
      } catch {
        setPendingNote({ bookingId: saved.id, content: note });
      }
    }
    setEditing(null);
    refetch();
  };
  return {
    closeDetails,
    editing,
    pendingNote,
    saveBooking,
    selectedDate,
    selectedDetail,
    selectedEntry,
    selectDate,
    selectEvent,
    setEditing,
    setPendingNote,
    setSelectedDate,
    setView,
    startEditing,
    title,
    view,
  };
};
