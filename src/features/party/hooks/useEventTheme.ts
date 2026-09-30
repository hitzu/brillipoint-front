import { useEffect, useState } from "react";
import { getEventTheme } from "../../../api/services/partyPublicService";
import {
  EventThemeState,
  initialEventThemeState,
  resolveEventThemeState,
} from "./eventThemeState";

/**
 * Loads the backend-resolved theme for one event token.
 *
 * Renders `systemDefaultEventTheme` (neutral, never pink) before the
 * response arrives and keeps it on any error (network, 5xx, 404) — the
 * frontend never invents a fallback theme of its own.
 *
 * Normal requests leave ETag/304 revalidation to the browser's HTTP cache.
 * Fresh-theme mode is an explicit opt-in passed from a ready public-page URL.
 */
export function useEventTheme(
  eventToken?: string | null,
  freshTheme = false,
): EventThemeState {
  const [state, setState] = useState<EventThemeState>(initialEventThemeState);

  useEffect(() => {
    if (!eventToken) {
      setState(initialEventThemeState);
      return;
    }

    let cancelled = false;
    // Reset to the neutral default while a new token's request is in
    // flight, so a token change never keeps rendering the previous event's
    // theme.
    setState(initialEventThemeState);

    getEventTheme(eventToken, freshTheme)
      .then((response) => {
        if (cancelled) return;
        setState(
          resolveEventThemeState({ ok: true, eventTheme: response.eventTheme }),
        );
      })
      .catch(() => {
        if (cancelled) return;
        setState(resolveEventThemeState({ ok: false }));
      });

    return () => {
      cancelled = true;
    };
  }, [eventToken, freshTheme]);

  return state;
}
