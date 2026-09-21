import type { AgendaEntry, YMD } from "../types";
import {
  rollingWeek,
  weekStart,
  isWeekendAgendaDay,
} from "../utils/businessDate";
import { WEEKDAYS } from "../utils/agendaPresentation";
import { AgendaEntryCard } from "./AgendaEntryCard";

interface Props {
  entries: Record<YMD, AgendaEntry[]>;
  selectedDate: YMD;
  weekendsOnly?: boolean;
  onDateSelect: (date: YMD) => void;
  onEventSelect?: (entry: AgendaEntry) => void;
}

export const visibleAgendaDates = (
  selectedDate: YMD,
  weekendsOnly = false
): YMD[] =>
  rollingWeek(weekStart(selectedDate)).filter(
    (date) => !weekendsOnly || isWeekendAgendaDay(date)
  );

export const AgendaSummary = ({
  entries,
  selectedDate,
  weekendsOnly = false,
  onDateSelect,
  onEventSelect,
}: Props) => {
  const dates = visibleAgendaDates(selectedDate, weekendsOnly);

  return (
    <section className="agenda-summary" aria-label="Resumen semanal">
      <div className="agenda-summary-headings">
        {dates.map((date) => {
          const day = new Date(`${date}T00:00:00Z`).getUTCDay();
          return (
            <button
              type="button"
              key={date}
              aria-pressed={date === selectedDate}
              onClick={() => onDateSelect(date)}
            >
              <span>{WEEKDAYS[(day + 6) % 7]}</span>
              <strong>{Number(date.slice(8))}</strong>
            </button>
          );
        })}
      </div>
      <div className="agenda-summary-grid">
        {dates.map((date) => (
          <article
            key={date}
            className={date === selectedDate ? "is-selected" : ""}
            aria-label={date}
          >
            <h3>{date}</h3>
            {(entries[date] ?? []).map((entry) => (
              <AgendaEntryCard
                key={entry.key}
                entry={entry}
                date={date}
                onSelect={
                  onEventSelect ? () => onEventSelect(entry) : undefined
                }
              />
            ))}
            {!(entries[date] ?? []).length ? (
              <p className="agenda-empty">Sin eventos</p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
};
