import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "@assets/css/expo-bebe.module.css";
import type { BookingBlockId } from "@shared/scheduling/bookingBlocks";
import { AgendaNavigation } from "../../booking-agenda/components/AgendaNavigation";
import { BookingCalendar } from "../../booking-agenda/components/BookingCalendar";
import type {
  AgendaEntry,
  CalendarView as CalendarViewMode,
  YMD,
} from "../../booking-agenda/types";
import { toYMD } from "../../booking-agenda/utils/businessDate";
import {
  blockCreateOptions,
  type CreateOption,
} from "../../booking-agenda/utils/createOptions";
import { monthFetchRange, monthsInRange } from "../../booking-agenda/utils/monthGrid";
import { getPublicBookingCalendar } from "../services/publicBookingCalendar";

export interface ReserveSelection {
  date: YMD;
  blockId: BookingBlockId;
}

interface CalendarViewProps {
  brandName?: string | null;
  onPickDate?: (date: YMD) => void;
  /** Fires when a free block button is used — carries the block to reserve. */
  onReserve?: (selection: ReserveSelection) => void;
  initialDate?: YMD;
}

type CalendarStatus = "loading" | "success" | "error";

/**
 * Only the two views expo operates with. "Fines de semana" is the priority
 * view for on-site sales; "Mes" is available for the rare cross-week look.
 */
const EXPO_VIEWS: CalendarViewMode[] = ["month-weekends", "month"];

/** Every (year, month) the currently visible grid needs data for. */
const requiredMonths = (
  date: YMD,
  view: CalendarViewMode
): Array<{ year: number; month: number }> => {
  const { from, to } = monthFetchRange(date, {
    weekendsOnly: view === "month-weekends",
  });
  return monthsInRange(from, to);
};

const mergeEntries = (
  monthlyEntries: Array<Record<YMD, AgendaEntry[]>>
): Record<YMD, AgendaEntry[]> =>
  monthlyEntries.reduce<Record<YMD, AgendaEntry[]>>(
    (all, entries) => ({ ...all, ...entries }),
    {}
  );

export function CalendarView({
  brandName,
  onPickDate,
  onReserve,
  initialDate,
}: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<YMD>(
    () => initialDate ?? toYMD(new Date())
  );
  const [view, setView] = useState<CalendarViewMode>("month-weekends");
  const [entries, setEntries] = useState<Record<YMD, AgendaEntry[]>>({});
  const [status, setStatus] = useState<CalendarStatus>("loading");
  const [refresh, setRefresh] = useState(0);

  const months = useMemo(
    () => requiredMonths(selectedDate, view),
    [selectedDate, view]
  );
  const retry = useCallback(() => setRefresh((value) => value + 1), []);
  const selectDate = useCallback(
    (date: YMD) => {
      setSelectedDate(date);
      onPickDate?.(date);
    },
    [onPickDate]
  );
  const handleCreateRequest = useCallback(
    (option: CreateOption) => {
      if (!option.blockId) return;
      onReserve?.({ date: option.date, blockId: option.blockId });
    },
    [onReserve]
  );

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setEntries({});

    Promise.all(
      months.map(({ year, month }) =>
        getPublicBookingCalendar(year, month, controller.signal)
      )
    )
      .then((responses) => {
        if (controller.signal.aborted) return;
        setEntries(mergeEntries(responses));
        setStatus("success");
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("error");
      });

    return () => controller.abort();
  }, [months, refresh]);

  return (
    <section className={styles.panel} aria-label="Disponibilidad de expo">
      <AgendaNavigation
        selectedDate={selectedDate}
        view={view}
        onSelectDate={setSelectedDate}
        onViewChange={setView}
        views={EXPO_VIEWS}
      />
      {status === "loading" ? (
        <p className={styles.calLoading} aria-busy="true">
          Cargando disponibilidad…
        </p>
      ) : null}
      {status === "error" ? (
        <div className={styles.calError} role="alert">
          No se pudo cargar la disponibilidad.{" "}
          <button type="button" onClick={retry}>
            Reintentar
          </button>
        </div>
      ) : null}
      {status === "success" ? (
        <div className={styles.calendarBody}>
          <BookingCalendar
            entries={entries}
            selectedDate={selectedDate}
            view={view}
            readOnly
            weekendsOnly={view === "month-weekends"}
            onDateSelect={selectDate}
            getCreateOptions={blockCreateOptions}
            onCreateRequest={handleCreateRequest}
            timelineScale="blocks"
          />
        </div>
      ) : null}
      {brandName ? (
        <div className={styles.brandTag}>Marca: {brandName}</div>
      ) : null}
    </section>
  );
}
