import type { YMD } from "../types";

export const MEXICO_CITY_UTC_OFFSET_HOURS = -6;
const pad = (value: number) => String(value).padStart(2, "0");
const parseYmd = (date: YMD) =>
  date.split("-").map(Number) as [number, number, number];

export const formatYMD = (year: number, month: number, day: number): YMD =>
  `${year}-${pad(month)}-${pad(day)}`;

export const addDays = (date: YMD, days: number): YMD => {
  const [year, month, day] = parseYmd(date);
  const value = new Date(Date.UTC(year, month - 1, day + days));
  return formatYMD(
    value.getUTCFullYear(),
    value.getUTCMonth() + 1,
    value.getUTCDate()
  );
};

export const toYMD = (instant: string | Date): YMD => {
  const timestamp =
    typeof instant === "string" ? Date.parse(instant) : instant.getTime();
  const value = new Date(
    timestamp + MEXICO_CITY_UTC_OFFSET_HOURS * 60 * 60 * 1000
  );
  return formatYMD(
    value.getUTCFullYear(),
    value.getUTCMonth() + 1,
    value.getUTCDate()
  );
};

export const weekStart = (date: YMD): YMD => {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  return addDays(date, weekday === 0 ? -6 : 1 - weekday);
};

export const rollingWeek = (start: YMD): YMD[] =>
  Array.from({ length: 7 }, (_, i) => addDays(start, i));
export const rangeDates = (start: YMD, endExclusive: YMD): YMD[] => {
  const dates: YMD[] = [];
  for (
    let current = start;
    current < endExclusive;
    current = addDays(current, 1)
  )
    dates.push(current);
  return dates;
};
export const isWeekendAgendaDay = (date: YMD): boolean => {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 5 || day === 6;
};
