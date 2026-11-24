import { hasBrillipointSession } from "../../../lib/brillipointSession";
import {
  sendReservationEvent,
  type ReservationEventPayload,
} from "../../../api/services/reservationAnalyticsService";

export const RESERVATION_ACTIONS = {
  VIEWED: "reservation_viewed",
  SECTION_VIEWED: "reservation_section_viewed",
  SECTION_LEFT: "reservation_section_left",
  BLOCK_VIEWED: "reservation_block_viewed",
  RECEIPT_OPENED: "reservation_receipt_opened",
  PREP_ANSWERED: "reservation_prep_answered",
  TATTOO_UPLOADED: "reservation_tattoo_uploaded",
  TATTOO_SELECTED: "reservation_tattoo_selected",
} as const;

export type EntryType = "navigate" | "reload" | "back_forward" | "resume";

export type TermsProgress = {
  maxScrollPct: number;
  reachedEnd: boolean;
  wordCount: number;
};

const VISITOR_ID_KEY = "bs_visitor_id";

/** Anonymous per-browser id: tells "same person came back" from "someone else opened the link". */
export const getVisitorId = (): string => {
  const fresh = () => globalThis.crypto.randomUUID();
  try {
    const stored = window.localStorage.getItem(VISITOR_ID_KEY);
    if (stored) return stored;
    const id = fresh();
    window.localStorage.setItem(VISITOR_ID_KEY, id);
    return id;
  } catch {
    return fresh();
  }
};

export const readEntryType = (): Exclude<EntryType, "resume"> => {
  const nav = performance.getEntriesByType("navigation")[0] as
    | { type?: string }
    | undefined;
  return nav?.type === "reload" || nav?.type === "back_forward"
    ? nav.type
    : "navigate";
};

export const countWords = (html: string): number =>
  html
    .replace(/<[^>]*>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;

/** Whole days from `from` to a YMD/ISO date; null when the date is unknown. */
export const daysUntil = (
  date: string | null | undefined,
  from: Date = new Date(),
): number | null => {
  const m = date?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const target = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
};

type Send = (
  payload: ReservationEventPayload,
  options: { keepalive: boolean },
) => void;

type TrackerOptions = {
  token: string;
  visitorId: string;
  entry: Exclude<EntryType, "resume">;
  hasPayments: boolean;
  daysToEvent: number | null;
  now?: () => number;
  send?: Send;
};

/**
 * Raw reservation-page events. It never groups visits: the thresholds (what
 * counts as a visit, as "read") live in the SQL queries.
 */
export class ReservationTracker {
  private readonly sessionId = globalThis.crypto.randomUUID();
  private readonly now: () => number;
  private readonly send: Send;
  private readonly seenBlocks = new Set<string>();
  private currentSection: string | null = null;
  private visibleSince = 0;
  private hidden = false;
  private hiddenAt = 0;
  private termsProgress: TermsProgress | null = null;

  constructor(private readonly opts: TrackerOptions) {
    this.now = opts.now ?? (() => Date.now());
    this.send =
      opts.send ??
      ((payload, o) => sendReservationEvent(opts.token, payload, o));
  }

  start(initialSection: string): void {
    this.emitViewed({ entry: this.opts.entry });
    this.openSection(initialSection, "landing");
  }

  selectSection(id: string): void {
    if (this.hidden || id === this.currentSection) return;
    this.closeSection(false);
    this.openSection(id, "click");
  }

  pageHidden(): void {
    if (this.hidden || this.currentSection === null) return;
    this.closeSection(true);
    this.hidden = true;
    this.hiddenAt = this.now();
  }

  pageVisible(): void {
    if (!this.hidden) return;
    const hiddenMs = this.now() - this.hiddenAt;
    this.hidden = false;
    this.emitViewed({ entry: "resume", hiddenMs });
    if (this.currentSection) this.openSection(this.currentSection, "resume");
  }

  stop(): void {
    if (!this.hidden) this.closeSection(true);
    this.currentSection = null;
  }

  blockViewed(id: string): void {
    if (this.seenBlocks.has(id)) return;
    this.seenBlocks.add(id);
    this.emit(RESERVATION_ACTIONS.BLOCK_VIEWED, id);
  }

  trackAction(action: string, surface?: string): void {
    this.emit(action, surface);
  }

  setTermsProgress(progress: TermsProgress): void {
    this.termsProgress = progress;
  }

  private emitViewed(extra: { entry: EntryType; hiddenMs?: number }): void {
    this.emit(RESERVATION_ACTIONS.VIEWED, undefined, {
      ...extra,
      visitorId: this.opts.visitorId,
      hasPayments: this.opts.hasPayments,
      daysToEvent: this.opts.daysToEvent,
    });
  }

  private openSection(id: string, trigger: "landing" | "click" | "resume") {
    this.currentSection = id;
    this.visibleSince = this.now();
    this.emit(RESERVATION_ACTIONS.SECTION_VIEWED, id, { trigger });
  }

  private closeSection(keepalive: boolean): void {
    if (this.currentSection === null) return;
    const metadata: Record<string, unknown> = {
      visibleMs: this.now() - this.visibleSince,
    };
    if (this.currentSection === "terms" && this.termsProgress) {
      Object.assign(metadata, this.termsProgress);
    }
    this.emit(
      RESERVATION_ACTIONS.SECTION_LEFT,
      this.currentSection,
      metadata,
      keepalive,
    );
  }

  private emit(
    action: string,
    surface?: string,
    metadata?: Record<string, unknown>,
    keepalive = false,
  ): void {
    if (hasBrillipointSession()) return;
    this.send(
      {
        action,
        sessionId: this.sessionId,
        ...(surface ? { surface } : {}),
        ...(metadata ? { metadata } : {}),
      },
      { keepalive },
    );
  }
}

let activeTracker: ReservationTracker | null = null;

export const setActiveReservationTracker = (t: ReservationTracker | null) => {
  activeTracker = t;
};

/** No-op when the reservation page has no tracker (tests, other pages). */
export const trackReservationAction = (action: string, surface?: string) =>
  activeTracker?.trackAction(action, surface);

export const reportReservationBlockViewed = (id: string) =>
  activeTracker?.blockViewed(id);

export const reportTermsProgress = (progress: TermsProgress) =>
  activeTracker?.setTermsProgress(progress);
