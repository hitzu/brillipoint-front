import type { AgendaEntry, YMD } from "../types";
import { entryIntervalsForDay, formatIntervalTime } from "./agendaIntervals";

export interface TimeInterval {
  start: number;
  end: number;
}

export interface DayAvailability {
  occupiedIntervals: TimeInterval[];
  freeIntervals: TimeInterval[];
}

const DAY_END = 24 * 60;

export const entryInterval = (
  date: YMD,
  entry: AgendaEntry
): TimeInterval | null => {
  const intervals = entryIntervalsForDay(date, entry);
  if (!intervals.length) return null;
  return { start: intervals[0].start, end: intervals.at(-1)!.end };
};

const merge = (intervals: TimeInterval[]): TimeInterval[] =>
  intervals
    .sort((left, right) => left.start - right.start || left.end - right.end)
    .reduce<TimeInterval[]>((merged, interval) => {
      const previous = merged.at(-1);
      if (!previous || interval.start > previous.end)
        return [...merged, { ...interval }];
      previous.end = Math.max(previous.end, interval.end);
      return merged;
    }, []);

export const dayAvailability = (
  date: YMD,
  entries: AgendaEntry[]
): DayAvailability => {
  const occupiedIntervals = merge(
    entries.flatMap((entry) =>
      entryIntervalsForDay(date, entry).map(({ start, end }) => ({
        start,
        end,
      }))
    )
  );
  const freeIntervals: TimeInterval[] = [];
  let cursor = 0;

  for (const interval of occupiedIntervals) {
    if (cursor < interval.start)
      freeIntervals.push({ start: cursor, end: interval.start });
    cursor = Math.max(cursor, interval.end);
  }
  if (cursor < DAY_END) freeIntervals.push({ start: cursor, end: DAY_END });

  return { occupiedIntervals, freeIntervals };
};

export const formatTime = formatIntervalTime;
