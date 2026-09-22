import {
  BOOKING_BLOCKS,
  type BookingBlockId,
} from "../../../shared/scheduling/bookingBlocks";
import type { AgendaEntry, YMD } from "../types";
import { dayAvailability, type TimeInterval } from "./agendaAvailability";

const DAY_MINUTES = 24 * 60;

const toMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

const addCivilDays = (date: YMD, days: number): YMD => {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

/** Half-open overlap: a booking that merely touches a boundary does not count. */
const overlaps = (left: TimeInterval, right: TimeInterval) =>
  left.start < right.end && right.start < left.end;

const occupiedOn = (
  date: YMD,
  entries: Record<YMD, AgendaEntry[]>
): TimeInterval[] => dayAvailability(date, entries[date] ?? []).occupiedIntervals;

export type BlockAvailability = Record<BookingBlockId, boolean>;

/**
 * Which blocks can still be sold on a day.
 *
 * Binary on purpose. Selling a block promises its whole range, so a single
 * overlapping booking makes it undeliverable — not partly free. Showing a
 * fraction would hand the arithmetic back to the seller mid-sale, which is the
 * thing blocks exist to prevent.
 *
 * The night block runs past midnight, so it is checked against the next civil
 * day as well: a 01:00 booking on the 13th sits inside the night sold on
 * the 12th.
 */
export const blockAvailability = (
  date: YMD,
  entries: Record<YMD, AgendaEntry[]>
): BlockAvailability => {
  const today = occupiedOn(date, entries);
  const tomorrow = occupiedOn(addCivilDays(date, 1), entries);

  return BOOKING_BLOCKS.reduce((availability, block) => {
    const start = toMinutes(block.startsAt);
    const end = toMinutes(block.endsAt);

    const sameDay = { start, end: block.endsNextDay ? DAY_MINUTES : end };
    const taken =
      today.some((occupied) => overlaps(occupied, sameDay)) ||
      (block.endsNextDay &&
        tomorrow.some((occupied) => overlaps(occupied, { start: 0, end })));

    return { ...availability, [block.id]: !taken };
  }, {} as BlockAvailability);
};
