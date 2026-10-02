import { useMemo } from "react";
import { EventTheme, ThemeTemplateParams } from "../types/themeContract";
import { TranslateParams } from "../theme/translate";
import {
  buildSocialCtaViewModel,
  SocialCtaViewModel,
} from "../theme/buildSocialCtaViewModel";
import { useT } from "../i18n/LocaleProvider";

/**
 * Container hook: reads the backend-resolved `eventTheme` (from
 * `useEventTheme`) and builds the ready-to-render `SocialCtaViewModel` for
 * the `SocialCta` presentational component, or `null` to hide the whole
 * block. Pages call this once and thread the resulting view model down as a
 * plain prop through `Overview`/`Carousel`/`EventExpiredPage`, matching the
 * existing `theme`/`EventPageTheme` prop-drilling convention. Texts resolve
 * in the guest's locale (`LocaleProvider`), and `{ key }` texts resolve
 * against the party dictionary through `themeI18n`.
 */
export function useSocialCtaViewModel(
  eventTheme: EventTheme,
): SocialCtaViewModel | null {
  const { locale, themeI18n } = useT();

  return useMemo(
    () =>
      buildSocialCtaViewModel(
        eventTheme.socialCta,
        locale,
        // `ThemeTemplateParams` (the response's own type, no index
        // signature) is structurally a valid `TranslateParams` at runtime
        // (its 2 fields are `string | undefined`) but TS won't infer that
        // through a named-type variable — safe, narrow cast.
        eventTheme.params as (ThemeTemplateParams & TranslateParams) | undefined,
        themeI18n,
      ),
    [eventTheme.socialCta, eventTheme.params, locale, themeI18n],
  );
}
