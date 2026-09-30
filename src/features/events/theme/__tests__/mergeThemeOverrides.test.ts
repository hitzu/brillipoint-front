import { describe, expect, it } from "vitest";
import type { ThemeOverrides } from "../../../party/types/themeContract";
import {
  mergeThemeOverrides,
  removeBackgroundImage,
  setBackgroundImage,
  setConfettiShapes,
} from "../mergeThemeOverrides";

describe("mergeThemeOverrides", () => {
  it("preserves unrelated top-level and nested keys, including unknown ones", () => {
    const current = {
      tokens: { primary: "#111", secondary: "#222" },
      images: { logo: { path: "logo.png", url: "https://x/logo.png" } },
      decorations: { sparkles: { enabled: true } },
      socialCta: { brandKitKey: "wedding", headline: { text: { es: "Hola" } } },
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
    const current = { socialCta: { brandKitKey: "wedding" } };

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
