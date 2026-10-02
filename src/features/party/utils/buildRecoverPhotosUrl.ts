import { parseLocalDate } from "../../../Common/dates";
import { formatDate, t } from "../i18n/translate";
import type { Locale } from "../theme/resolveThemeText";

interface RecoverPhotosRequest {
  /** WhatsApp number in any format; non-digits are dropped. */
  phone: string;
  eventName: string;
  /** Raw event date (`YYYY-MM-DD` or ISO); unparseable values are kept as-is. */
  eventDate: string;
}

const formatLongDate = (locale: Locale, rawDate: string) => {
  const date = parseLocalDate(rawDate);
  if (Number.isNaN(date.getTime())) return rawDate;
  return formatDate(locale, date, { day: "numeric", month: "long", year: "numeric" });
};

/** WhatsApp link with the guest's photo-recovery request prefilled in their language. */
export const buildRecoverPhotosUrl = (
  locale: Locale,
  { phone, eventName, eventDate }: RecoverPhotosRequest,
) => {
  const message = t(locale, "expired.recoverMessage", {
    eventName,
    date: formatLongDate(locale, eventDate),
  });
  return `https://wa.me/${phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(message)}`;
};
