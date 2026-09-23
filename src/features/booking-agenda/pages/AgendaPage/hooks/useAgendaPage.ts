import { useMemo, useState } from "react";
import type {
  AgendaEntry,
  BookingDetail,
  CalendarView,
  ExactBookingPayload,
  YMD,
} from "../../../types";
import type { CreateOption } from "../../../utils/createOptions";
import {
  createBooking,
  createBookingNote,
  rescheduleBooking,
} from "../../../services/bookingDetailsService";
type EditingBooking = BookingDetail | "new" | null;
/** A pending create intent from the calendar, prefilling a new booking. */
export interface BookingDraft {
  date: YMD;
  startsAt: string;
  endsAt: string;
}
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
  const [view, setView] = useState<CalendarView>("summary");
  const [selectedEntry, setSelectedEntry] = useState<AgendaEntry | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<BookingDetail | null>(
    null
  );
  const [editing, setEditing] = useState<EditingBooking>(null);
  const [draft, setDraft] = useState<BookingDraft | null>(null);
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
    setDraft(null);
    setEditing(detail);
  };
  /** A create action from the calendar: opens the "new booking" form prefilled. */
  const requestCreate = (option: CreateOption) => {
    setSelectedDate(option.date);
    onDateSelect?.(option.date);
    setDraft({ date: option.date, startsAt: option.startsAt, endsAt: option.endsAt });
    setEditing("new");
  };
  /** "Nuevo evento" header button: a blank form, no calendar-supplied draft. */
  const startNew = () => {
    setDraft(null);
    setEditing("new");
  };
  const cancelEditing = () => {
    setDraft(null);
    setEditing(null);
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
    setDraft(null);
    setEditing(null);
    refetch();
  };
  return {
    cancelEditing,
    closeDetails,
    draft,
    editing,
    pendingNote,
    requestCreate,
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
    startNew,
    title,
    view,
  };
};
