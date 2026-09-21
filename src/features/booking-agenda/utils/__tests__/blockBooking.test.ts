import { describe, expect, it } from "vitest";
import { bookingPayloadForBlock } from "../blockBooking";

describe("bookingPayloadForBlock", () => {
  it("turns a day-block pair into an exact payload in Mexico City civil time", () => {
    expect(bookingPayloadForBlock("2026-09-19", "pm_block")).toEqual({
      scheduleType: "exact",
      eventDate: "2026-09-19",
      serviceStartsAt: "2026-09-19T18:00:00.000Z",
      serviceEndsAt: "2026-09-20T02:00:00.000Z",
    });
  });

  it("keeps eventDate on the civil start day when the block crosses midnight", () => {
    const payload = bookingPayloadForBlock("2026-09-19", "night_block");
    // 20:00 Mexico City on the 19th is 02:00 UTC on the 20th; the block ends
    // eight hours later, but the booking is still displayed under the 19th.
    expect(payload.eventDate).toBe("2026-09-19");
    expect(payload.serviceStartsAt).toBe("2026-09-20T02:00:00.000Z");
    expect(payload.serviceEndsAt).toBe("2026-09-20T10:00:00.000Z");
  });

  it("spans exactly eight hours for every block", () => {
    for (const id of ["am_block", "pm_block", "night_block"] as const) {
      const payload = bookingPayloadForBlock("2026-09-19", id);
      const hours =
        (Date.parse(payload.serviceEndsAt) -
          Date.parse(payload.serviceStartsAt)) /
        3_600_000;
      expect(hours).toBe(8);
    }
  });

  it("carries optional metadata through untouched", () => {
    expect(
      bookingPayloadForBlock("2026-09-19", "am_block", {
        contractId: 7,
        purpose: "event",
        title: "Boda Ruiz",
      })
    ).toMatchObject({ contractId: 7, purpose: "event", title: "Boda Ruiz" });
  });
});
