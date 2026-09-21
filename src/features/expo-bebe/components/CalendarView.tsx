import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "@assets/css/expo-bebe.module.css";
import { AgendaNavigation } from "../../booking-agenda/components/AgendaNavigation";
import { BookingCalendar } from "../../booking-agenda/components/BookingCalendar";
import type { AgendaEntry, YMD } from "../../booking-agenda/types";
import {
  rollingWeek,
  toYMD,
  weekStart,
} from "../../booking-agenda/utils/businessDate";
import { getPublicBookingCalendar } from "../services/publicBookingCalendar";

interface CalendarViewProps {
  brandName?: string | null;
  onPickDate?: (date: YMD) => void;
  initialDate?: YMD;
}

type CalendarStatus = "loading" | "success" | "error";

const requiredMonths = (date: YMD): Array<{ year: number; month: number }> => {
  const months = new Map<string, { year: number; month: number }>();
  for (const day of rollingWeek(weekStart(date))) {
    const year = Number(day.slice(0, 4));
    const month = Number(day.slice(5, 7));
    months.set(`${year}-${month}`, { year, month });
  }
  return Array.from(months.values());
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
  initialDate,
}: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<YMD>(
    () => initialDate ?? toYMD(new Date())
  );
  const [entries, setEntries] = useState<Record<YMD, AgendaEntry[]>>({});
  const [status, setStatus] = useState<CalendarStatus>("loading");
  const [refresh, setRefresh] = useState(0);

  const months = useMemo(() => requiredMonths(selectedDate), [selectedDate]);
  const retry = useCallback(() => setRefresh((value) => value + 1), []);
  const selectDate = useCallback(
    (date: YMD) => {
      setSelectedDate(date);
      onPickDate?.(date);
    },
    [onPickDate]
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
        view="summary"
        onSelectDate={selectDate}
        onViewChange={() => undefined}
        showViewPicker={false}
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
        <BookingCalendar
          entries={entries}
          selectedDate={selectedDate}
          readOnly
          weekendsOnly
          onDateSelect={selectDate}
        />
      ) : null}
      {brandName ? (
        <div className={styles.brandTag}>Marca: {brandName}</div>
      ) : null}
    </section>
  );
}
