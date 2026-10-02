import type { Locale, ThemeI18nLookup } from "../theme/resolveThemeText";
import { translate, TranslateParams } from "../theme/translate";
import { en } from "./dictionaries/en";
import { es } from "./dictionaries/es";
import type { Dictionary, PluralForms, PluralKey, TranslationKey } from "./types";

const DICTIONARIES: Record<Locale, Dictionary> = { es, en };

/** BCP 47 tags used for `Intl` formatting. */
const INTL_LOCALE: Record<Locale, string> = { es: "es-MX", en: "en-US" };

const lookup = (locale: Locale, key: string): unknown =>
  key
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined,
      DICTIONARIES[locale],
    );

/** Returns the UI string for `key` in `locale`, interpolating `{{params}}`. */
export function t(locale: Locale, key: TranslationKey, params?: TranslateParams): string {
  return translate(lookup(locale, key) as string, params);
}

/** Picks the plural form for `count` (CLDR rules via `Intl.PluralRules`). */
export function tPlural(
  locale: Locale,
  key: PluralKey,
  count: number,
  params?: TranslateParams,
): string {
  const forms = lookup(locale, key) as PluralForms;
  const category = new Intl.PluralRules(INTL_LOCALE[locale]).select(count);
  const template = (forms as unknown as Record<string, string | undefined>)[category] ?? forms.other;
  return translate(template, { ...params, count });
}

export function formatDate(
  locale: Locale,
  date: Date,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], options).format(date);
}

/**
 * Exposes the dictionary as the theme's `ThemeI18nLookup`, so `{ key }`
 * ThemeTexts from the backend resolve against the same copy. Only plain
 * string entries resolve; groups, plurals and unknown keys return undefined.
 */
export function createThemeI18nLookup(locale: Locale): ThemeI18nLookup {
  return (key) => {
    const value = lookup(locale, key);
    return typeof value === "string" ? value : undefined;
  };
}
