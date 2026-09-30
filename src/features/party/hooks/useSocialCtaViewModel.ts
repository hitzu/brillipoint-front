import { useMemo } from "react";
import { EventTheme, ThemeTemplateParams } from "../types/themeContract";
import { DEFAULT_LOCALE } from "../theme/resolveThemeText";
import { TranslateParams } from "../theme/translate";
import {
  buildSocialCtaViewModel,
  SocialCtaViewModel,
} from "../theme/buildSocialCtaViewModel";

/**
 * Container hook: reads the backend-resolved `eventTheme` (from
 * `useEventTheme`) and builds the ready-to-render `SocialCtaViewModel` for
 * the `SocialCta` presentational component, or `null` to hide the whole
 * block. Pages call this once and thread the resulting view model down as a
 * plain prop through `Overview`/`Carousel`/`EventExpiredPage`, matching the
 * existing `theme`/`EventPageTheme` prop-drilling convention — no context
 * provider, no i18n lookup wired yet (see `theme/resolveThemeText.ts`).
 */
export function useSocialCtaViewModel(
  eventTheme: EventTheme,
): SocialCtaViewModel | null {
  return useMemo(
    () =>
      buildSocialCtaViewModel(
        eventTheme.socialCta,
        DEFAULT_LOCALE,
        // `ThemeTemplateParams` (the response's own type, no index
        // signature) is structurally a valid `TranslateParams` at runtime
        // (its 2 fields are `string | undefined`) but TS won't infer that
        // through a named-type variable — safe, narrow cast.
        eventTheme.params as (ThemeTemplateParams & TranslateParams) | undefined,
      ),
    [eventTheme.socialCta, eventTheme.params],
  );
}
