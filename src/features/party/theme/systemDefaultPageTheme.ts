import { tokensToEventPageTheme } from "../utils/tokensToEventPageTheme";
import { systemDefaultEventTheme } from "./systemDefaultTheme";

/**
 * The neutral system-default theme, expressed in the flat `EventPageTheme`
 * shape consumed by `buildThemeVars` and other CSS/canvas rendering.
 *
 * Used wherever a CSS `var(--ep-x, <fallback>)` or a canvas color literal
 * previously hardcoded a pink stand-in for "no theme resolved yet" — the
 * fallback must be this neutral default, never an invented palette (T6).
 */
export const systemDefaultPageTheme = tokensToEventPageTheme(
  systemDefaultEventTheme.tokens,
);
