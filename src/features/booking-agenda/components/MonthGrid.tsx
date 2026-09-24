import type { AgendaEntry, YMD } from "../types";
import { toYMD } from "../utils/businessDate";
import { isSameMonth, monthGridDates } from "../utils/monthGrid";
import {
  MONTHS,
  WEEKDAYS,
  entryPresentation,
} from "../utils/agendaPresentation";
import { DayTimeline } from "./DayTimeline";
import styles from "./MonthGrid.module.css";

interface Props {
  entries: Record<YMD, AgendaEntry[]>;
  /** Any date in the month to render. */
  anchor: YMD;
  /** Highlighted day. */
  selectedDate?: YMD;
  onDateSelect: (date: YMD) => void;
  /** Civil "today", injected for testability. Defaults to the real one. */
  today?: YMD;
}

const WEEKDAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const weekdayIndex = (date: YMD): number =>
  new Date(`${date}T00:00:00Z`).getUTCDay();

const longDateLabel = (date: YMD): string => {
  const day = Number(date.slice(8, 10));
  const month = Number(date.slice(5, 7)) - 1;
  const year = date.slice(0, 4);
  return `${WEEKDAY_NAMES[weekdayIndex(date)]}, ${day} de ${MONTHS[month]} de ${year}`;
};

/** Events listed inline per day cell; the rest collapse into "+N más". */
const MAX_INLINE_EVENTS = 2;

const weekOfLabel = (start: YMD): string => {
  const day = Number(start.slice(8, 10));
  const month = Number(start.slice(5, 7)) - 1;
  return `Semana del ${day} de ${MONTHS[month]}`;
};

export const MonthGrid = ({
  entries,
  anchor,
  selectedDate,
  onDateSelect,
  today = toYMD(new Date()),
}: Props) => {
  const weeks = monthGridDates(anchor);

  return (
    <section className={`${styles.grid} month-grid`} aria-label="Mes">
      <div className={styles.header} role="row">
        {WEEKDAYS.map((label) => (
          <span key={label} role="columnheader" className={styles.headerCell}>
            {label}
          </span>
        ))}
      </div>
      <div className={styles.weeks}>
        {weeks.map((week) => (
          <div key={week[0]} className={styles.week}>
            <p className={styles.weekLabel}>{weekOfLabel(week[0])}</p>
            <div className={styles.weekRow} role="row">
              {week.map((date) => {
                const outsideMonth = !isSameMonth(date, anchor);
                const isPast = date < today;
                const isToday = date === today;
                const dayEntries = entries[date] ?? [];

                return (
                  <button
                    type="button"
                    key={date}
                    role="gridcell"
                    aria-label={longDateLabel(date)}
                    aria-pressed={date === selectedDate}
                    className={`${styles.cell}${outsideMonth ? ` ${styles.dimmed}` : ""}${isPast ? ` ${styles.past}` : ""}${isToday ? ` ${styles.today}` : ""}`}
                    data-date={date}
                    data-outside-month={outsideMonth}
                    data-past={isPast}
                    data-today={isToday}
                    onClick={() => onDateSelect(date)}
                  >
                    <strong className={styles.dayNumber}>
                      {Number(date.slice(8, 10))}
                    </strong>
                    {/* Mes is an overview: no block buttons here (T3), always
                        hour ticks regardless of the caller's timeline scale. */}
                    <DayTimeline date={date} entries={entries} density="compact" />
                    {dayEntries.length > 0 ? (
                      <ul className={styles.events}>
                        {dayEntries.slice(0, MAX_INLINE_EVENTS).map((entry) => {
                          const info = entryPresentation(entry, date);
                          return (
                            <li key={entry.key} className={styles.event}>
                              {`${info.time} · ${info.title}`}
                            </li>
                          );
                        })}
                        {dayEntries.length > MAX_INLINE_EVENTS ? (
                          <li className={styles.more}>
                            +{dayEntries.length - MAX_INLINE_EVENTS} más
                          </li>
                        ) : null}
                      </ul>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
