import React from "react";
import { EventPageTheme } from "../types/eventPageTheme";

export const toCssRgbTriplet = (value?: string) => {
  if (!value) return undefined;

  const hex = value.trim();
  const shortHexMatch = /^#([0-9a-f]{3})$/i.exec(hex);
  if (shortHexMatch) {
    const [r, g, b] = shortHexMatch[1].split("").map((part) =>
      Number.parseInt(part + part, 16),
    );
    return `${r}, ${g}, ${b}`;
  }

  const longHexMatch = /^#([0-9a-f]{6})$/i.exec(hex);
  if (longHexMatch) {
    const raw = longHexMatch[1];
    const r = Number.parseInt(raw.slice(0, 2), 16);
    const g = Number.parseInt(raw.slice(2, 4), 16);
    const b = Number.parseInt(raw.slice(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }

  const rgbMatch =
    /^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})/i.exec(hex);
  if (rgbMatch) {
    return `${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}`;
  }

  return undefined;
};

export function buildThemeVars(theme: EventPageTheme): React.CSSProperties {
  const vars: Record<string, string> = {};
  if (theme.pageBackground) vars["--ep-page-bg"] = theme.pageBackground;
  if (theme.primaryButtonBg) vars["--ep-primary-btn-bg"] = theme.primaryButtonBg;
  if (theme.primaryButtonText) vars["--ep-primary-btn-text"] = theme.primaryButtonText;
  if (theme.secondaryButtonBg) vars["--ep-secondary-btn-bg"] = theme.secondaryButtonBg;
  if (theme.secondaryButtonText) vars["--ep-secondary-btn-text"] = theme.secondaryButtonText;
  if (theme.accentColor) vars["--ep-accent"] = theme.accentColor;
  if (theme.textColor) vars["--ep-text"] = theme.textColor;
  if (theme.mutedTextColor) vars["--ep-muted-text"] = theme.mutedTextColor;
  if (theme.dividerColor) vars["--ep-divider"] = theme.dividerColor;
  if (theme.surfaceBackground) vars["--ep-surface-bg"] = theme.surfaceBackground;
  if (theme.surfaceBorderColor) vars["--ep-surface-border"] = theme.surfaceBorderColor;
  if (theme.surfaceShadow) vars["--ep-surface-shadow"] = theme.surfaceShadow;
  if (theme.accentGlow) vars["--ep-accent-glow"] = theme.accentGlow;
  if (theme.fontHeading) vars["--ep-font-heading"] = theme.fontHeading;
  if (theme.fontBody) vars["--ep-font-body"] = theme.fontBody;

  const primaryRgb = toCssRgbTriplet(theme.primaryButtonBg);
  const secondaryRgb = toCssRgbTriplet(theme.secondaryButtonBg);
  const accentRgb = toCssRgbTriplet(theme.accentColor);
  const pageBackgroundRgb = toCssRgbTriplet(theme.pageBackground);
  const textRgb = toCssRgbTriplet(theme.textColor);
  const mutedTextRgb = toCssRgbTriplet(theme.mutedTextColor);
  const dividerRgb = toCssRgbTriplet(theme.dividerColor);
  const surfaceRgb = toCssRgbTriplet(theme.surfaceBackground);
  const surfaceBorderRgb = toCssRgbTriplet(theme.surfaceBorderColor);

  if (primaryRgb) vars["--ep-primary-btn-bg-rgb"] = primaryRgb;
  if (secondaryRgb) vars["--ep-secondary-btn-bg-rgb"] = secondaryRgb;
  if (accentRgb) vars["--ep-accent-rgb"] = accentRgb;
  if (pageBackgroundRgb) vars["--ep-page-bg-rgb"] = pageBackgroundRgb;
  if (textRgb) vars["--ep-text-rgb"] = textRgb;
  if (mutedTextRgb) vars["--ep-muted-text-rgb"] = mutedTextRgb;
  if (dividerRgb) vars["--ep-divider-rgb"] = dividerRgb;
  if (surfaceRgb) vars["--ep-surface-bg-rgb"] = surfaceRgb;
  if (surfaceBorderRgb) vars["--ep-surface-border-rgb"] = surfaceBorderRgb;

  return vars as React.CSSProperties;
}
