import type { AgendaEntry, YMD } from "../types";
import { dayAvailability, type TimeInterval } from "./agendaAvailability";
import { entryIntervalsForDay, formatIntervalTime } from "./agendaIntervals";
import { addDays } from "./businessDate";

/**
 * The operational window: 04:00 of `date` through 04:00 of the next day
 * (1440 minutes), matching the booking blocks. Segment `start`/`end` are
 * minutes from the window start; `startsAt`/`endsAt` are the civil "HH:mm"
 * labels for those same points.
 */
export const TIMELINE_WINDOW_START_MINUTES = 4 * 60;
export const TIMELINE_WINDOW_MINUTES = 24 * 60;
const NEXT_DAY_WINDOW_OFFSET =
  TIMELINE_WINDOW_MINUTES - TIMELINE_WINDOW_START_MINUTES;

export interface TimelineSegment {
  kind: "free" | "occupied";
  start: number;
  end: number;
  startsAt: string;
  endsAt: string;
  entries?: AgendaEntry[];
}

export interface TimelineTick {
  offset: number;
  label: string;
}

/** One tick every 4h across the window, "04:00" .. "00:00" .. "04:00". */
export const TIMELINE_TICKS: TimelineTick[] = [
  { offset: 0, label: "04:00" },
  { offset: 240, label: "08:00" },
  { offset: 480, label: "12:00" },
  { offset: 720, label: "16:00" },
  { offset: 960, label: "20:00" },
  { offset: 1200, label: "00:00" },
  { offset: 1440, label: "04:00" },
];

const windowLabel = (offset: number): string =>
  formatIntervalTime(
    (offset + TIMELINE_WINDOW_START_MINUTES) % TIMELINE_WINDOW_MINUTES
  );

/** Clips a same-day civil interval (00:00-24:00) to the window's today half. */
const clipToday = (interval: TimeInterval): TimeInterval | null => {
  const start = Math.max(interval.start, TIMELINE_WINDOW_START_MINUTES);
  const end = Math.min(interval.end, TIMELINE_WINDOW_MINUTES);
  return end > start
    ? {
        start: start - TIMELINE_WINDOW_START_MINUTES,
        end: end - TIMELINE_WINDOW_START_MINUTES,
      }
    : null;
};

/** Clips a next-day civil interval (00:00-24:00) to the window's early hours. */
const clipNextDay = (interval: TimeInterval): TimeInterval | null => {
  const start = Math.max(interval.start, 0);
  const end = Math.min(interval.end, TIMELINE_WINDOW_START_MINUTES);
  return end > start
    ? { start: start + NEXT_DAY_WINDOW_OFFSET, end: end + NEXT_DAY_WINDOW_OFFSET }
    : null;
};

const mergeIntervals = (intervals: TimeInterval[]): TimeInterval[] =>
  intervals
    .slice()
    .sort((left, right) => left.start - right.start || left.end - right.end)
    .reduce<TimeInterval[]>((merged, interval) => {
      const previous = merged.at(-1);
      if (!previous || interval.start > previous.end)
        return [...merged, { ...interval }];
      previous.end = Math.max(previous.end, interval.end);
      return merged;
    }, []);

/** Entries whose (clipped) interval overlaps the given window-offset range. */
const entriesOverlapping = (
  windowInterval: TimeInterval,
  date: YMD,
  entries: AgendaEntry[],
  clip: (interval: TimeInterval) => TimeInterval | null
): AgendaEntry[] =>
  entries.filter((entry) =>
    entryIntervalsForDay(date, entry).some((interval) => {
      const clipped = clip(interval);
      return (
        clipped !== null &&
        clipped.start < windowInterval.end &&
        windowInterval.start < clipped.end
      );
    })
  );

const freeSegment = (start: number, end: number): TimelineSegment => ({
  kind: "free",
  start,
  end,
  startsAt: windowLabel(start),
  endsAt: windowLabel(end),
});

const occupiedSegment = (
  start: number,
  end: number,
  entries: AgendaEntry[]
): TimelineSegment => ({
  kind: "occupied",
  start,
  end,
  startsAt: windowLabel(start),
  endsAt: windowLabel(end),
  entries,
});

/**
 * Ordered, contiguous, non-overlapping segments covering the whole
 * 04:00->04:00 window: today's occupancy (from 04:00 onward) plus the early
 * hours of the next day (before 04:00), merged and complemented with free
 * segments.
 */
export const timelineSegments = (
  date: YMD,
  entries: Record<YMD, AgendaEntry[]>
): TimelineSegment[] => {
  const nextDate = addDays(date, 1);
  const todaysEntries = entries[date] ?? [];
  const nextEntries = entries[nextDate] ?? [];

  const todayOccupied = dayAvailability(date, todaysEntries)
    .occupiedIntervals.map(clipToday)
    .filter((interval): interval is TimeInterval => interval !== null);
  const nextOccupied = dayAvailability(nextDate, nextEntries)
    .occupiedIntervals.map(clipNextDay)
    .filter((interval): interval is TimeInterval => interval !== null);

  const occupied = mergeIntervals([...todayOccupied, ...nextOccupied]);

  const segments: TimelineSegment[] = [];
  let cursor = 0;
  for (const interval of occupied) {
    if (cursor < interval.start) segments.push(freeSegment(cursor, interval.start));
    const contributingEntries = [
      ...entriesOverlapping(interval, date, todaysEntries, clipToday),
      ...entriesOverlapping(interval, nextDate, nextEntries, clipNextDay),
    ];
    segments.push(occupiedSegment(interval.start, interval.end, contributingEntries));
    cursor = Math.max(cursor, interval.end);
  }
  if (cursor < TIMELINE_WINDOW_MINUTES)
    segments.push(freeSegment(cursor, TIMELINE_WINDOW_MINUTES));

  return segments;
};

export const largestFreeGap = (
  segments: TimelineSegment[]
): TimelineSegment | null =>
  segments
    .filter((segment) => segment.kind === "free")
    .reduce<TimelineSegment | null>(
      (largest, segment) =>
        !largest || segment.end - segment.start > largest.end - largest.start
          ? segment
          : largest,
      null
    );

export const isFullyFree = (segments: TimelineSegment[]): boolean =>
  segments.length === 1 && segments[0].kind === "free";
