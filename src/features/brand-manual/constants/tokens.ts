import type { CSSProperties } from "react";
import type { ColorToken, Line } from "../types";

/**
 * Color tokens of Brillipoint Experience, copied from the Design System
 * artifact's tokens.json. Light is Photobooth, dark is Glitter Bar.
 */
export const COLOR_TOKENS: Record<ColorToken, Record<Line, string>> = {
  "surface-000": { light: "#ffffff", dark: "#000000" },
  "surface-100": { light: "#fbf8f3", dark: "#0c0b0a" },
  "surface-200": { light: "#f3ede3", dark: "#171513" },
  ink: { light: "#111010", dark: "#f5efe6" },
  "ink-muted": { light: "#6b625a", dark: "#a79d92" },
  line: { light: "#e6ded2", dark: "#2e2a26" },
  "gold-500": { light: "#d9b56e", dark: "#d9b56e" },
  "gold-700": { light: "#7d5f24", dark: "#d9b56e" },
  "gold-100": { light: "#efe2c4", dark: "#3a301f" },
  "on-gold": { light: "#111010", dark: "#111010" },
  neon: { light: "#ffffff", dark: "#ffffff" },
};

const SHADOW_CARD: Record<Line, string> = {
  light: "0 8px 24px rgba(17,16,16,0.08)",
  dark: "0 8px 24px rgba(0,0,0,0.5)",
};

export const tokenValue = (token: ColorToken, line: Line): string =>
  COLOR_TOKENS[token][line];

/** The line's themed tokens as CSS custom properties, scoped to the element that receives them. */
export function themeVars(line: Line): CSSProperties {
  const vars: Record<string, string> = { "--shadow-card": SHADOW_CARD[line] };
  (Object.keys(COLOR_TOKENS) as ColorToken[]).forEach((token) => {
    vars[`--${token}`] = COLOR_TOKENS[token][line];
  });
  return vars as CSSProperties;
}
