import { EventThemeImages, ThemeTokens } from "../types/themeContract";
import { EventPageTheme } from "../types/eventPageTheme";

// Single point of translation: flat contract (9 required tokens) → EventPageTheme
// (13 fields consumed by buildThemeVars). The engine does not change.
// See docs/themes/tdd-theme-system.md §3.2.
export function tokensToEventPageTheme(
  t: ThemeTokens,
  images?: EventThemeImages | null,
): EventPageTheme {
  const accent = t.accent ?? t.primary;
  return {
    pageBackground: t.background,
    primaryButtonBg: t.primary,
    primaryButtonText: t.onPrimary,
    secondaryButtonBg: t.secondary,
    secondaryButtonText: t.onSecondary ?? t.onPrimary,
    accentColor: accent,
    textColor: t.text,
    mutedTextColor: t.textMuted,
    surfaceBackground: t.surface,
    // Optional contract tokens → derived when absent:
    dividerColor: t.divider ?? t.textMuted,
    surfaceBorderColor: t.surfaceBorder ?? t.textMuted,
    surfaceShadow: t.surfaceShadow ?? "0 18px 44px rgba(0,0,0,0.12)",
    accentGlow: accent,
    fontHeading: t.fontHeading,
    fontBody: t.fontBody,
    splashEmblemUrl: images?.splashEmblem,
  };
}
