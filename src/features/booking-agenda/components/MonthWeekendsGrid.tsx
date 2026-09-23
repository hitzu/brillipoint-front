import type { AgendaEntry, YMD } from "../types";
import type { CreateOption, CreateOptionsPolicy } from "../utils/createOptions";
import { toYMD } from "../utils/businessDate";
import { isSameMonth, monthGridDates } from "../utils/monthGrid";
import { MONTHS } from "../utils/agendaPresentation";
import { AgendaEntryCard } from "./AgendaEntryCard";
import { DayTimeline, type TimelineScale } from "./DayTimeline";
import styles from "./MonthWeekendsGrid.module.css";

interface Props {
  entries: Record<YMD, AgendaEntry[]>;
  /** Any date in the month to render. */
  anchor: YMD;
  getCreateOptions?: CreateOptionsPolicy;
  onCreateRequest?: (option: CreateOption) => void;
  timelineScale?: TimelineScale;
  onDateSelect: (date: YMD) => void;
  onEventSelect?: (entry: AgendaEntry) => void;
  /** Civil "today", injected for testability. Defaults to the real one. */
  today?: YMD;
}

const WEEKEND_HEADERS = ["Viernes", "Sábado", "Domingo"];
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

export const MonthWeekendsGrid = ({
  entries,
  anchor,
  getCreateOptions,
  onCreateRequest,
  onDateSelect,
  onEventSelect,
  today = toYMD(new Date()),
  timelineScale = "hours",
}: Props) => {
  const weeks = monthGridDates(anchor, { weekendsOnly: true });

  return (
    <section
      className={`${styles.grid} month-weekends-grid`}
      aria-label="Fines de semana del mes"
    >
      <div className={styles.header} role="row">
        {WEEKEND_HEADERS.map((label) => (
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
                  <div
                    key={date}
                    role="gridcell"
                    className={`${styles.cell}${outsideMonth ? ` ${styles.dimmed}` : ""}${isPast ? ` ${styles.past}` : ""}${isToday ? ` ${styles.today}` : ""}`}
                    data-date={date}
                    data-outside-month={outsideMonth}
                    data-past={isPast}
                    data-today={isToday}
                  >
                    <button
                      type="button"
                      className={styles.cellHeader}
                      aria-label={longDateLabel(date)}
                      onClick={() => onDateSelect(date)}
                    >
                      <span className={styles.weekday}>
                        {WEEKDAY_NAMES[weekdayIndex(date)]}
                      </span>
                      <strong className={styles.dayNumber}>
                        {Number(date.slice(8, 10))}
                      </strong>
                    </button>
                    <DayTimeline
                      date={date}
                      entries={entries}
                      density="full"
                      scale={timelineScale}
                      getCreateOptions={isPast ? undefined : getCreateOptions}
                      onCreateRequest={isPast ? undefined : onCreateRequest}
                    />
                    {isPast ? (
                      <p className={styles.pastNote}>Fecha pasada</p>
                    ) : null}
                    <div className={styles.entries}>
                      {dayEntries.map((entry) => (
                        <AgendaEntryCard
                          key={entry.key}
                          entry={entry}
                          date={date}
                          onSelect={
                            onEventSelect
                              ? () => onEventSelect(entry)
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
