/**
 * The three blocks a contract is sold in.
 *
 * Bookings are the evolution of slots: slots carried two periods, bookings
 * carry these three, and contract creation picks one instead of typing exact
 * hours so nobody has to calculate times during a sale.
 *
 * Deliberately pure data — civil (Mexico City) wall-clock strings, no Date and
 * no timezone helper — so both the agenda and the expo contract form can import
 * it without either feature depending on the other.
 */
export type BookingBlockId = "am_block" | "pm_block" | "night_block";

export interface BookingBlock {
  id: BookingBlockId;
  label: string;
  /** Civil start, HH:mm. */
  startsAt: string;
  /** Civil end, HH:mm. */
  endsAt: string;
  /** True when `endsAt` falls on the next civil day. */
  endsNextDay: boolean;
}

export const BOOKING_BLOCKS: readonly BookingBlock[] = [
  {
    id: "am_block",
    label: "Mañana",
    startsAt: "04:00",
    endsAt: "12:00",
    endsNextDay: false,
  },
  {
    id: "pm_block",
    label: "Tarde",
    startsAt: "12:00",
    endsAt: "20:00",
    endsNextDay: false,
  },
  {
    id: "night_block",
    label: "Noche",
    startsAt: "20:00",
    endsAt: "04:00",
    endsNextDay: true,
  },
] as const;

export const blockById = (id: BookingBlockId): BookingBlock => {
  const block = BOOKING_BLOCKS.find((candidate) => candidate.id === id);
  if (!block) throw new Error(`Unknown booking block: ${id}`);
  return block;
};

/** "Mañana (04:00–12:00)" — the accessible name of a block button. */
export const blockLabel = (block: BookingBlock) =>
  `${block.label} (${block.startsAt}–${block.endsAt})`;
