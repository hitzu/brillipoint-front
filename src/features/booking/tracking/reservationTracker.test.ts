// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ReservationTracker,
  countWords,
  daysUntil,
  readEntryType,
} from "./reservationTracker";

type Sent = { action: string; surface?: string; metadata?: Record<string, unknown>; keepalive: boolean };

const setup = (overrides: Partial<ConstructorParameters<typeof ReservationTracker>[0]> = {}) => {
  const sent: Sent[] = [];
  let now = 0;
  const tracker = new ReservationTracker({
    token: "tok",
    send: (p, o) => sent.push({ ...p, keepalive: o.keepalive }),
    now: () => now,
    visitorId: "visitor-1",
    entry: "navigate",
    hasPayments: false,
    daysToEvent: 40,
    ...overrides,
  });
  return { tracker, sent, advance: (ms: number) => (now += ms) };
};

describe("ReservationTracker", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("records the entry with its type and visit context on start", () => {
    const { tracker, sent } = setup({ entry: "reload", hasPayments: true });
    tracker.start("resume");
    expect(sent[0]).toMatchObject({
      action: "reservation_viewed",
      metadata: { entry: "reload", visitorId: "visitor-1", hasPayments: true, daysToEvent: 40 },
    });
  });

  it("records the landing tab as landing, not as a click", () => {
    const { tracker, sent } = setup();
    tracker.start("resume");
    expect(sent[1]).toMatchObject({
      action: "reservation_section_viewed",
      surface: "resume",
      metadata: { trigger: "landing" },
    });
  });

  it("closes the previous tab with its visible time and opens the next as click", () => {
    const { tracker, sent, advance } = setup();
    tracker.start("resume");
    advance(4000);
    tracker.selectSection("terms");
    expect(sent[2]).toMatchObject({
      action: "reservation_section_left",
      surface: "resume",
      metadata: { visibleMs: 4000 },
    });
    expect(sent[3]).toMatchObject({
      action: "reservation_section_viewed",
      surface: "terms",
      metadata: { trigger: "click" },
    });
  });

  it("adds scroll depth and word count when leaving terms", () => {
    const { tracker, sent, advance } = setup();
    tracker.start("terms");
    tracker.setTermsProgress({ maxScrollPct: 80, reachedEnd: false, wordCount: 1200 });
    advance(1000);
    tracker.selectSection("resume");
    const left = sent.find((s) => s.action === "reservation_section_left")!;
    expect(left.metadata).toMatchObject({ visibleMs: 1000, maxScrollPct: 80, reachedEnd: false, wordCount: 1200 });
  });

  it("does not count time while the page is hidden and flags the return as resume", () => {
    const { tracker, sent, advance } = setup();
    tracker.start("resume");
    advance(3000);
    tracker.pageHidden();
    advance(60_000);
    tracker.pageVisible();
    const left = sent.find((s) => s.action === "reservation_section_left")!;
    expect(left.metadata).toMatchObject({ visibleMs: 3000 });
    expect(left.keepalive).toBe(true);
    const resumed = sent.filter((s) => s.action === "reservation_viewed")[1];
    expect(resumed.metadata).toMatchObject({ entry: "resume", hiddenMs: 60_000, visitorId: "visitor-1" });
  });

  it("sends each Resumen block once per load", () => {
    const { tracker, sent } = setup();
    tracker.start("resume");
    tracker.blockViewed("finance");
    tracker.blockViewed("finance");
    expect(sent.filter((s) => s.action === "reservation_block_viewed")).toHaveLength(1);
  });

  it("sends nothing when the browser has a Brillipoint session", () => {
    localStorage.setItem("authToken", "jwt");
    const sent: unknown[] = [];
    const tracker = new ReservationTracker({
      token: "tok",
      send: (p) => sent.push(p),
      now: () => 0,
      visitorId: "v",
      entry: "navigate",
      hasPayments: false,
      daysToEvent: null,
    });
    tracker.start("resume");
    expect(sent).toHaveLength(0);
  });
});

describe("helpers", () => {
  it("counts words ignoring html tags", () => {
    expect(countWords("<p>uno dos</p><div>tres</div>")).toBe(3);
  });

  it("computes whole days until an event date, null when unknown", () => {
    const from = new Date("2026-11-23T12:00:00");
    expect(daysUntil("2026-12-03", from)).toBe(10);
    expect(daysUntil(null, from)).toBeNull();
  });

  it("reads the navigation entry type, defaulting to navigate", () => {
    vi.spyOn(performance, "getEntriesByType").mockReturnValue([{ type: "back_forward" }] as never);
    expect(readEntryType()).toBe("back_forward");
    vi.spyOn(performance, "getEntriesByType").mockReturnValue([] as never);
    expect(readEntryType()).toBe("navigate");
  });
});
