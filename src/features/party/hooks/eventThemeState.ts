import { EventTheme } from "../types/themeContract";
import { EventPageTheme } from "../types/eventPageTheme";
import { tokensToEventPageTheme } from "../utils/tokensToEventPageTheme";
import { systemDefaultEventTheme } from "../theme/systemDefaultTheme";

/**
 * - "default": neutral system default, no request has settled yet.
 * - "loaded": the backend's resolved theme for this event.
 * - "fallback": a request settled with an error; the neutral system default
 *   is kept (the frontend never invents a fallback theme of its own).
 */
export type EventThemeStatus = "default" | "loaded" | "fallback";

export interface EventThemeState {
  eventTheme: EventTheme;
  pageTheme: EventPageTheme;
  status: EventThemeStatus;
}

const toState = (
  eventTheme: EventTheme,
  status: EventThemeStatus,
): EventThemeState => ({
  eventTheme,
  pageTheme: tokensToEventPageTheme(eventTheme.tokens, eventTheme.images),
  status,
});

/** Render state before any theme request has settled — neutral, never pink. */
export const initialEventThemeState: EventThemeState = toState(
  systemDefaultEventTheme,
  "default",
);

export type EventThemeFetchOutcome =
  | { ok: true; eventTheme: EventTheme }
  | { ok: false };

/**
 * Pure reducer from a theme fetch outcome to render state — no I/O, no React.
 * Kept separate from `useEventTheme` so it stays unit-testable with the
 * node:test runner (src/features/party/** is excluded from vitest).
 *
 * On any error (network, 5xx, 404) it keeps the neutral system default with
 * status "fallback". A 404 here only happens for a token whose event does
 * not exist — the pages' own event/session fetch already renders its own
 * not-found state for that case, so no extra handling is needed here.
 */
export function resolveEventThemeState(
  outcome: EventThemeFetchOutcome,
): EventThemeState {
  if (outcome.ok) {
    return toState(outcome.eventTheme, "loaded");
  }
  return toState(systemDefaultEventTheme, "fallback");
}
