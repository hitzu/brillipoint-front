import {
  blockById,
  type BookingBlockId,
} from "../../../shared/scheduling/bookingBlocks";
import type { ExactBookingPayload, YMD } from "../types";
import { fromMexicoCityDateTimeInput } from "./mexicoCityTime";

const addCivilDays = (date: YMD, days: number): YMD => {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

type BlockBookingExtras = Omit<
  ExactBookingPayload,
  "scheduleType" | "eventDate" | "serviceStartsAt" | "serviceEndsAt"
>;

/**
 * Turns "this day, this block" into the exact payload the API stores.
 *
 * Blocks are how a contract is sold — nobody types hours during a sale — but
 * the API only knows instants, so the translation happens here, once, from the
 * single block definition in `shared/scheduling`.
 *
 * `eventDate` stays the civil day the block starts on, even for the night
 * block that ends on the next one.
 */
export const bookingPayloadForBlock = (
  eventDate: YMD,
  blockId: BookingBlockId,
  extras: BlockBookingExtras = {}
): ExactBookingPayload => {
  const block = blockById(blockId);
  return {
    scheduleType: "exact",
    eventDate,
    serviceStartsAt: fromMexicoCityDateTimeInput(
      `${eventDate}T${block.startsAt}`
    ),
    serviceEndsAt: fromMexicoCityDateTimeInput(
      `${addCivilDays(eventDate, block.endsNextDay ? 1 : 0)}T${block.endsAt}`
    ),
    ...extras,
  };
};
