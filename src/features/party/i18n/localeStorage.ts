import type { Locale } from "../theme/resolveThemeText";
import { isLocale } from "./resolveLocale";

/** localStorage key for the guest's explicit language choice. */
export const LOCALE_STORAGE_KEY = "party.locale";

/** The subset of `Storage` the helpers need, so tests can pass a fake. */
export type LocaleStorage = Pick<Storage, "getItem" | "setItem">;

/**
 * Reads the guest's stored language. Storage access can throw (private mode,
 * blocked site data), so any failure — or an unsupported value — is `null`.
 */
export function readStoredLocale(storage: LocaleStorage | null | undefined): Locale | null {
  if (!storage) return null;
  try {
    const value = storage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(value) ? value : null;
  } catch {
    return null;
  }
}

/** Persists a supported locale; returns whether it was stored. Never throws. */
export function writeStoredLocale(
  storage: LocaleStorage | null | undefined,
  locale: string,
): boolean {
  if (!storage || !isLocale(locale)) return false;
  try {
    storage.setItem(LOCALE_STORAGE_KEY, locale);
    return true;
  } catch {
    return false;
  }
}
