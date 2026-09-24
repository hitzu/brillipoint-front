import { describe, expect, it } from "vitest";
import {
  closestOptionValue,
  endTimeOptions,
  formatDuration,
  isNextDayEnd,
  isValidTime,
  nextDayDurationMinutes,
  startTimeOptions,
} from "../timeOptions";

describe("startTimeOptions", () => {
  it("lists every 30-minute mark from 00:00 through 23:30", () => {
    const options = startTimeOptions();
    expect(options).toHaveLength(48);
    expect(options[0]).toEqual({ value: "00:00", label: "00:00" });
    expect(options[1]).toEqual({ value: "00:30", label: "00:30" });
    expect(options[options.length - 1]).toEqual({
      value: "23:30",
      label: "23:30",
    });
  });
});

describe("formatDuration", () => {
  it("shows plain minutes under an hour", () => {
    expect(formatDuration(30)).toBe("30 min");
  });

  it("shows whole hours without a decimal", () => {
    expect(formatDuration(60)).toBe("1 h");
  });

  it("shows half hours with a Spanish decimal comma", () => {
    expect(formatDuration(90)).toBe("1,5 h");
  });

  it("shows a 14.5 hour span", () => {
    expect(formatDuration(870)).toBe("14,5 h");
  });

  it("shows a full day", () => {
    expect(formatDuration(24 * 60)).toBe("24 h");
  });
});

describe("endTimeOptions", () => {
  it("starts 30 minutes after the given start and labels duration relative to it", () => {
    const options = endTimeOptions("19:00");
    expect(options[0]).toEqual({ value: "19:30", label: "19:30 (30 min)" });
    expect(options[1]).toEqual({ value: "20:00", label: "20:00 (1 h)" });
    expect(options[2]).toEqual({ value: "20:30", label: "20:30 (1,5 h)" });
  });

  it("wraps past midnight and keeps labeling duration from start", () => {
    const options = endTimeOptions("19:00");
    const wrapped = options.find((option) => option.value === "09:30");
    expect(wrapped).toEqual({ value: "09:30", label: "09:30 (14,5 h)" });
  });

  it("spans exactly 24 hours as the last option", () => {
    const options = endTimeOptions("19:00");
    expect(options).toHaveLength(48);
    expect(options[options.length - 1]).toEqual({
      value: "19:00",
      label: "19:00 (24 h)",
    });
  });
});

describe("isNextDayEnd", () => {
  it("is false when end is strictly after start", () => {
    expect(isNextDayEnd("10:00", "12:00")).toBe(false);
  });

  it("is true when end is at or before start", () => {
    expect(isNextDayEnd("20:00", "04:00")).toBe(true);
    expect(isNextDayEnd("20:00", "20:00")).toBe(true);
  });
});

describe("nextDayDurationMinutes", () => {
  it("computes the wrapped duration in minutes", () => {
    expect(nextDayDurationMinutes("20:00", "04:00")).toBe(8 * 60);
  });

  it("treats an equal start/end as a full day", () => {
    expect(nextDayDurationMinutes("20:00", "20:00")).toBe(24 * 60);
  });
});

describe("closestOptionValue", () => {
  it("returns the exact match when present", () => {
    const options = endTimeOptions("19:00");
    expect(closestOptionValue(options, "20:00")).toBe("20:00");
  });

  it("returns the nearest option when off the 30-minute grid", () => {
    const options = endTimeOptions("19:00");
    expect(closestOptionValue(options, "20:05")).toBe("20:00");
    expect(closestOptionValue(options, "20:20")).toBe("20:30");
  });

  it("returns undefined for an invalid value", () => {
    const options = endTimeOptions("19:00");
    expect(closestOptionValue(options, "not-a-time")).toBeUndefined();
  });
});

describe("isValidTime", () => {
  it("accepts HH:mm within range", () => {
    expect(isValidTime("00:00")).toBe(true);
    expect(isValidTime("23:59")).toBe(true);
    expect(isValidTime("04:05")).toBe(true);
  });

  it("rejects malformed or out-of-range values", () => {
    expect(isValidTime("24:00")).toBe(false);
    expect(isValidTime("12:60")).toBe(false);
    expect(isValidTime("1:00")).toBe(false);
    expect(isValidTime("abc")).toBe(false);
    expect(isValidTime("")).toBe(false);
  });
});
