import { isConfettiShape } from "../../party/theme/confettiShapes";

/**
 * `PATCH /events/:id` replaces the whole `themeOverrides` object (no deep
 * merge server-side). This module deep-merges client-side before saving so
 * editing one key (background, splash icon, confetti shapes) never wipes the rest.
 *
 * The raw object fetched from the API may carry keys that are not part of
 * the frontend `ThemeOverrides` type yet (e.g. `decorativeIcon`). Treating
 * it as `Record<string, unknown>` here — instead of re-typing it through
 * `ThemeOverrides` — is what lets those unknown keys survive the merge.
 */
export type RawThemeOverrides = Record<string, unknown>;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const deepClone = <T>(value: T): T =>
  typeof structuredClone === "function"
    ? structuredClone(value)
    : (JSON.parse(JSON.stringify(value)) as T);

/**
 * Deep-merges `changes` onto `current`. Objects are merged key by key;
 * arrays and primitives (including `null`) fully replace the base value.
 * Neither input is mutated.
 *
 * `socialCta` is a documented exception: the API contract forbids sending
 * `socialCta: null` (the backend treats it as "hide the block", and this
 * editor never intends to touch socialCta), so an incoming `null` for that
 * key is ignored and the current value (if any) is kept.
 */
export function mergeThemeOverrides(
  current: RawThemeOverrides | null | undefined,
  changes: RawThemeOverrides,
): RawThemeOverrides {
  const base = current ? deepClone(current) : {};
  const result: RawThemeOverrides = { ...base };

  for (const key of Object.keys(changes)) {
    const changeValue = changes[key];
    const baseValue = base[key];

    if (isPlainObject(changeValue) && isPlainObject(baseValue)) {
      result[key] = mergeThemeOverrides(baseValue, changeValue);
    } else {
      result[key] = changeValue;
    }
  }

  if (result.socialCta === null) {
    if (base.socialCta !== undefined) {
      result.socialCta = base.socialCta;
    } else {
      delete result.socialCta;
    }
  }

  return result;
}

export interface ThemeImageSlotInput {
  path: string;
  url: string;
}

/** Sets `images.background`, preserving every other image slot. */
export function setBackgroundImage(
  current: RawThemeOverrides | null | undefined,
  slot: ThemeImageSlotInput,
): RawThemeOverrides {
  return mergeThemeOverrides(current, {
    images: { background: { path: slot.path, url: slot.url } },
  });
}

/** Explicitly removes the background image slot (`images.background = null`). */
export function removeBackgroundImage(
  current: RawThemeOverrides | null | undefined,
): RawThemeOverrides {
  return mergeThemeOverrides(current, { images: { background: null } });
}

export interface SplashIconSlotInput extends ThemeImageSlotInput {
  /** Opaque `#RRGGBB` background of the splash logo circle. */
  plate?: string;
}

const buildSplashSlot = (slot: SplashIconSlotInput) => ({
  path: slot.path,
  url: slot.url,
  ...(slot.plate ? { plate: slot.plate } : {}),
});

/**
 * Sets `images.splashIcon` (optionally with its `plate`), preserving every
 * other image slot. The slot is replaced, not deep-merged, so a previous
 * plate never leaks into a new upload that has none.
 */
export function setSplashIconImage(
  current: RawThemeOverrides | null | undefined,
  slot: SplashIconSlotInput,
): RawThemeOverrides {
  const cleared = mergeThemeOverrides(current, { images: { splashIcon: null } });
  return mergeThemeOverrides(cleared, { images: { splashIcon: buildSplashSlot(slot) } });
}

/**
 * Updates only the plate of the existing splash icon slot (`null` removes the
 * key). A plate cannot exist without an image, so this is a no-op when the
 * slot is missing.
 */
export function setSplashIconPlate(
  current: RawThemeOverrides | null | undefined,
  plate: string | null,
): RawThemeOverrides {
  const images = isPlainObject(current?.images) ? current.images : undefined;
  const slot = images && isPlainObject(images.splashIcon) ? images.splashIcon : undefined;
  if (!slot || typeof slot.path !== "string" || typeof slot.url !== "string") {
    return mergeThemeOverrides(current, {});
  }
  return setSplashIconImage(current, {
    path: slot.path,
    url: slot.url,
    plate: plate ?? undefined,
  });
}

/** Explicitly removes the splash icon slot (`images.splashIcon = null`). */
export function removeSplashIconImage(
  current: RawThemeOverrides | null | undefined,
): RawThemeOverrides {
  return mergeThemeOverrides(current, { images: { splashIcon: null } });
}

const MAX_CONFETTI_SHAPES = 20;

/**
 * Sets `decorations.confetti.shapes` (filtered to the frontend catalog,
 * capped at 20) and forces `enabled: true`, preserving `colors`/`amount`.
 *
 * Deselecting every shape sends `shapes: []` with `enabled: true` kept —
 * the public render falls back to its default confetti set in that case,
 * so there is no need to also flip `enabled` off.
 */
export function setConfettiShapes(
  current: RawThemeOverrides | null | undefined,
  shapes: string[],
): RawThemeOverrides {
  const filtered = shapes.filter(isConfettiShape).slice(0, MAX_CONFETTI_SHAPES);
  return mergeThemeOverrides(current, {
    decorations: { confetti: { enabled: true, shapes: filtered } },
  });
}

/**
 * Replaces `socialCta` wholesale (no deep merge): the backend picks the first
 * usable block and never merges fields, so networks dropped in the editor must
 * disappear instead of surviving from the previous override.
 */
export function setSocialCta(
  current: RawThemeOverrides | null | undefined,
  socialCta: object,
): RawThemeOverrides {
  const result = current ? deepClone(current) : {};
  result.socialCta = deepClone(socialCta);
  return result;
}

/**
 * Removes the event's own `socialCta` so the theme's block is inherited
 * again. Deletes the key; never writes `socialCta: null` (rejected by the API).
 */
export function clearSocialCta(
  current: RawThemeOverrides | null | undefined,
): RawThemeOverrides {
  const result = current ? deepClone(current) : {};
  delete result.socialCta;
  return result;
}

/**
 * Applies an imported `themeOverrides` (see `parseThemeOverridesJson`) on top
 * of `current`. Every top-level key present in the import replaces the stored
 * block wholesale (the authoring skill emits validated whole blocks, so mixing
 * them field by field with stale stored values could produce combinations it
 * never validated); keys absent from the import are kept. `images` is never
 * touched: images are uploaded separately and the imported splash plate goes
 * through the plate editor instead.
 */
export function applyImportedThemeOverrides(
  current: RawThemeOverrides | null | undefined,
  imported: RawThemeOverrides,
): RawThemeOverrides {
  const result = current ? deepClone(current) : {};
  for (const key of Object.keys(imported)) {
    if (key === "images") continue;
    result[key] = deepClone(imported[key]);
  }
  return result;
}
