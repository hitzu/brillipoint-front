/* Calendar helpers for the weekend (Fri/Sat/Sun) availability grid. */

import type { BookingBlockId } from "@shared/scheduling/bookingBlocks";

export const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

export const toYMD = (year: number, month: number, day: number) => {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
};

export type SwipeDir = "prev" | "next" | null;
// A contract is sold in one of the three shared booking blocks — this is an
// alias, not a separate vocabulary, so there is one source of truth.
export type ContractPeriod = BookingBlockId;

export function detectSwipe(deltaX: number, threshold = 50): SwipeDir {
  if (deltaX > threshold) return "prev";
  if (deltaX < -threshold) return "next";
  return null;
}

export function stepMonth(
  year: number,
  monthIdx: number,
  direction: "prev" | "next",
  minYear: number,
  maxYear: number,
) {
  if (direction === "prev") {
    if (monthIdx === 0) {
      const prevYear = year - 1;
      if (prevYear < minYear) return null;
      return { year: prevYear, monthIdx: 11 };
    }

    return { year, monthIdx: monthIdx - 1 };
  }

  if (monthIdx === 11) {
    const nextYear = year + 1;
    if (nextYear > maxYear) return null;
    return { year: nextYear, monthIdx: 0 };
  }

  return { year, monthIdx: monthIdx + 1 };
}

export type WeekendRow = {
  key: number;
  fri?: number;
  sat?: number;
  sun?: number;
};

export function buildWeekendRows(year: number, monthIdx: number): WeekendRow[] {
  type WeekendKey = 5 | 6 | 0;

  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const byWeek = new Map<number, WeekendRow>();

  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, monthIdx, d).getDay() as WeekendKey;
    if (dow !== 5 && dow !== 6 && dow !== 0) continue;

    // Use monday-week number as key
    const diff = (dow + 6) % 7;
    const mondayDay = d - diff;
    const row: WeekendRow = byWeek.get(mondayDay) ?? { key: mondayDay };
    if (dow === 5) row.fri = d;
    if (dow === 6) row.sat = d;
    if (dow === 0) row.sun = d;
    byWeek.set(mondayDay, row);
  }

  return Array.from(byWeek.values()).sort((a, b) => a.key - b.key);
}
