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
type BrowseView = "month" | "month-weekends";
type DetailView = "summary" | "hours";
const BROWSE_VIEWS: BrowseView[] = ["month", "month-weekends"];
const DETAIL_VIEWS: DetailView[] = ["summary", "hours"];
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
  // Two agenda levels (T5): browsing "Mes"/"Fines de semana" at the top,
  // drilling into a date's week detail ("Resumen"/"Horarios") with a way
  // back. The browse view/anchor persist across a detail visit.
  const [level, setLevel] = useState<"browse" | "detail">("browse");
  const [browseView, setBrowseView] = useState<BrowseView>("month-weekends");
  const [detailView, setDetailView] = useState<DetailView>("summary");
  const [browseAnchorDate, setBrowseAnchorDate] = useState<YMD>(initialDate);
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
  const view: CalendarView = level === "browse" ? browseView : detailView;
  const views: CalendarView[] = level === "browse" ? BROWSE_VIEWS : DETAIL_VIEWS;
  const onViewChange = (next: CalendarView) => {
    if (level === "browse") setBrowseView(next as BrowseView);
    else setDetailView(next as DetailView);
  };
  /** "Volver": only rendered by AgendaNavigation while a detail is open. */
  const onBack =
    level === "detail"
      ? () => {
          setLevel("browse");
          selectDate(browseAnchorDate);
        }
      : undefined;
  /** "Nuevo evento" prefilled with a specific date (no time range). */
  const startNewForDate = (date: YMD) => {
    selectDate(date);
    setDraft(null);
    setEditing("new");
  };
  /**
   * The calendar's date click: entering a month view drills into that
   * date's week detail; inside a detail, the day number opens the create
   * modal for that date instead (T5).
   */
  const selectCalendarDate = (date: YMD) => {
    if (level === "browse") {
      setBrowseAnchorDate(selectedDate);
      setDetailView("summary");
      setLevel("detail");
      selectDate(date);
    } else {
      startNewForDate(date);
    }
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
    onBack,
    onViewChange,
    pendingNote,
    requestCreate,
    saveBooking,
    selectCalendarDate,
    selectedDate,
    selectedDetail,
    selectedEntry,
    selectDate,
    selectEvent,
    setEditing,
    setPendingNote,
    setSelectedDate,
    startEditing,
    startNew,
    title,
    view,
    views,
  };
};
