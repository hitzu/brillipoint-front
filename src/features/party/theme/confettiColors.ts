import { EventPageTheme } from "../types/eventPageTheme";
import { systemDefaultPageTheme } from "./systemDefaultPageTheme";

/**
 * Confetti/decoration palette derived from the resolved event theme —
 * never a hardcoded pink set (T6). Falls back to the neutral system
 * default per-field when the theme, or one of its fields, is missing.
 */
export function getConfettiColors(theme?: EventPageTheme): string[] {
  const t = theme ?? systemDefaultPageTheme;

  return [
    t.primaryButtonBg ?? systemDefaultPageTheme.primaryButtonBg,
    t.secondaryButtonBg ?? systemDefaultPageTheme.secondaryButtonBg,
    t.accentColor ?? systemDefaultPageTheme.accentColor,
    t.mutedTextColor ?? systemDefaultPageTheme.mutedTextColor,
  ].filter((color): color is string => Boolean(color));
}
