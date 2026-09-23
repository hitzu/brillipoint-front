import type { AgendaEntry, YMD } from "../types";
import type { CreateOption, CreateOptionsPolicy } from "../utils/createOptions";
import { entryInterval } from "../utils/agendaAvailability";
import {
  rollingWeek,
  weekStart,
  isWeekendAgendaDay,
} from "../utils/businessDate";
import { WEEKDAYS } from "../utils/agendaPresentation";
import { AgendaEntryContent } from "./AgendaEntryCard";
import { DayTimeline } from "./DayTimeline";

interface Props {
  entries: Record<YMD, AgendaEntry[]>;
  selectedDate: YMD;
  weekendsOnly?: boolean;
  onDateSelect: (date: YMD) => void;
  onEventSelect?: (entry: AgendaEntry) => void;
  getCreateOptions?: CreateOptionsPolicy;
  onCreateRequest?: (option: CreateOption) => void;
}

const title = (date: YMD): string => {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return `${WEEKDAYS[(day + 6) % 7]} ${Number(date.slice(8))}`;
};

export const MobileAgenda = ({
  entries,
  selectedDate,
  weekendsOnly = false,
  onDateSelect,
  onEventSelect,
  getCreateOptions,
  onCreateRequest,
}: Props) => {
  const dates = rollingWeek(weekStart(selectedDate)).filter(
    (date) => !weekendsOnly || isWeekendAgendaDay(date)
  );

  return (
    <section className="agenda-mobile" aria-label="Disponibilidad móvil">
      <h2>Disponibilidad</h2>
      {dates.map((date) => {
        const dayEntries = entries[date] ?? [];

        return (
          <article key={date}>
            <button
              type="button"
              className="agenda-mobile-day"
              aria-pressed={date === selectedDate}
              onClick={() => onDateSelect(date)}
            >
              <strong>{title(date)}</strong>
            </button>
            <DayTimeline
              date={date}
              entries={entries}
              density="full"
              getCreateOptions={getCreateOptions}
              onCreateRequest={onCreateRequest}
            />
            {dayEntries.map((entry) =>
              onEventSelect ? (
                <button
                  type="button"
                  key={entry.key}
                  className="agenda-mobile-event"
                  onClick={() => onEventSelect(entry)}
                >
                  <AgendaEntryContent entry={entry} date={date} />
                  {entryInterval(date, entry) ? <small>Ocupado</small> : null}
                </button>
              ) : (
                <div key={entry.key} className="agenda-mobile-event">
                  <AgendaEntryContent entry={entry} date={date} />
                  {entryInterval(date, entry) ? <small>Ocupado</small> : null}
                </div>
              )
            )}
          </article>
        );
      })}
    </section>
  );
};
