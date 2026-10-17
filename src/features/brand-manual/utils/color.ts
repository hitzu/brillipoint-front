export type Rgb = [number, number, number];

export function hexToRgb(hex: string): Rgb {
  let digits = hex.replace("#", "");
  if (digits.length < 6) {
    digits = digits
      .split("")
      .map((char) => char + char)
      .join("");
  }
  return [0, 2, 4].map((index) => parseInt(digits.substring(index, index + 2), 16)) as Rgb;
}

export function rgbToHex(rgb: Rgb): string {
  return `#${rgb.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

/** Naive RGB to CMYK. Print colors still need a proof or a Pantone. */
export function rgbToCmyk(rgb: Rgb): [number, number, number, number] {
  const [r, g, b] = rgb.map((channel) => channel / 255);
  const k = 1 - Math.max(r, g, b);
  if (k >= 1) return [0, 0, 0, 100];
  const [c, m, y] = [r, g, b].map((channel) => Math.round(((1 - channel - k) / (1 - k)) * 100));
  return [c, m, y, Math.round(k * 100)];
}

function relativeLuminance(rgb: Rgb): number {
  const linear = (channel: number) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linear(rgb[0]) + 0.7152 * linear(rgb[1]) + 0.0722 * linear(rgb[2]);
}

/** WCAG contrast ratio between two colors. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
