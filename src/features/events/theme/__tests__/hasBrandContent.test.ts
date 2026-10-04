import { describe, expect, it } from "vitest";
import { hasBrandContent } from "../hasBrandContent";

describe("hasBrandContent", () => {
  it.each([
    [null],
    [undefined],
    [{}],
    [{ tokens: {} }],
    [{ images: { background: null } }],
    [{ copy: {}, decorations: { confetti: null } }],
    // Background and confetti are per-event theme choices, not brand content.
    [{ images: { background: { path: "bg.png", url: "https://x/bg.png" } } }],
    [{ decorations: { confetti: { enabled: false, shapes: ["heart"] } } }],
  ])(
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
    [{ images: { background: { path: "bg.png" }, splashIcon: { path: "s.png" } } }],
  ])("is true for %j", (overrides) => {
    expect(hasBrandContent(overrides as any)).toBe(true);
  });
});
