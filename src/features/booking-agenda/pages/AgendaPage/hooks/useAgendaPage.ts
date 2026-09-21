import { useMemo, useState } from "react";
import type {
  AgendaEntry,
  BookingDetail,
  ExactBookingPayload,
  YMD,
} from "../../../types";
import {
  createBookingNote,
  confirmBooking,
  createInternalBooking,
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
    refetch: () => void
  ) => {
    let saved: BookingDetail;
    if (editing && editing !== "new") {
      if (editing.status === "hold") {
        try {
          await confirmBooking(editing.id, payload);
          setEditing({ ...editing, status: "confirmed" });
        } catch {
          throw new Error(
            "No se pudo confirmar el evento; no se aplicaron los demás cambios."
          );
        }
        try {
          saved = await rescheduleBooking(editing.id, payload);
        } catch {
          throw new Error(
            "El evento quedó confirmado, pero no se pudieron guardar los demás cambios. Vuelve a intentar guardar la información; no se volverá a confirmar."
          );
        }
      } else {
        saved = await rescheduleBooking(editing.id, payload);
      }
    } else {
      saved = await createInternalBooking(payload);
    }
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
