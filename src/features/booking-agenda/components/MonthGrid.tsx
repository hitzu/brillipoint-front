import { useEffect, useState } from "react";
import type { AgendaEntry, YMD } from "../types";
import type { CreateOption, CreateOptionsPolicy } from "../utils/createOptions";
import { toYMD } from "../utils/businessDate";
import { isSameMonth, monthGridDates } from "../utils/monthGrid";
import { MONTHS, WEEKDAYS } from "../utils/agendaPresentation";
import { DayTimeline, type TimelineScale } from "./DayTimeline";
import styles from "./MonthGrid.module.css";

interface Props {
  entries: Record<YMD, AgendaEntry[]>;
  /** Any date in the month to render. */
  anchor: YMD;
  /** Initial detail-panel selection; the grid tracks it after that. */
  selectedDate?: YMD;
  getCreateOptions?: CreateOptionsPolicy;
  onCreateRequest?: (option: CreateOption) => void;
  timelineScale?: TimelineScale;
  onDateSelect: (date: YMD) => void;
  onEventSelect?: (entry: AgendaEntry) => void;
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

const weekOfLabel = (start: YMD): string => {
  const day = Number(start.slice(8, 10));
  const month = Number(start.slice(5, 7)) - 1;
  return `Semana del ${day} de ${MONTHS[month]}`;
};

export const MonthGrid = ({
  entries,
  anchor,
  selectedDate,
  getCreateOptions,
  onCreateRequest,
  onDateSelect,
  onEventSelect,
  today = toYMD(new Date()),
  timelineScale = "hours",
}: Props) => {
  const [detailDate, setDetailDate] = useState<YMD | null>(
    selectedDate ?? null
  );
  useEffect(() => setDetailDate(selectedDate ?? null), [selectedDate]);

  const weeks = monthGridDates(anchor);
  const selectDay = (date: YMD) => {
    setDetailDate(date);
    onDateSelect(date);
  };
  const detailIsPast = detailDate ? detailDate < today : false;

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
                    aria-pressed={date === detailDate}
                    className={`${styles.cell}${outsideMonth ? ` ${styles.dimmed}` : ""}${isPast ? ` ${styles.past}` : ""}${isToday ? ` ${styles.today}` : ""}`}
                    data-date={date}
                    data-outside-month={outsideMonth}
                    data-past={isPast}
                    data-today={isToday}
                    onClick={() => selectDay(date)}
                  >
                    <strong className={styles.dayNumber}>
                      {Number(date.slice(8, 10))}
                    </strong>
                    <DayTimeline
                      date={date}
                      entries={entries}
                      density="compact"
                      scale={timelineScale}
                    />
                    <span className={styles.count}>
                      {dayEntries.length}{" "}
                      {dayEntries.length === 1 ? "evento" : "eventos"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {detailDate ? (
        <div className={styles.detail} aria-label={`Detalle ${detailDate}`}>
          <h3>{longDateLabel(detailDate)}</h3>
          <DayTimeline
            date={detailDate}
            entries={entries}
            density="full"
            scale={timelineScale}
            getCreateOptions={detailIsPast ? undefined : getCreateOptions}
            onCreateRequest={detailIsPast ? undefined : onCreateRequest}
          />
          {onEventSelect
            ? (entries[detailDate] ?? []).map((entry) => (
                <button
                  type="button"
                  key={entry.key}
                  className={styles.detailEvent}
                  onClick={() => onEventSelect(entry)}
                >
                  {entry.sku ?? entry.title ?? entry.clientName ?? "Evento"}
                </button>
              ))
            : null}
        </div>
      ) : null}
    </section>
  );
};
