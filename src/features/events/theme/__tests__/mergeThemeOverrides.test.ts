import { describe, expect, it } from "vitest";
import type { ThemeOverrides } from "../../../party/types/themeContract";
import {
  applyImportedThemeOverrides,
  clearSocialCta,
  mergeThemeOverrides,
  removeBackgroundImage,
  removeSplashIconImage,
  setBackgroundImage,
  setConfettiShapes,
  setSocialCta,
  setSplashIconImage,
  setSplashIconPlate,
} from "../mergeThemeOverrides";

describe("mergeThemeOverrides", () => {
  it("preserves unrelated top-level and nested keys, including unknown ones", () => {
    const current = {
      tokens: { primary: "#111", secondary: "#222" },
      images: { logo: { path: "logo.png", url: "https://x/logo.png" } },
      decorations: { sparkles: { enabled: true } },
      socialCta: { headline: { text: { es: "Hola" } } },
      copy: { headline: { text: { es: "Bienvenidos" } } },
      decorativeIcon: "flower", // unknown key, not in ThemeOverrides type
    };

    const result = mergeThemeOverrides(current, {
      images: { background: { path: "bg.png", url: "https://x/bg.png" } },
    });

    expect(result.tokens).toEqual(current.tokens);
    expect((result.images as any).logo).toEqual(current.images.logo);
    expect(result.decorations).toEqual(current.decorations);
    expect(result.socialCta).toEqual(current.socialCta);
    expect(result.copy).toEqual(current.copy);
    expect((result as any).decorativeIcon).toBe("flower");
  });

  it("does not mutate the input object", () => {
    const current = {
      images: { logo: { path: "logo.png", url: "https://x/logo.png" } },
    };
    const snapshot = JSON.parse(JSON.stringify(current));

    mergeThemeOverrides(current, {
      images: { background: { path: "bg.png", url: "https://x/bg.png" } },
    });

    expect(current).toEqual(snapshot);
  });

  it("handles null/undefined current overrides", () => {
    expect(
      mergeThemeOverrides(null, {
        images: { background: { path: "bg.png", url: "https://x/bg.png" } },
      })
    ).toEqual({
      images: { background: { path: "bg.png", url: "https://x/bg.png" } },
    });

    expect(
      mergeThemeOverrides(undefined, {
        images: { background: { path: "bg.png", url: "https://x/bg.png" } },
      })
    ).toEqual({
      images: { background: { path: "bg.png", url: "https://x/bg.png" } },
    });
  });

  it("never sends socialCta: null even if a change tries to null it", () => {
    const current = { socialCta: { headline: { text: { es: "Hola" } } } };

    const result = mergeThemeOverrides(current, { socialCta: null } as any);

    expect(result.socialCta).toEqual(current.socialCta);
  });
});

describe("setBackgroundImage", () => {
  it("sets images.background and preserves other image slots", () => {
    const current = {
      images: { logo: { path: "logo.png", url: "https://x/logo.png" } },
    };

    const result = setBackgroundImage(current, {
      path: "events/1/background.png",
      url: "https://x/events/1/background.png",
    });

    expect((result.images as any).background).toEqual({
      path: "events/1/background.png",
      url: "https://x/events/1/background.png",
    });
    expect((result.images as any).logo).toEqual(current.images.logo);
  });
});

describe("removeBackgroundImage", () => {
  it("sets images.background to null and preserves other image slots", () => {
    const current = {
      images: {
        logo: { path: "logo.png", url: "https://x/logo.png" },
        background: { path: "bg.png", url: "https://x/bg.png" },
      },
    };

    const result = removeBackgroundImage(current);

    expect((result.images as any).background).toBeNull();
    expect((result.images as any).logo).toEqual(current.images.logo);
  });
});

