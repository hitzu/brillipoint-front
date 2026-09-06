// Flat semantic palette served by the backend (GET /events/:token/theme).
// Literals are already resolved server-side — no alias, no client dereference.
// Same keys across web and iOS. See docs/themes/tdd-theme-system.md §2.

export interface ThemeTokens {
  background: string;
  primary: string;
  onPrimary: string;
  secondary: string;
  text: string;
  textMuted: string;
  surface: string;
  fontHeading: string;
  fontBody: string;
  // Optional escape hatches — derived in the adapter if absent.
  onSecondary?: string;
  onSurface?: string;
  accent?: string;
  surfaceBorder?: string;
  divider?: string;
  surfaceShadow?: string;
}

// Surface keys are open-ended (e.g. "splashEmblem") — new ones roll out via a
// database row, no API deploy required. Value is the ready-to-use public URL.
export type EventThemeImages = Record<string, string>;

export interface EventTheme {
  id: number;
  key: string;
  name: string;
  version: string; // ISO timestamp, used for cache-busting (ETag / If-None-Match)
  tokens: ThemeTokens;
  // Nullable, no default: themes cached before this shipped (or loaded under
  // the long Cache-Control on this endpoint) may return this as `null` or
  // omit it entirely for weeks after deploy — always guard.
  images?: EventThemeImages | null;
}

export interface EventThemeResponse {
  eventTheme: EventTheme;
}
