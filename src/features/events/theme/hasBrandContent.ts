import type { RawThemeOverrides } from "./mergeThemeOverrides";

const isMeaningful = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.values(value).some(isMeaningful);
  return true;
};

/**
 * Drops the per-event choices (welcome background and confetti) that are
 * edited outside the brand section, so they never count as brand content.
 */
const withoutPerEventBlocks = (themeOverrides: RawThemeOverrides): Record<string, unknown> => {
  const { images, decorations, ...rest } = themeOverrides as Record<string, any>;
  const { background: _background, ...brandImages } = images ?? {};
  const { confetti: _confetti, ...brandDecorations } = decorations ?? {};
  return { ...rest, images: brandImages, decorations: brandDecorations };
};

/**
 * Whether the event's own `themeOverrides` already carry brand content, i.e.
 * any brand key with a non-empty value. Explicit removals (`null`), empty
 * objects/arrays/strings, the welcome background and confetti do not count.
 * Drives the default state of the "Marca del evento" section only; it never
 * affects what is saved.
 */
export const hasBrandContent = (themeOverrides: RawThemeOverrides | null | undefined): boolean =>
  Boolean(themeOverrides) && isMeaningful(withoutPerEventBlocks(themeOverrides as RawThemeOverrides));
