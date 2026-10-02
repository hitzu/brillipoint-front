import { parseLocalDate } from "../../../Common/dates";
import { formatDate } from "../i18n/translate";
import type { Locale } from "../theme/resolveThemeText";

/**
 * Formats an event date for the fiesta hero as two-digit parts joined by dots,
 * in the guest's order: `DD.MM.YYYY` (es) or `MM.DD.YYYY` (en).
 */
export const formatOverviewDate = (locale: Locale, rawDate?: string) => {
  if (!rawDate) return "";

  const date = parseLocalDate(rawDate);
  if (Number.isNaN(date.getTime())) return rawDate;

  return formatDate(locale, date, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).replace(/\D+/g, ".");
};
