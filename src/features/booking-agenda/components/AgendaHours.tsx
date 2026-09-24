import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, {
  type DateClickArg,
} from "@fullcalendar/interaction";
import type {
  DateSelectArg,
  DayHeaderContentArg,
  EventClickArg,
} from "@fullcalendar/core";
import esLocale from "@fullcalendar/core/locales/es";
import type { AgendaEntry, YMD } from "../types";
import type { CreateOption } from "../utils/createOptions";
import {
  agendaEntriesToCalendarEvents,
  civilSelectionRange,
  type AgendaCalendarEventProps,
} from "../utils/agendaCalendar";
import { formatYMD, weekStart } from "../utils/businessDate";
import { WEEKDAYS } from "../utils/agendaPresentation";
import { AgendaEntryContent } from "./AgendaEntryCard";

interface Props {
  entries: Record<YMD, AgendaEntry[]>;
  selectedDate: YMD;
  weekendsOnly?: boolean;
  onDateSelect: (date: YMD) => void;
  onEventSelect?: (entry: AgendaEntry) => void;
  onCreateRequest?: (option: CreateOption) => void;
  /** Clicking a day-column's date header (T5): opens the create modal. */
  onDaySelect?: (date: YMD) => void;
}

/** The header cell's column date, from the calendar's own UTC timeZone. */
const headerYMD = (date: Date): YMD =>
  formatYMD(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());

export const AgendaHours = ({
  entries,
  selectedDate,
  weekendsOnly = false,
  onDateSelect,
  onEventSelect,
  onCreateRequest,
  onDaySelect,
}: Props) => {
  const hiddenDays = weekendsOnly ? [1, 2, 3, 4] : [];
  const calendarKey = `${weekStart(selectedDate)}:${weekendsOnly ? "weekend" : "all"}`;

  const onDateClick = (arg: DateClickArg) =>
    onDateSelect(arg.dateStr.slice(0, 10));
  const onEventClick = (arg: EventClickArg) => {
    const props = arg.event.extendedProps as AgendaCalendarEventProps;
    onEventSelect?.(props.entry);
  };
  const onSelect = (arg: DateSelectArg) => {
    const { date, startsAt, endsAt } = civilSelectionRange(
      arg.start,
      arg.end
    );
    onCreateRequest?.({ label: "Nuevo evento", date, startsAt, endsAt });
    arg.view.calendar.unselect();
  };

  return (
    <section className="agenda-hours" aria-label="Horarios semanales">
      <FullCalendar
        key={calendarKey}
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        initialDate={selectedDate}
        timeZone="UTC"
        locale={esLocale}
        firstDay={1}
        hiddenDays={hiddenDays}
        allDaySlot={false}
        height="auto"
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        slotDuration="01:00:00"
        slotLabelInterval="01:00:00"
        slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        // Short bookings (15–30 min) still need room for their label + time.
        eventMinHeight={36}
        nowIndicator
        events={agendaEntriesToCalendarEvents(entries)}
        eventClick={onEventSelect ? onEventClick : undefined}
        dateClick={onCreateRequest ? undefined : onDateClick}
        selectable={Boolean(onCreateRequest)}
        select={onCreateRequest ? onSelect : undefined}
        editable={false}
        dayHeaderContent={
          onDaySelect
            ? (arg: DayHeaderContentArg) => {
                const date = headerYMD(arg.date);
                const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
                return (
                  <button
                    type="button"
                    className="agenda-hours-day-header"
                    aria-label={`Nuevo evento el ${arg.text}`}
                    onClick={() => onDaySelect(date)}
                  >
                    <span className="agenda-hours-day-header__weekday">
                      {WEEKDAYS[(weekday + 6) % 7]}
                    </span>
                    <strong className="agenda-hours-day-header__number">
                      {Number(date.slice(8))}
                    </strong>
                  </button>
                );
              }
            : undefined
        }
        eventContent={(arg) => {
          const props = arg.event.extendedProps as AgendaCalendarEventProps;
          const isCompact =
            arg.event.start &&
            arg.event.end &&
            arg.event.end.getTime() - arg.event.start.getTime() <=
              120 * 60 * 1000;

          return (
            <div
              className={`agenda-calendar-entry${
                isCompact ? " agenda-calendar-entry--compact" : ""
              }`}
            >
              <AgendaEntryContent entry={props.entry} date={props.date} />
            </div>
          );
        }}
      />
    </section>
  );
};
