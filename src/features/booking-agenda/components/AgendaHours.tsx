import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, {
  type DateClickArg,
} from "@fullcalendar/interaction";
import type { EventClickArg } from "@fullcalendar/core";
import esLocale from "@fullcalendar/core/locales/es";
import type { AgendaEntry, YMD } from "../types";
import {
  agendaEntriesToCalendarEvents,
  type AgendaCalendarEventProps,
} from "../utils/agendaCalendar";
import { weekStart } from "../utils/businessDate";
import { AgendaEntryContent } from "./AgendaEntryCard";

interface Props {
  entries: Record<YMD, AgendaEntry[]>;
  selectedDate: YMD;
  weekendsOnly?: boolean;
  onDateSelect: (date: YMD) => void;
  onEventSelect?: (entry: AgendaEntry) => void;
}

export const AgendaHours = ({
  entries,
  selectedDate,
  weekendsOnly = false,
  onDateSelect,
  onEventSelect,
}: Props) => {
  const hiddenDays = weekendsOnly ? [1, 2, 3, 4] : [];
  const calendarKey = `${weekStart(selectedDate)}:${weekendsOnly ? "weekend" : "all"}`;

  const onDateClick = (arg: DateClickArg) =>
    onDateSelect(arg.dateStr.slice(0, 10));
  const onEventClick = (arg: EventClickArg) => {
    const props = arg.event.extendedProps as AgendaCalendarEventProps;
    onEventSelect?.(props.entry);
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
        slotLabelInterval="02:00:00"
        nowIndicator
        events={agendaEntriesToCalendarEvents(entries)}
        eventClick={onEventSelect ? onEventClick : undefined}
        dateClick={onDateClick}
        editable={false}
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
