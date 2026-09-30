import { LocalizedText } from "../types/themeContract";
import { DEFAULT_LOCALE, Locale } from "./resolveThemeText";

/**
 * Resolves a theme image slot's `alt` (es/en pair) to a display string for
 * `locale`, falling back to the other locale when the requested one is
 * missing/empty (same es↔en fallback shape as `resolveThemeText`'s `{ text }`
 * variant). No interpolation applies here — image alt text has no
 * `{{placeholder}}` params in the contract.
 *
 * Absent `alt`, or both locales missing/empty, resolve to `""` (never
 * `null`) since an `<img alt>` must always be a string.
 */
export function resolveImageAlt(
  alt: LocalizedText | undefined,
  locale: Locale = DEFAULT_LOCALE,
): string {
  if (!alt) {
    return "";
  }

  const other: Locale = locale === "es" ? "en" : "es";
  return alt[locale] || alt[other] || "";
}
