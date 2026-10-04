import { describe, expect, it } from "vitest";
import { hasBrandContent } from "../hasBrandContent";

describe("hasBrandContent", () => {
  it.each([[null], [undefined], [{}], [{ tokens: {} }], [{ images: { background: null } }], [{ copy: {}, decorations: { confetti: null } }]])(
    "is false for %j",
    (overrides) => {
      expect(hasBrandContent(overrides as any)).toBe(false);
    },
  );

  it.each([
    [{ tokens: { primary: "#111111" } }],
    [{ images: { logo: { path: "l.png", url: "https://x/l.png" } } }],
    [{ socialCta: { headline: { key: "x" } } }],
    [{ decorativeIcon: "flower" }],
    [{ decorations: { confetti: { enabled: false } } }],
  ])("is true for %j", (overrides) => {
    expect(hasBrandContent(overrides as any)).toBe(true);
  });
});
