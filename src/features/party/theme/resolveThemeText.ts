import { ThemeText, ThemeTemplateParams } from "../types/themeContract";
import { translate, TranslateParams } from "./translate";

export type Locale = "es" | "en";

/**
 * Single source of truth for the locale used across the party feature.
 * There is no i18n system in this codebase (see `ThemeI18nLookup` below) —
 * every caller that needs a `Locale` imports this constant instead of
 * hardcoding `"es"` in more than one place.
 */
export const DEFAULT_LOCALE: Locale = "es";

/**
 * Injected i18n lookup for the `{ key }` variant of `ThemeText`. There is no
 * i18n system in this codebase today (no next-i18next/react-i18next,
 * no dictionaries) — see odd/tasks/theme-brand-kits.md T3 decision gap.
 * Callers inject their own lookup once one exists; until then, omitting it
 * makes any `{ key }` ThemeText resolve to `null` (hidden), same as a
 * missing key.
 */
export type ThemeI18nLookup = (key: string) => string | undefined;

/**
 * Resolves a `ThemeText` to a display string for `locale`, interpolating
 * `{{placeholder}}` tokens with `params`. Returns `null` when nothing can
 * be resolved — the caller hides the corresponding UI, never substitutes a
 * fallback of its own.
 *
 * `fallback` on `ThemeText` is intentionally ignored: the backend already
 * applies it before this response reaches the frontend.
 */
export function resolveThemeText(
  themeText: ThemeText | null | undefined,
  locale: Locale,
  params: ThemeTemplateParams & TranslateParams = {},
  i18n?: ThemeI18nLookup,
): string | null {
  if (themeText === null || themeText === undefined) {
    return null;
  }

  if ("text" in themeText) {
    const other: Locale = locale === "es" ? "en" : "es";
    const raw = themeText.text[locale] || themeText.text[other];
    if (!raw) {
      return null;
    }
    return translate(raw, params);
  }

  const raw = i18n?.(themeText.key);
  if (!raw) {
    return null;
  }
  const mergedParams: TranslateParams = { ...params, ...themeText.params };
  return translate(raw, mergedParams);
}
