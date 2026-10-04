import type { RawThemeOverrides } from "./mergeThemeOverrides";

const isMeaningful = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.values(value).some(isMeaningful);
  return true;
};

/**
 * Whether the event's own `themeOverrides` already carry brand content, i.e.
 * any key with a non-empty value. Explicit removals (`null`) and empty
 * objects/arrays/strings do not count. Drives the default state of the
 * "Marca del evento" section only; it never affects what is saved.
 */
export const hasBrandContent = (themeOverrides: RawThemeOverrides | null | undefined): boolean =>
  isMeaningful(themeOverrides);
