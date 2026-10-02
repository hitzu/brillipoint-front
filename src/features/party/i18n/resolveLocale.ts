import { DEFAULT_LOCALE, Locale } from "../theme/resolveThemeText";

export const SUPPORTED_LOCALES: readonly Locale[] = ["es", "en"];

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** `"en-US"` → `"en"`; unsupported languages → `null`. */
const fromLanguageTag = (tag: string): Locale | null => {
  const language = tag.toLowerCase().split("-")[0];
  return isLocale(language) ? language : null;
};

export interface LocaleSources {
  /** `?lang=` from the URL; wins so a shared link can force a language. */
  query?: string | null;
  /** The guest's explicit choice from the language toggle. */
  stored?: string | null;
  /** `navigator.languages`, most preferred first. */
  browserLanguages?: readonly string[];
}

/** Resolution order: `?lang` → stored choice → browser → `es`. */
export function resolveLocale({ query, stored, browserLanguages = [] }: LocaleSources): Locale {
  if (isLocale(query)) return query;
  if (isLocale(stored)) return stored;
  for (const tag of browserLanguages) {
    const locale = fromLanguageTag(tag);
    if (locale) return locale;
  }
  return DEFAULT_LOCALE;
}
