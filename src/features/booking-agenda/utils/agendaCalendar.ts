import type { EventInput } from "@fullcalendar/core";
import type { AgendaEntry, YMD } from "../types";
import { calendarCivilDateTime, entryIntervalsForDay } from "./agendaIntervals";
import { entryLabel } from "./agendaPresentation";

export interface AgendaCalendarEventProps {
  entry: AgendaEntry;
  date: YMD;
}

/**
 * Converts a FullCalendar `select` range back into Mexico civil coordinates.
 * FullCalendar's `start`/`end` are UTC `Date` objects whose UTC components
 * equal the civil ones (see the module comment above), so this reads the
 * `getUTC*` fields directly rather than the browser's local time.
 */
export const civilSelectionRange = (
  start: Date,
  end: Date
): { date: YMD; startsAt: string; endsAt: string } => {
  const pad = (value: number) => String(value).padStart(2, "0");
  const date = `${start.getUTCFullYear()}-${pad(start.getUTCMonth() + 1)}-${pad(
    start.getUTCDate()
  )}`;
  const startsAt = `${pad(start.getUTCHours())}:${pad(start.getUTCMinutes())}`;
  const endsAt = `${pad(end.getUTCHours())}:${pad(end.getUTCMinutes())}`;
  return { date, startsAt, endsAt };
};

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
