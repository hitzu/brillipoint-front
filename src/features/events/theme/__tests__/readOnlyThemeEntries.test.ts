import { describe, expect, it } from "vitest";
import { getReadOnlyThemeEntries } from "../readOnlyThemeEntries";

describe("getReadOnlyThemeEntries", () => {
  it("returns an empty list for null/undefined themeOverrides", () => {
    expect(getReadOnlyThemeEntries(null)).toEqual([]);
    expect(getReadOnlyThemeEntries(undefined)).toEqual([]);
  });

  it("excludes images.background but keeps other image slots", () => {
    const entries = getReadOnlyThemeEntries({
      images: {
        logo: { path: "logo.png", url: "https://x/logo.png" },
        background: { path: "bg.png", url: "https://x/bg.png" },
      },
    });

    expect(entries).toEqual([
      { key: "images", value: { logo: { path: "logo.png", url: "https://x/logo.png" } } },
    ]);
  });

  it("drops the images block entirely when background was the only slot", () => {
    const entries = getReadOnlyThemeEntries({
      images: { background: { path: "bg.png", url: "https://x/bg.png" } },
    });

    expect(entries).toEqual([]);
  });

  it("excludes images.splashIcon but keeps other image slots", () => {
    const entries = getReadOnlyThemeEntries({
      images: {
        logo: { path: "logo.png", url: "https://x/logo.png" },
        splashIcon: { path: "s.png", url: "https://x/s.png" },
      },
    });

    expect(entries).toEqual([
      { key: "images", value: { logo: { path: "logo.png", url: "https://x/logo.png" } } },
    ]);
  });

  it("drops the images block when background and splashIcon were the only slots", () => {
    const entries = getReadOnlyThemeEntries({
      images: {
        background: { path: "bg.png", url: "https://x/bg.png" },
        splashIcon: null,
      },
    });

    expect(entries).toEqual([]);
  });

  it("excludes decorations.confetti but keeps sparkles", () => {
    const entries = getReadOnlyThemeEntries({
      decorations: {
        confetti: { enabled: true, shapes: ["star"] },
        sparkles: { enabled: true },
      },
    });

    expect(entries).toEqual([{ key: "decorations", value: { sparkles: { enabled: true } } }]);
  });

  it("excludes socialCta, which has its own editable block", () => {
    expect(
      getReadOnlyThemeEntries({ socialCta: { socials: { instagram: "https://instagram.com/x" } } }),
    ).toEqual([]);
  });

  it("passes through tokens, copy and unknown keys unchanged", () => {
    const raw = {
      tokens: { primary: "#111" },
      socialCta: { brandKitKey: "wedding" },
      copy: { headline: { text: { es: "Hola" } } },
      decorativeIcon: "flower",
    };

    const entries = getReadOnlyThemeEntries(raw);

    expect(entries).toEqual([
      { key: "tokens", value: raw.tokens },
      { key: "copy", value: raw.copy },
      { key: "decorativeIcon", value: "flower" },
    ]);
  });
});
