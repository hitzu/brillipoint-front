import { describe, expect, it } from "vitest";
import { parseThemeOverridesJson } from "../parseThemeOverridesJson";

const expectError = (input: string) => {
  const result = parseThemeOverridesJson(input);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error("expected an error result");
  expect(typeof result.error).toBe("string");
  expect(result.error.length).toBeGreaterThan(0);
  return result.error;
};

const expectOverrides = (input: string) => {
  const result = parseThemeOverridesJson(input);
  if (!result.ok) throw new Error(`expected ok, got: ${result.error}`);
  return result.overrides;
};

describe("parseThemeOverridesJson", () => {
  it("rejects empty input", () => {
    expectError("");
    expectError("   \n ");
  });

  it("rejects invalid JSON", () => {
    expect(expectError("{ tokens: ")).toMatch(/JSON/);
  });

  it.each([["[]"], ["null"], ["42"], ['"text"'], ["true"]])(
    "rejects non-object JSON %s",
    (input) => {
      expectError(input);
    },
  );

  it("rejects a payload wrapped in a themeOverrides key", () => {
    expect(expectError('{ "themeOverrides": { "tokens": { "primary": "#111111" } } }')).toMatch(
      /themeOverrides/,
    );
  });

  it("keeps non-image keys untouched, including unknown ones", () => {
    const input = {
      tokens: { primary: "#111111", fontHeading: "Playfair" },
      decorations: { confetti: { enabled: true, shapes: ["star"] }, sparkles: { enabled: true } },
      socialCta: { headline: { text: { es: "Hola" } } },
      rewardPromo: { handle: "@lusso" },
      copy: { headline: { key: "party.headline" } },
      decorativeIcon: "flower",
    };

    expect(expectOverrides(JSON.stringify(input))).toEqual(input);
  });

  it("strips every image URL slot but keeps the splash plate", () => {
    const overrides = expectOverrides(
      JSON.stringify({
        tokens: { primary: "#111111" },
        images: {
          background: { path: "bg.png", url: "https://x/bg.png" },
          splashIcon: { path: "logo.png", url: "https://x/logo.png", plate: "#000000" },
          logo: { path: "l.png", url: "https://x/l.png" },
          cover: { path: "c.png", url: "https://x/c.png", link: "https://lusso.mx" },
          watermark: null,
        },
      }),
    );

    expect(overrides).toEqual({
      tokens: { primary: "#111111" },
      images: { splashIcon: { plate: "#000000" } },
    });
  });

  it("drops the images object when nothing but URLs was inside", () => {
    const overrides = expectOverrides(
      JSON.stringify({
        tokens: { primary: "#111111" },
        images: { background: { path: "bg.png", url: "https://x/bg.png" } },
      }),
    );

    expect(overrides).toEqual({ tokens: { primary: "#111111" } });
  });

  it("drops a splash plate that is not a #RRGGBB color", () => {
    const overrides = expectOverrides(
      JSON.stringify({ images: { splashIcon: { url: "https://x/l.png", plate: "black" } } }),
    );

    expect(overrides).toEqual({});
  });

  it("drops socialCta: null, which the API rejects", () => {
    const overrides = expectOverrides(
      JSON.stringify({ tokens: { primary: "#111111" }, socialCta: null }),
    );

    expect(overrides).toEqual({ tokens: { primary: "#111111" } });
  });
});
