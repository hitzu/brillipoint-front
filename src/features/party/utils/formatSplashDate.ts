import { parseLocalDate } from "../../../Common/dates";
import { formatDate } from "../i18n/translate";
import type { Locale } from "../theme/resolveThemeText";

/**
 * Three-letter uppercase month for the splash date (e.g. "SEP" / "AUG").
 * `Intl` may return "sept." or similar, so dots/spaces are dropped and cut.
 */
const formatMonth = (locale: Locale, date: Date) =>
  formatDate(locale, date, { month: "short" })
    .replace(/[.\s]/g, "")
    .slice(0, 3)
    .toUpperCase();

/** Formats an event date as `DD · MON · YYYY` in the guest's language. */
export const formatSplashDate = (locale: Locale, rawDate?: string) => {
  if (!rawDate) return undefined;

  const date = parseLocalDate(rawDate);
  if (Number.isNaN(date.getTime())) return rawDate;

  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();

  return `${day} · ${formatMonth(locale, date)} · ${year}`;
};
