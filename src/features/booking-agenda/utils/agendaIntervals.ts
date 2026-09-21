import type { AgendaBlock, AgendaEntry, YMD } from "../types";
import { addDays, toYMD } from "./businessDate";
import { businessTime } from "./agendaPresentation";

export interface CivilDayInterval {
  start: number;
  end: number;
  allDay: boolean;
}

const DAY_END = 24 * 60;
const blockBounds: Record<AgendaBlock, { start: number; end: number }> = {
  am_block: { start: 4 * 60, end: 12 * 60 },
  pm_block: { start: 12 * 60, end: 20 * 60 },
  night_block: { start: 20 * 60, end: DAY_END },
};

const toMinutes = (value: string): number => {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
};

const uniqueIntervals = (intervals: CivilDayInterval[]): CivilDayInterval[] =>
  intervals
    .filter((interval) => interval.end > interval.start)
    .sort((left, right) => left.start - right.start || left.end - right.end)
    .filter(
      (interval, index, values) =>
        index === 0 ||
        interval.start !== values[index - 1].start ||
        interval.end !== values[index - 1].end
    );

const exactIntervalForDay = (
  date: YMD,
  entry: AgendaEntry
): CivilDayInterval[] => {
  if (!entry.startsAt || !entry.endsAt) return [];

  const startsOn = toYMD(entry.startsAt);
  const endsOn = toYMD(entry.endsAt);
  if (startsOn > date || endsOn < date) return [];

  const start = startsOn < date ? 0 : toMinutes(businessTime(entry.startsAt));
  const end = endsOn > date ? DAY_END : toMinutes(businessTime(entry.endsAt));
  return end > start ? [{ start, end, allDay: false }] : [];
};

const blockIntervalsForDay = (
  date: YMD,
  entry: AgendaEntry
): CivilDayInterval[] => {
  if (!entry.blocks.length) return [];

  const intervals = entry.blocks.flatMap((block) => {
    if (date === entry.date) return [{ ...blockBounds[block], allDay: false }];
    if (block === "night_block" && date === addDays(entry.date, 1)) {
      return [{ start: 0, end: 4 * 60, allDay: false }];
    }
    return [];
  });

  return uniqueIntervals(intervals);
};

/**
 * The sole conversion from a booking DTO into 00:00–24:00 Mexico City civil-day
 * intervals. Exact timestamps take precedence; block selections remain separate
 * intervals so a free middle period cannot be shown as occupied.
 */
export const entryIntervalsForDay = (
  date: YMD,
  entry: AgendaEntry
): CivilDayInterval[] => {
  const exactIntervals = exactIntervalForDay(date, entry);
  if (exactIntervals.length) return exactIntervals;

  const blockIntervals = blockIntervalsForDay(date, entry);
  if (blockIntervals.length) return blockIntervals;

  if (!entry.startsAt && !entry.endsAt && !entry.blocks.length) {
    const appliesOnPreviousDay =
      entry.continuesFromPreviousDay && date === addDays(entry.date, -1);
    const appliesOnNextDay =
      entry.continuesNextDay && date === addDays(entry.date, 1);
    if (date === entry.date || appliesOnPreviousDay || appliesOnNextDay) {
      return [{ start: 0, end: DAY_END, allDay: true }];
    }
  }

  return [];
};

/** Every day that can contain a visible part of one entry. */
export const entryDates = (entry: AgendaEntry): YMD[] => {
  if (entry.startsAt && entry.endsAt) {
    const dates: YMD[] = [];
    for (
      let date = toYMD(entry.startsAt);
      date <= toYMD(entry.endsAt);
      date = addDays(date, 1)
    ) {
      if (exactIntervalForDay(date, entry).length) dates.push(date);
    }
    return dates;
  }

  const dates = [entry.date];
  if (entry.blocks.includes("night_block") || entry.continuesNextDay)
    dates.push(addDays(entry.date, 1));
  if (entry.continuesFromPreviousDay) dates.push(addDays(entry.date, -1));
  return Array.from(new Set(dates));
};

export const formatIntervalTime = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** A FullCalendar UTC timestamp intentionally represents a Mexico civil time. */
export const calendarCivilDateTime = (date: YMD, minutes: number): string => {
  const targetDate = minutes === DAY_END ? addDays(date, 1) : date;
  const time = minutes === DAY_END ? "00:00" : formatIntervalTime(minutes);
  return `${targetDate}T${time}:00`;
};
