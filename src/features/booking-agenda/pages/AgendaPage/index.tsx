import { useEffect } from "react";
import { addDays, toYMD, weekStart } from "../../utils/businessDate";
import { monthFetchRange } from "../../utils/monthGrid";
import type { AgendaEntry, YMD } from "../../types";
import { exactCreateOptions } from "../../utils/createOptions";
import { useAgendaRange } from "../../hooks/useAgendaRange";
import { AgendaNavigation } from "../../components/AgendaNavigation";
import { BookingCalendar } from "../../components/BookingCalendar";
import { BookingDetails } from "../../components/BookingDetails";
import { BookingForm } from "../../components/BookingForm";
import { useAgendaPage } from "./hooks/useAgendaPage";
import styles from "./AgendaPage.module.css";
export interface AgendaPageProps {
  readOnly?: boolean;
  weekendsOnly?: boolean;
  initialDate?: YMD;
  onDateSelect?: (date: YMD) => void;
  onEventSelect?: (entry: AgendaEntry) => void;
}
export const AgendaPage = ({
  readOnly = false,
  weekendsOnly = false,
  initialDate = toYMD(new Date()),
  onDateSelect,
  onEventSelect,
}: AgendaPageProps) => {
  const page = useAgendaPage({
    initialDate,
    onDateSelect,
    onEventSelect,
    readOnly,
  });
  useEffect(() => {
    page.setSelectedDate(initialDate);
  }, [initialDate, page.setSelectedDate]);
  // Month views fetch the whole rendered grid (see monthFetchRange); week
  // views fetch the ISO week plus one extra day so the last day's
  // DayTimeline sees the next day's 04:00-04:00 early hours too.
  const isMonthView = page.view === "month" || page.view === "month-weekends";
  const start = weekStart(page.selectedDate);
  const { from, to } = isMonthView
    ? monthFetchRange(page.selectedDate, {
        weekendsOnly: page.view === "month-weekends",
      })
    : { from: start, to: addDays(start, 7) };
  const range = useAgendaRange(from, to);
  if (range.status === "loading" && !Object.keys(range.entries).length)
    return (
      <main className={styles.workspace}>
        <p aria-busy="true">Cargando agenda…</p>
      </main>
    );
  if (range.status === "error" && !Object.keys(range.entries).length)
    return (
      <main className={styles.workspace}>
        <p role="alert">No se pudo cargar la agenda.</p>
        <button type="button" onClick={range.refetch}>
          Reintentar
        </button>
      </main>
    );
  return (
    <main className={styles.workspace} aria-busy={range.isRefreshing}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Book &amp; Sign</p>
          <h1>{page.title}</h1>
          <p>Eventos que bloquean fecha y horario.</p>
        </div>
        {!readOnly ? (
          <button
            className={styles.primaryButton}
            type="button"
            onClick={page.startNew}
          >
            Nuevo evento
          </button>
        ) : null}
      </header>
      <AgendaNavigation
        selectedDate={page.selectedDate}
        view={page.view}
        views={page.views}
        onSelectDate={page.selectDate}
        onViewChange={page.onViewChange}
        onBack={page.onBack}
      />
      {range.error ? (
        <p className={styles.notice} role="alert">
          No se pudo actualizar la agenda.{" "}
          <button type="button" onClick={range.refetch}>
            Reintentar
          </button>
        </p>
      ) : null}
      <BookingCalendar
        entries={range.entries}
        selectedDate={page.selectedDate}
        view={page.view}
        readOnly={readOnly}
        weekendsOnly={weekendsOnly}
        onDateSelect={page.selectCalendarDate}
        onEventSelect={page.selectEvent}
        getCreateOptions={readOnly ? undefined : exactCreateOptions}
        onCreateRequest={readOnly ? undefined : page.requestCreate}
        onDaySelect={readOnly ? undefined : page.selectCalendarDate}
      />
      {page.selectedEntry ? (
        <BookingDetails
          entry={page.selectedEntry}
          detail={page.selectedDetail}
          readOnly={readOnly}
          onClose={page.closeDetails}
          onEdit={page.startEditing}
          pendingNote={
            page.pendingNote?.bookingId === page.selectedEntry.bookingId
              ? page.pendingNote.content
              : null
          }
          onPendingNoteSaved={() => page.setPendingNote(null)}
        />
      ) : null}
      {!readOnly && page.editing ? (
        <BookingForm
          initialDate={page.selectedDate}
          booking={page.editing === "new" ? null : page.editing}
          draft={page.editing === "new" ? page.draft : null}
          onCancel={page.cancelEditing}
          onSave={(payload, note, contractId) =>
            page.saveBooking(payload, note, range.refetch, contractId)
          }
        />
      ) : null}
    </main>
  );
};
