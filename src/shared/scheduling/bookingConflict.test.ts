import { describe, expect, it } from "vitest";
import { AxiosError } from "axios";
import { bookingConflictMessage } from "./bookingConflict";

const make409 = (data?: unknown) =>
  new AxiosError(
    "Request failed with status code 409",
    "ERR_BAD_REQUEST",
    undefined,
    undefined,
    {
      status: 409,
      statusText: "Conflict",
      headers: {},
      config: {} as never,
      data,
    } as never
  );

const make500 = (data?: unknown) =>
  new AxiosError(
    "Request failed with status code 500",
    "ERR_BAD_RESPONSE",
    undefined,
    undefined,
    {
      status: 500,
      statusText: "Internal Server Error",
      headers: {},
      config: {} as never,
      data,
    } as never
  );

describe("bookingConflictMessage", () => {
  it("names the conflicting booking when the 409 body carries full details", () => {
    const message = bookingConflictMessage(
      make409({
        conflict: {
          id: 12,
          title: "Boda Ana",
          serviceStartsAt: "2026-09-19T18:00:00.000Z",
          serviceEndsAt: "2026-09-20T02:00:00.000Z",
        },
      })
    );
    expect(message).toContain("Boda Ana");
    expect(message).not.toContain("status code");
  });

  it("falls back to a Spanish message without throwing when the 409 body is missing", () => {
    expect(() => bookingConflictMessage(make409(undefined))).not.toThrow();
    expect(typeof bookingConflictMessage(make409(undefined))).toBe("string");
  });

  it("falls back to a Spanish message without throwing when the 409 body is an unexpected shape", () => {
    expect(() =>
      bookingConflictMessage(
        make409({ code: "SLOT_ALREADY_USED", message: "slot is already used by another contract" })
      )
    ).not.toThrow();
    expect(() => bookingConflictMessage(make409("not an object"))).not.toThrow();
    expect(() => bookingConflictMessage(make409(42))).not.toThrow();
  });

  it("returns null for a non-409 axios failure", () => {
    expect(bookingConflictMessage(make500())).toBeNull();
  });

  it("returns null for a non-axios failure", () => {
    expect(bookingConflictMessage(new Error("network down"))).toBeNull();
  });
});
