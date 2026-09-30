import { RawThemeOverrides } from "./mergeThemeOverrides";

/** One read-only `themeOverrides` top-level key, pretty-printable as JSON. */
export interface ReadOnlyThemeEntry {
  key: string;
  value: unknown;
}

/**
 * Splits a raw `themeOverrides` object into the entries this editor does
 * NOT let staff edit yet: everything except `images.background` and
 * `decorations.confetti`, which have their own dedicated blocks.
 *
 * `images`/`decorations` still appear here (minus their editable slot) so
 * the remaining slots (logo, splashIcon, hero, watermark, cover, sparkles)
 * stay visible. Unknown top-level keys (e.g. `decorativeIcon`) pass through
 * untouched, one block per key, so future editable keys can plug in without
 * touching the rest of this list.
 */
export function getReadOnlyThemeEntries(
  themeOverrides: RawThemeOverrides | null | undefined,
): ReadOnlyThemeEntry[] {
  if (!themeOverrides) return [];

  const entries: ReadOnlyThemeEntry[] = [];

  for (const key of Object.keys(themeOverrides)) {
    const value = themeOverrides[key];

    if (key === "images" && value && typeof value === "object") {
      const { background: _background, ...rest } = value as Record<string, unknown>;
      if (Object.keys(rest).length > 0) {
        entries.push({ key, value: rest });
      }
      continue;
    }

    if (key === "decorations" && value && typeof value === "object") {
      const { confetti: _confetti, ...rest } = value as Record<string, unknown>;
      if (Object.keys(rest).length > 0) {
        entries.push({ key, value: rest });
      }
      continue;
    }

    entries.push({ key, value });
  }

  return entries;
}
