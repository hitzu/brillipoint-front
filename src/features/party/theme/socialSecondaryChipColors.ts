/**
 * Fixed foreground/background hex pairs for the new WhatsApp and website
 * secondary social chips (T2). Kept as pure data + a WCAG contrast helper so
 * the accessibility requirement is unit-tested without a DOM/CSS runner —
 * mirror these exact hex values in `social-media-cta.module.css`
 * (`.pageSocialBtnWa` / `.pageSocialBtnUrl`) if they ever change.
 *
 * Unlike the primary-action brand colors in `primaryActionButtonVariant.ts`
 * (white text on a solid brand fill, preserved as-is from production), these
 * are new tinted chips — background/foreground pairs chosen to meet WCAG AA
 * (4.5:1) for normal text.
 */
export interface SolidFillColorPair {
  background: string;
  foreground: string;
}

export const SOCIAL_SECONDARY_CHIP_COLORS: Record<
  "whatsapp" | "url",
  SolidFillColorPair
> = {
  whatsapp: { background: "#d1fae5", foreground: "#065f46" },
  url: { background: "#e2e8f0", foreground: "#1e293b" },
};

const srgbChannelToLinear = (channel: number): number => {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

const relativeLuminance = (hex: string): number => {
  const value = hex.replace("#", "");
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  const [rl, gl, bl] = [r, g, b].map(srgbChannelToLinear);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
};

/** WCAG 2.x contrast ratio between two hex colors (order-independent). */
export const contrastRatio = (hexA: string, hexB: string): number => {
  const luminanceA = relativeLuminance(hexA);
  const luminanceB = relativeLuminance(hexB);
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  return (lighter + 0.05) / (darker + 0.05);
};
