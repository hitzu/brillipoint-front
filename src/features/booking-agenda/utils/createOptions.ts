import {
  BOOKING_BLOCKS,
  type BookingBlockId,
} from "../../../shared/scheduling/bookingBlocks";
import type { AgendaEntry, YMD } from "../types";
import { blockAvailability } from "./blockAvailability";
import { timelineSegments } from "./dayTimeline";

export interface CreateOption {
  label: string;
  date: YMD;
  startsAt: string;
  endsAt: string;
  blockId?: BookingBlockId;
}

export type CreateOptionsPolicy = (
  date: YMD,
  entries: Record<YMD, AgendaEntry[]>
) => CreateOption[];

/** Expo policy: one option per block that is fully free, in block order. */
export const blockCreateOptions: CreateOptionsPolicy = (date, entries) => {
  const availability = blockAvailability(date, entries);
  return BOOKING_BLOCKS.filter((block) => availability[block.id]).map(
    (block) => ({
      label: block.label,
      date,
      startsAt: block.startsAt,
      endsAt: block.endsAt,
      blockId: block.id,
    })
  );
};

/** Agenda policy: one option per exact free segment on the day timeline. */
export const exactCreateOptions: CreateOptionsPolicy = (date, entries) =>
  timelineSegments(date, entries)
    .filter((segment) => segment.kind === "free")
    .map((segment) => ({
      label: `Libre ${segment.startsAt}–${segment.endsAt}`,
      date,
      startsAt: segment.startsAt,
      endsAt: segment.endsAt,
    }));
