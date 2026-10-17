import { describe, expect, it } from "vitest";
import { contrastRatio, hexToRgb, rgbToCmyk, rgbToHex } from "./color";
import { themeVars, tokenValue } from "../constants/tokens";

describe("color math", () => {
  it("converts HEX to RGB and back in uppercase", () => {
    expect(hexToRgb("#fbf8f3")).toEqual([251, 248, 243]);
    expect(hexToRgb("#fff")).toEqual([255, 255, 255]);
    expect(rgbToHex([217, 181, 110])).toBe("#D9B56E");
  });

  it("matches the CMYK values written in the brand tokens", () => {
    expect(rgbToCmyk([17, 16, 16])).toEqual([0, 6, 6, 93]);
    expect(rgbToCmyk([251, 248, 243])).toEqual([0, 1, 3, 2]);
    expect(rgbToCmyk([0, 0, 0])).toEqual([0, 0, 0, 100]);
  });

  it("matches the contrast ratios the manual documents", () => {
    const ratio = (a: string, b: string) => contrastRatio(hexToRgb(a), hexToRgb(b));
    expect(ratio("#111010", "#fbf8f3")).toBeCloseTo(17.9, 1);
    expect(ratio("#d9b56e", "#fbf8f3")).toBeCloseTo(1.8, 1);
    expect(ratio("#d9b56e", "#0c0b0a")).toBeCloseTo(10.1, 1);
  });
});

describe("brand tokens", () => {
  it("resolves a token per line", () => {
    expect(tokenValue("surface-100", "light")).toBe("#fbf8f3");
    expect(tokenValue("surface-100", "dark")).toBe("#0c0b0a");
    expect(tokenValue("gold-500", "dark")).toBe("#d9b56e");
  });

  it("exposes the line's tokens as CSS custom properties", () => {
    const vars = themeVars("dark") as Record<string, string>;
    expect(vars["--ink"]).toBe("#f5efe6");
    expect(vars["--shadow-card"]).toBe("0 8px 24px rgba(0,0,0,0.5)");
  });
});
