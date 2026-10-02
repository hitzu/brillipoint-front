import { SessionResponse } from "../../../interfaces/eventGallery";
import { t } from "../i18n/translate";
import { DEFAULT_LOCALE, Locale } from "../theme/resolveThemeText";
import { SessionItem } from "../types/session";

const buildPhotoAlt = (locale: Locale, index: number, eventName?: string | null) =>
  t(locale, "misFotos.photoAlt", {
    number: index + 1,
    eventName: eventName || t(locale, "misFotos.fallbackEventName"),
  });

export const buildSessionItems = (
  session: SessionResponse,
  locale: Locale = DEFAULT_LOCALE,
): SessionItem[] => {
  const eventName = session?.event?.honoreesNames;
  const photos = Array.isArray(session?.photos) ? session.photos : [];

  return photos.map((photo, index) => ({
    type: "photo",
    // Coalesce, never a filter: fall back to the original when the
    // minimized variant hasn't been generated yet — the photo is never hidden.
    src: photo.minimizedUrl || photo.url,
    originalSrc: photo.url,
    alt: buildPhotoAlt(locale, index, eventName),
    index,
    photoPosition: photo.position,
  }));
};

/** Re-labels already-built items, e.g. after the guest switches language. */
export const localizeSessionItems = (
  items: SessionItem[],
  locale: Locale,
  eventName?: string | null,
): SessionItem[] =>
  items.map((item) => ({ ...item, alt: buildPhotoAlt(locale, item.index, eventName) }));

export const getPhotoItems = (items: SessionItem[]): SessionItem[] =>
  items.filter((item) => item.type === "photo");
