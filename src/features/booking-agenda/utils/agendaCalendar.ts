import type { EventInput } from "@fullcalendar/core";
import type { AgendaEntry, YMD } from "../types";
import { calendarCivilDateTime, entryIntervalsForDay } from "./agendaIntervals";
import { entryLabel } from "./agendaPresentation";

export interface AgendaCalendarEventProps {
  entry: AgendaEntry;
  date: YMD;
}

/**
 * FullCalendar runs in UTC so these offset-free values are stable across browser
 * timezones. They deliberately model Mexico City civil-day coordinates, not UTC
 * instants; `agendaIntervals` is the only instant-to-civil conversion boundary.
 */
export const agendaEntriesToCalendarEvents = (
  entries: Record<YMD, AgendaEntry[]>
): EventInput[] =>
  Object.entries(entries).flatMap(([date, dayEntries]) =>
    dayEntries.flatMap((entry) =>
      entryIntervalsForDay(date, entry).map((interval, index): EventInput => ({
        id: `${entry.key}:${date}:${index}`,
        title: entryLabel(entry),
        start: interval.allDay
          ? date
          : calendarCivilDateTime(date, interval.start),
        end: interval.allDay
          ? undefined
          : calendarCivilDateTime(date, interval.end),
        allDay: interval.allDay,
        classNames: ["agenda-event"],
        extendedProps: { entry, date },
      }))
    )
  );
