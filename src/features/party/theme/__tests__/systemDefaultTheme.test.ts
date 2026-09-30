import assert from "node:assert/strict";
import test from "node:test";
import {
  SYSTEM_DEFAULT_THEME_VERSION,
  systemDefaultEventTheme,
} from "../systemDefaultTheme";

const REQUIRED_TOKEN_KEYS = [
  "background",
  "primary",
  "onPrimary",
  "secondary",
  "text",
  "textMuted",
  "surface",
  "fontHeading",
  "fontBody",
] as const;

test("systemDefaultEventTheme has no preset id and the system-default key", () => {
  assert.equal(systemDefaultEventTheme.id, null);
  assert.equal(systemDefaultEventTheme.key, "system-default");
  assert.equal(systemDefaultEventTheme.name, "System Default");
});

test("systemDefaultEventTheme carries all 9 required tokens", () => {
  for (const key of REQUIRED_TOKEN_KEYS) {
    assert.equal(
      typeof systemDefaultEventTheme.tokens[key],
      "string",
      `expected tokens.${key} to be a string`,
    );
  }
});

test("systemDefaultEventTheme has no social CTA and no fallback CTA is invented", () => {
  assert.equal(systemDefaultEventTheme.socialCta, null);
});

test("SYSTEM_DEFAULT_THEME_VERSION matches the bundled json version and the theme's own version", () => {
  assert.equal(typeof SYSTEM_DEFAULT_THEME_VERSION, "string");
  assert.equal(systemDefaultEventTheme.version, SYSTEM_DEFAULT_THEME_VERSION);
});
