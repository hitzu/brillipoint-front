import { isConfettiShape } from "../../party/theme/confettiShapes";

/**
 * `PATCH /events/:id` replaces the whole `themeOverrides` object (no deep
 * merge server-side). This module deep-merges client-side before saving so
 * editing one key (background, confetti shapes) never wipes the rest.
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