describe("setConfettiShapes", () => {
  it("sets shapes and enabled:true while preserving colors/amount", () => {
    const current = {
      decorations: {
        confetti: {
          enabled: false,
          colors: ["#fff", "#000"],
          amount: 40,
          shapes: ["star"],
        },
      },
    };

    const result = setConfettiShapes(current, ["heart", "circle"]);

    expect((result.decorations as any).confetti).toEqual({
      enabled: true,
      colors: ["#fff", "#000"],
      amount: 40,
      shapes: ["heart", "circle"],
    });
  });

  it("filters unknown shape slugs and caps at 20", () => {
    const many = Array.from({ length: 25 }, () => "rect");
    const result = setConfettiShapes(null, [...many, "not-a-shape", "circle"]);

    const shapes = (result.decorations as any).confetti.shapes as string[];
    expect(shapes.length).toBe(20);
    expect(shapes.every((s) => s === "rect")).toBe(true);
    expect(shapes).not.toContain("not-a-shape");
  });

  it("allows deselecting all shapes: keeps enabled true with an empty array", () => {
    const result = setConfettiShapes(null, []);

    expect((result.decorations as any).confetti).toEqual({
      enabled: true,
      shapes: [],
    });
  });

  it("preserves unrelated decorations like sparkles", () => {
    const current = {
      decorations: {
        sparkles: { enabled: true },
        confetti: { enabled: true, shapes: ["star"] },
      },
    };

    const result = setConfettiShapes(current, ["rose"]);

    expect((result.decorations as any).sparkles).toEqual({ enabled: true });
  });
});

describe("expanded confetti catalog", () => {
  it("persists new shapes without losing explicit colors or count", () => {
    const shapes = ["diamond", "bow", "butterfly", "camera"];
    const result = setConfettiShapes(
      { decorations: { confetti: { colors: ["#abcdef"], amount: 12 } } },
      shapes
    );
    expect((result as ThemeOverrides).decorations?.confetti).toEqual({
      enabled: true,
      shapes,
      colors: ["#abcdef"],
      amount: 12,
    });
  });
});

describe("setSplashIconImage / removeSplashIconImage", () => {
  const current = {
    tokens: { primary: "#111" },
    images: {
      background: { path: "bg.png", url: "https://x/bg.png" },
      splashIcon: { path: "old.png", url: "https://x/old.png" },
    },
    decorations: { confetti: { enabled: true, shapes: ["star"] } },
    socialCta: { headline: { text: { es: "Hola" } } },
    decorativeIcon: "flower",
  };

  it("sets images.splashIcon and preserves every other key", () => {
    const result = setSplashIconImage(current, { path: "new.svg", url: "https://x/new.svg" });

    expect((result.images as any).splashIcon).toEqual({ path: "new.svg", url: "https://x/new.svg" });
    expect((result.images as any).background).toEqual(current.images.background);
    expect(result.tokens).toEqual(current.tokens);
    expect(result.decorations).toEqual(current.decorations);
    expect(result.socialCta).toEqual(current.socialCta);
    expect((result as any).decorativeIcon).toBe("flower");
  });

  it("sets images.splashIcon = null on removal and preserves every other key", () => {
    const result = removeSplashIconImage(current);

    expect((result.images as any).splashIcon).toBeNull();
    expect((result.images as any).background).toEqual(current.images.background);
    expect(result.tokens).toEqual(current.tokens);
    expect(result.decorations).toEqual(current.decorations);
    expect((result as any).decorativeIcon).toBe("flower");
  });

  it("does not touch splashIcon when only the background changes", () => {
    const result = setBackgroundImage(current, { path: "b2.png", url: "https://x/b2.png" });

    expect((result.images as any).splashIcon).toEqual(current.images.splashIcon);
  });

  it("does not mutate the input", () => {
    const snapshot = JSON.parse(JSON.stringify(current));
    setSplashIconImage(current, { path: "n.png", url: "https://x/n.png" });
    removeSplashIconImage(current);
    expect(current).toEqual(snapshot);
  });
});

