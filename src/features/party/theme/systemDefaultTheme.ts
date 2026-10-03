/**
 * Bundled fallback theme, used when the backend theme request fails, before
 * it responds, or when nothing is cached yet for ETag/304 reuse (T2).
 *
 * `system-default.json` is a verbatim copy of bookandsign-api's
 * `src/events/theme/system-default.json`. It is NOT computed from the
 * backend at build time — regenerate it manually with
 * `pnpm run theme:export-default` whenever the backend default changes, and
 * compare `SYSTEM_DEFAULT_THEME_VERSION` against the backend's `version`
 * field to detect drift.
 */
import systemDefaultJson from "./system-default.json";
import { EventTheme } from "../types/themeContract";

export const SYSTEM_DEFAULT_THEME_VERSION: string = systemDefaultJson.version;

export const systemDefaultEventTheme: EventTheme = {
  id: null,
  key: "system-default",
  name: "System Default",
  version: systemDefaultJson.version,
  tokens: systemDefaultJson.theme.tokens,
  images: systemDefaultJson.theme.images,
  decorations: systemDefaultJson.theme.decorations,
  socialCta: systemDefaultJson.theme.socialCta,
  rewardPromo: systemDefaultJson.theme.rewardPromo,
  copy: systemDefaultJson.theme.copy,
};
