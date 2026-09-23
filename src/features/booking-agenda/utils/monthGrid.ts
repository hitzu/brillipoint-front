import type { YMD } from "../types";
import { addDays, isWeekendAgendaDay, weekStart } from "./businessDate";

export interface MonthGridOptions {
  weekendsOnly?: boolean;
}

const monthOf = (date: YMD): string => date.slice(0, 7);

/** True when `date` falls in the same calendar month as `anchor`. */
export const isSameMonth = (date: YMD, anchor: YMD): boolean =>
  monthOf(date) === monthOf(anchor);

const firstOfMonth = (anchor: YMD): YMD => `${monthOf(anchor)}-01`;

const lastOfMonth = (anchor: YMD): YMD => {
  const [year, month] = anchor.split("-").map(Number);
  const nextMonthFirst =
    month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  return addDays(nextMonthFirst, -1);
};

/**
 * Mon-first weeks covering the anchor's month, from the week containing the
 * 1st to the week containing the last day. With `weekendsOnly`, each week
 * keeps only its Fri/Sat/Sun, and a week whose Fri/Sat/Sun all fall outside
 * the anchor month is dropped entirely.
 */
export const monthGridDates = (
  anchor: YMD,
  { weekendsOnly }: MonthGridOptions = {}
): YMD[][] => {
  const firstWeekStart = weekStart(firstOfMonth(anchor));
  const lastWeekStart = weekStart(lastOfMonth(anchor));

  const weeks: YMD[][] = [];
  for (
    let start = firstWeekStart;
    start <= lastWeekStart;
    start = addDays(start, 7)
  ) {
    const week = Array.from({ length: 7 }, (_, day) => addDays(start, day));
    if (!weekendsOnly) {
      weeks.push(week);
      continue;
    }

    const weekend = week.filter(isWeekendAgendaDay);
    if (weekend.every((date) => !isSameMonth(date, anchor))) continue;
    weeks.push(weekend);
  }

  return weeks;
};

/** First and last date actually rendered by the grid, both inclusive. */
export const monthRange = (
  anchor: YMD,
  opts: MonthGridOptions = {}
): { from: YMD; to: YMD } => {
  const grid = monthGridDates(anchor, opts);
  const flat = grid.flat();
  return { from: flat[0], to: flat.at(-1)! };
};

/**
 * Fetch range for the grid's data: one day past `monthRange`'s `to`, because
 * the last grid date's 04:00->04:00 timeline needs that next day's early
 * hours (see `dayTimeline.timelineSegments`).
 */
export const monthFetchRange = (
  anchor: YMD,
  opts: MonthGridOptions = {}
): { from: YMD; to: YMD } => {
  const { from, to } = monthRange(anchor, opts);
  return { from, to: addDays(to, 1) };
};

/**
 * Every (year, month) touched by an inclusive `[from, to]` civil-date range,
 * in chronological order with no duplicates. Feeds a caller — such as the
 * expo calendar — that needs to fetch month-keyed data for whatever a grid
 * actually renders, instead of guessing months from the selected date alone.
 */
export const monthsInRange = (
  from: YMD,
  to: YMD
): Array<{ year: number; month: number }> => {
  const months: Array<{ year: number; month: number }> = [];
  let year = Number(from.slice(0, 4));
  let month = Number(from.slice(5, 7));
  const endKey = to.slice(0, 7);

  // A YMD range is always non-decreasing, so walking forward one month at a
  // time can never revisit a month: no dedupe map needed.
  while (true) {
    months.push({ year, month });
    if (`${year}-${String(month).padStart(2, "0")}` === endKey) break;
    if (month === 12) {
      year += 1;
      month = 1;
    } else {
      month += 1;
    }
  }

  return months;
};
