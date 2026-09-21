import { useState } from "react";
import type { BookingDetail, BookingNote } from "../../types";
import { createBookingNote } from "../../services/bookingDetailsService";
export const useBookingDetails = ({
  bookingId,
  onPendingNoteSaved,
}: {
  bookingId: number;
  onPendingNoteSaved?: () => void;
}) => {
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [notes, setNotes] = useState<BookingNote[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const addNote = async (content = note.trim()) => {
    if (!content) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createBookingNote(bookingId, content);
      setNotes((items) => [...items, created]);
      setNote("");
      onPendingNoteSaved?.();
    } catch {
      setError(
        "No se pudo guardar la nota. Puedes reintentarla sin duplicar el evento."
      );
    } finally {
      setSaving(false);
    }
  };
  return {
    addNote,
    detail,
    error,
    note,
    notes,
    saving,
    setDetail,
    setError,
    setNote,
    setNotes,
  };
};
