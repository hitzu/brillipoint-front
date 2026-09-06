import assert from "node:assert/strict";
import test from "node:test";
import { tokensToEventPageTheme } from "../tokensToEventPageTheme";
import { ThemeTokens } from "../../types/themeContract";

const baseTokens: ThemeTokens = {
  background: "#fff5f7",
  primary: "#ec4899",
  onPrimary: "#ffffff",
  secondary: "#a855f7",
  text: "#831843",
  textMuted: "#9ca3af",
  surface: "#fce7f3",
  fontHeading: "Futura",
  fontBody: "Inter",
};

test("maps the 9 required tokens to their EventPageTheme fields", () => {
  const theme = tokensToEventPageTheme(baseTokens);

  assert.equal(theme.pageBackground, "#fff5f7");
  assert.equal(theme.primaryButtonBg, "#ec4899");
  assert.equal(theme.primaryButtonText, "#ffffff");
  assert.equal(theme.secondaryButtonBg, "#a855f7");
  assert.equal(theme.textColor, "#831843");
  assert.equal(theme.mutedTextColor, "#9ca3af");
  assert.equal(theme.surfaceBackground, "#fce7f3");
  assert.equal(theme.fontHeading, "Futura");
  assert.equal(theme.fontBody, "Inter");
});

test("derives optional tokens when absent", () => {
  const theme = tokensToEventPageTheme(baseTokens);

  // secondaryButtonText falls back to onPrimary
  assert.equal(theme.secondaryButtonText, "#ffffff");
  // accent + accentGlow fall back to primary
  assert.equal(theme.accentColor, "#ec4899");
  assert.equal(theme.accentGlow, "#ec4899");
  // divider + surfaceBorder fall back to textMuted
  assert.equal(theme.dividerColor, "#9ca3af");
  assert.equal(theme.surfaceBorderColor, "#9ca3af");
  // surfaceShadow falls back to the fixed default
  assert.equal(theme.surfaceShadow, "0 18px 44px rgba(0,0,0,0.12)");
});

test("honors optional escape-hatch tokens when present", () => {
  const theme = tokensToEventPageTheme({
    ...baseTokens,
    onSecondary: "#000000",
    accent: "#22d3ee",
    divider: "#e5e7eb",
    surfaceBorder: "#d1d5db",
    surfaceShadow: "0 1px 2px rgba(0,0,0,0.5)",
  });

  assert.equal(theme.secondaryButtonText, "#000000");
  assert.equal(theme.accentColor, "#22d3ee");
  assert.equal(theme.accentGlow, "#22d3ee");
  assert.equal(theme.dividerColor, "#e5e7eb");
  assert.equal(theme.surfaceBorderColor, "#d1d5db");
  assert.equal(theme.surfaceShadow, "0 1px 2px rgba(0,0,0,0.5)");
});

test("maps the splashEmblem image URL when images are present", () => {
  const theme = tokensToEventPageTheme(baseTokens, {
    splashEmblem: "https://proyecto.supabase.co/storage/v1/object/public/prod/emblem.jpeg",
  });

  assert.equal(
    theme.splashEmblemUrl,
    "https://proyecto.supabase.co/storage/v1/object/public/prod/emblem.jpeg",
  );
});

test("leaves splashEmblemUrl undefined when images is null, missing, or lacks the key", () => {
  assert.equal(tokensToEventPageTheme(baseTokens, null).splashEmblemUrl, undefined);
  assert.equal(tokensToEventPageTheme(baseTokens).splashEmblemUrl, undefined);
  assert.equal(
    tokensToEventPageTheme(baseTokens, {}).splashEmblemUrl,
    undefined,
  );
});
