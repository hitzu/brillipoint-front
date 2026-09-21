import { describe, expect, it } from "vitest";
import {
  BOOKING_BLOCKS,
  blockById,
  type BookingBlockId,
} from "./bookingBlocks";

describe("booking blocks", () => {
  it("defines the three contract-creation blocks in day order", () => {
    expect(BOOKING_BLOCKS.map((block) => block.id)).toEqual([
      "am_block",
      "pm_block",
      "night_block",
    ]);
  });

  it("covers the whole day in eight-hour ranges with no gap and no overlap", () => {
    const minutes = (value: string) => {
      const [h, m] = value.split(":").map(Number);
      return h * 60 + m;
    };
    for (const block of BOOKING_BLOCKS) {
      const span =
        (minutes(block.endsAt) +
          (block.endsNextDay ? 24 * 60 : 0) -
          minutes(block.startsAt) +
          24 * 60) %
          (24 * 60) || 24 * 60;
      expect(span).toBe(8 * 60);
    }
    // Each block hands off to the next one with no dead time between them.
    BOOKING_BLOCKS.forEach((block, index) => {
      const next = BOOKING_BLOCKS[(index + 1) % BOOKING_BLOCKS.length];
      expect(block.endsAt).toBe(next.startsAt);
    });
  });

  it("marks only the block that crosses midnight", () => {
    expect(BOOKING_BLOCKS.filter((block) => block.endsNextDay)).toHaveLength(1);
    expect(blockById("night_block").endsNextDay).toBe(true);
    expect(blockById("am_block").endsNextDay).toBe(false);
  });

  it("carries the booking vocabulary, which expo adopts", () => {
    expect(BOOKING_BLOCKS.map((block) => block.label)).toEqual([
      "Mañana",
      "Tarde",
      "Noche",
    ]);
  });

  it("looks a block up by id", () => {
    const id: BookingBlockId = "pm_block";
    expect(blockById(id)).toMatchObject({ startsAt: "12:00", endsAt: "20:00" });
  });
});