describe("splashIcon plate", () => {
  const current = {
    tokens: { primary: "#111" },
    images: {
      background: { path: "bg.png", url: "https://x/bg.png" },
      splashIcon: { path: "old.png", url: "https://x/old.png", plate: "#000000" },
    },
    decorativeIcon: "flower",
  };

  it("setSplashIconImage stores the plate inside the slot", () => {
    const result = setSplashIconImage(current, { path: "n.png", url: "https://x/n.png", plate: "#111111" });
    expect((result.images as any).splashIcon).toEqual({ path: "n.png", url: "https://x/n.png", plate: "#111111" });
    expect((result.images as any).background).toEqual(current.images.background);
    expect((result as any).decorativeIcon).toBe("flower");
  });

  it("setSplashIconImage without plate drops a previous plate", () => {
    const result = setSplashIconImage(current, { path: "n.png", url: "https://x/n.png" });
    expect((result.images as any).splashIcon).toEqual({ path: "n.png", url: "https://x/n.png" });
  });

  it("setSplashIconPlate updates only the plate, keeping path/url and other keys", () => {
    const result = setSplashIconPlate(current, "#ffffff");
    expect((result.images as any).splashIcon).toEqual({ path: "old.png", url: "https://x/old.png", plate: "#ffffff" });
    expect((result.images as any).background).toEqual(current.images.background);
    expect(result.tokens).toEqual(current.tokens);
  });

  it("setSplashIconPlate(null) removes the plate key", () => {
    const result = setSplashIconPlate(current, null);
    expect((result.images as any).splashIcon).toEqual({ path: "old.png", url: "https://x/old.png" });
    expect("plate" in (result.images as any).splashIcon).toBe(false);
  });

  it("setSplashIconPlate is a no-op when there is no splashIcon slot", () => {
    const result = setSplashIconPlate({ images: {} }, "#000000");
    expect((result.images as any).splashIcon).toBeUndefined();
  });

  it("removal writes null (plate goes with it)", () => {
    expect((removeSplashIconImage(current).images as any).splashIcon).toBeNull();
  });

  it("does not mutate the input", () => {
    const snapshot = JSON.parse(JSON.stringify(current));
    setSplashIconPlate(current, null);
    setSplashIconImage(current, { path: "n", url: "u" });
    expect(current).toEqual(snapshot);
  });
});

describe("setSocialCta / clearSocialCta", () => {
  const current = {
    tokens: { primary: "#111" },
    socialCta: {
      headline: { text: { es: "Hola" } },
      socials: {
        instagram: "https://instagram.com/old",
        tiktok: "https://www.tiktok.com/@old",
      },
    },
    decorativeIcon: "flower",
  };

  it("replaces socialCta wholesale so dropped networks disappear", () => {
    const next = { socials: { instagram: "https://instagram.com/new" }, primaryAction: null };

    const result = setSocialCta(current, next);

    expect(result.socialCta).toEqual(next);
    expect(result.tokens).toEqual(current.tokens);
    expect(result.decorativeIcon).toBe("flower");
    expect(current.socialCta.socials.tiktok).toBe("https://www.tiktok.com/@old");
  });

  it("does not share references with the given socialCta", () => {
    const next = { socials: { instagram: "https://instagram.com/new" } };

    const result = setSocialCta(null, next);
    next.socials.instagram = "mutated";

    expect((result.socialCta as any).socials.instagram).toBe("https://instagram.com/new");
  });

  it("clearSocialCta deletes the key and never writes null", () => {
    const result = clearSocialCta(current);

    expect("socialCta" in result).toBe(false);
    expect(result.tokens).toEqual(current.tokens);
    expect(current.socialCta).toBeDefined();
    expect(clearSocialCta(undefined)).toEqual({});
  });
});

describe("applyImportedThemeOverrides", () => {
  const current = {
    tokens: { primary: "#111111", secondary: "#222222" },
    images: { background: { path: "bg.png", url: "https://x/bg.png" } },
    decorations: { sparkles: { enabled: true } },
    decorativeIcon: "flower",
  };

  it("replaces imported top-level blocks wholesale and keeps absent keys", () => {
    const result = applyImportedThemeOverrides(current, {
      tokens: { primary: "#333333" },
      socialCta: { headline: { key: "x" } },
    });

    expect(result.tokens).toEqual({ primary: "#333333" });
    expect(result.socialCta).toEqual({ headline: { key: "x" } });
    expect(result.decorations).toEqual(current.decorations);
    expect(result.decorativeIcon).toBe("flower");
  });

  it("never touches images and does not mutate its inputs", () => {
    const imported = { images: { splashIcon: { plate: "#000000" } }, tokens: { primary: "#333333" } };
    const result = applyImportedThemeOverrides(current, imported);

    expect(result.images).toEqual(current.images);
    expect(current.tokens.primary).toBe("#111111");
    (result.tokens as any).primary = "#999999";
    expect(imported.tokens.primary).toBe("#333333");
  });

  it("starts from an empty object when there is nothing stored", () => {
    expect(applyImportedThemeOverrides(null, { tokens: { primary: "#333333" } })).toEqual({
      tokens: { primary: "#333333" },
    });
  });
});
