import type { es } from "./dictionaries/es";

export type Dictionary = typeof es;

/** A plural entry: `one` is optional for languages/counts that never use it. */
export interface PluralForms {
  one?: string;
  other: string;
}

/** Dotted paths to plain string entries, e.g. `"common.language"`. */
export type TranslationKey = StringPaths<Dictionary>;

/** Dotted paths to plural entries, e.g. `"common.sessions"`. */
export type PluralKey = PluralPaths<Dictionary>;

type StringPaths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : T[K] extends PluralForms
      ? never
      : StringPaths<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

type PluralPaths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? never
    : T[K] extends PluralForms
      ? `${Prefix}${K}`
      : PluralPaths<T[K], `${Prefix}${K}.`>;
}[keyof T & string];
