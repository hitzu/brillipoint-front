// Contract for `GET /events/:token/theme` — the backend-resolved, layered
// theme (SystemDefault -> preset -> per-event overrides).
// The frontend never merges layers itself; it only renders what the backend
// already resolved. Ported from bookandsign-api's
// `src/events/theme/theme.types.ts` — keep the two files in sync.

/** The 9 tokens every resolved theme is guaranteed to have. */
export interface RequiredThemeTokens {
  background: string;
  primary: string;
  onPrimary: string;
  secondary: string;
  text: string;
  textMuted: string;
  surface: string;
  fontHeading: string;
  fontBody: string;
}

/** Optional tokens that may be absent from any layer, including the default. */
export interface OptionalThemeTokens {
  onSecondary?: string;
  onSurface?: string;
  accent?: string;
  surfaceBorder?: string;
  divider?: string;
  surfaceShadow?: string;
}

/** Full set of theme tokens. */
export type ThemeTokens = RequiredThemeTokens & OptionalThemeTokens;

/** Localized text: es/en pair, used across image alt text and social copy. */
export interface LocalizedText {
  es?: string;
  en?: string;
}

/** A single typed image slot. */
export interface ThemeImageSlot {
  path: string;
  url: string;
  alt?: LocalizedText;
}

/** The `cover` slot additionally carries a link and a fixed 4:5 aspect ratio. */
export interface ThemeCoverImageSlot extends ThemeImageSlot {
  link?: string;
}

/** The `splashIcon` slot may carry the opaque `#RRGGBB` background of its circle. */
export interface ThemeSplashIconSlot extends ThemeImageSlot {
  plate?: string;
}

export interface ThemeImages {
  logo?: ThemeImageSlot;
  splashIcon?: ThemeSplashIconSlot;
  hero?: ThemeImageSlot;
  watermark?: ThemeImageSlot;
  background?: ThemeImageSlot;
  cover?: ThemeCoverImageSlot;
}

/** Overridable image slots: any slot may be explicitly removed with `null`. */
export interface ThemeImageOverrides {
  logo?: ThemeImageSlot | null;
  splashIcon?: ThemeSplashIconSlot | null;
  hero?: ThemeImageSlot | null;
  watermark?: ThemeImageSlot | null;
  background?: ThemeImageSlot | null;
  cover?: ThemeCoverImageSlot | null;
}

export interface ThemeConfettiDecoration {
  enabled?: boolean;
  colors?: string[];
  shapes?: string[];
  amount?: number;
}

export interface ThemeSparklesDecoration {
  enabled?: boolean;
}

export interface ThemeDecorations {
  confetti?: ThemeConfettiDecoration;
  sparkles?: ThemeSparklesDecoration;
}

/** Overridable decorations: each block may be explicitly removed with `null`. */
export interface ThemeDecorationOverrides {
  confetti?: ThemeConfettiDecoration | null;
  sparkles?: ThemeSparklesDecoration | null;
}

/**
 * A piece of copy, resolved either from an i18n key (frontend interpolates
 * `params`) or from inline localized text. Either variant may carry a
 * `fallback` ThemeText (without placeholders) used when a referenced
 * placeholder has no matching entry in the resolved `params`; when absent,
 * a missing param renders as `''`.
 */
export type ThemeText =
  | { key: string; params?: Record<string, string>; fallback?: ThemeText }
  | { text: LocalizedText; fallback?: ThemeText };

/** Per-event values available for `{{key}}` placeholders in resolved theme texts. */
export interface ThemeTemplateParams {
  /** Trimmed `event.honoreesNames`; omitted when empty. */
  honoreesName?: string;
}

export type SocialCtaChannel =
  | "whatsapp"
  | "instagram"
  | "tiktok"
  | "facebook"
  | "url";

/**
 * WhatsApp stores `phone` + a `message` template; the frontend interpolates
 * and builds the `https://wa.me/<phone>?text=<encoded>` link.
 */
export interface SocialCtaWhatsappAction {
  channel: "whatsapp";
  label: ThemeText;
  phone: string;
  message?: ThemeText;
}

/** Every other channel stores a ready-to-use URL. */
export interface SocialCtaLinkAction {
  channel: "instagram" | "tiktok" | "facebook" | "url";
  label: ThemeText;
  url: string;
}

export type SocialCtaPrimaryAction = SocialCtaWhatsappAction | SocialCtaLinkAction;

export interface SocialCtaSocials {
  whatsapp?: string;
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  url?: string;
}

/**
 * Whole-block social CTA. `null` means hide the block — the frontend never
 * substitutes a fallback CTA of its own.
 */
export interface SocialCta {
  headline?: ThemeText;
  subtitle?: ThemeText;
  followText?: ThemeText;
  primaryAction?: SocialCtaPrimaryAction | null;
  socials?: SocialCtaSocials;
}

/**
 * Whole-block reward promo (gift button + modal in /mis-fotos, share-confirm
 * tag copy in the /fiesta lightbox). `null` means hide the promo entirely.
 */
export interface RewardPromo {
  /** Social handle guests must tag, e.g. `@brillipoint`. */
  handle: string;
  /** Modal headline; absent means the frontend's i18n default. */
  title?: ThemeText;
  /** Fine print under the promo; absent means no disclaimer. */
  disclaimer?: ThemeText;
}

/** Free-form copy map, keyed by usage (e.g. gallery headline strings). */
export type ThemeCopy = Record<string, ThemeText>;
export type ThemeCopyOverrides = Record<string, ThemeText | null>;

/**
 * Partial layer shape for per-event overrides
 * (admin editing, T7). Every field is optional; `undefined` means inherit
 * from the previous layer, `null` means explicitly remove (where removal is
 * meaningful).
 */
export interface ThemeOverrides {
  /**
   * Token values. Required tokens can only be overridden with a string,
   * never removed with `null` — that is why this is `Partial<ThemeTokens>`
   * rather than a nullable variant.
   */
  tokens?: Partial<ThemeTokens>;
  images?: ThemeImageOverrides;
  decorations?: ThemeDecorationOverrides;
  socialCta?: SocialCta | null;
  rewardPromo?: RewardPromo | null;
  copy?: ThemeCopyOverrides;
}

/** The fully resolved theme returned by the backend for one event. */
export interface EventTheme {
  /** `null` when the event has no preset — the system default is used as-is. */
  id: number | null;
  key: string;
  name: string;
  /** ISO timestamp, used for cache-busting (ETag / If-None-Match). */
  version: string;
  tokens: ThemeTokens;
  /** Optional layers — the backend may omit any of these entirely. */
  images?: ThemeImages;
  decorations?: ThemeDecorations;
  socialCta?: SocialCta | null;
  rewardPromo?: RewardPromo | null;
  copy?: ThemeCopy;
  params?: ThemeTemplateParams;
}

export interface EventThemeResponse {
  eventTheme: EventTheme;
}
