import type { RawThemeOverrides } from "./mergeThemeOverrides";

export type ParseThemeOverridesResult =
  | { ok: true; overrides: RawThemeOverrides }
  | { ok: false; error: string };

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Keeps only what an import may carry inside `images`: every slot URL is
 * dropped (images are uploaded separately), except `splashIcon.plate`.
 * Returns `undefined` when nothing is left.
 */
const importableImages = (images: unknown): RawThemeOverrides | undefined => {
  if (!isPlainObject(images)) return undefined;
  const splashIcon = images.splashIcon;
  const plate = isPlainObject(splashIcon) ? splashIcon.plate : undefined;
  if (typeof plate === "string" && HEX_COLOR.test(plate)) {
    return { splashIcon: { plate } };
  }
  return undefined;
};

/**
 * Parses the `themeOverrides` JSON pasted by staff (as produced by the
 * theme-authoring skill). Only a plain object is accepted. Image slots are
 * stripped because images are uploaded through their own blocks; only
 * `images.splashIcon.plate` survives. `socialCta: null` is dropped because
 * the API rejects it.
 */
export function parseThemeOverridesJson(input: string): ParseThemeOverridesResult {
  if (!input.trim()) {
    return { ok: false, error: "Pega el JSON de themeOverrides." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return { ok: false, error: "El JSON no es válido. Revisa comas, llaves y comillas." };
  }

  if (!isPlainObject(parsed)) {
    return { ok: false, error: "El JSON debe ser un objeto con los valores de themeOverrides." };
  }

  const keys = Object.keys(parsed);
  if (keys.length === 1 && keys[0] === "themeOverrides") {
    return {
      ok: false,
      error: "Pega solo el contenido de themeOverrides, sin la llave \"themeOverrides\".",
    };
  }

  const overrides: RawThemeOverrides = {};
  for (const key of keys) {
    const value = parsed[key];
    if (key === "images") {
      const images = importableImages(value);
      if (images) overrides.images = images;
      continue;
    }
    if (key === "socialCta" && value === null) continue;
    overrides[key] = value;
  }

  return { ok: true, overrides };
}
