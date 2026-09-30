import assert from "node:assert/strict";
import test from "node:test";
import {
  CONFETTI_OVERLAY_COLORS,
  HEARTS_OVERLAY_COLOR,
  POLAROID_FOOTER_DATE_COLOR,
  POLAROID_FOOTER_TITLE_COLOR,
  fitNaturalSize,
} from "../generateStaticExportAsset";

const PINK_PATTERN = /(ec4899|be185d|9d174d|f9a8d4|236,\s?72,\s?153|190,\s?24,\s?93|91,\s?33,\s?72)/i;

// This module has no caller today (dead code, verified via repo-wide grep):
// it never receives a resolved `EventPageTheme`, so its color literals fall
// back to the neutral system default rather than a per-event theme.
test("export color literals fall back to the neutral system default, never pink", () => {
  for (const color of CONFETTI_OVERLAY_COLORS) {
    assert.equal(PINK_PATTERN.test(color), false, `${color} looks pink`);
  }
  assert.equal(PINK_PATTERN.test(HEARTS_OVERLAY_COLOR), false);
  assert.equal(PINK_PATTERN.test(POLAROID_FOOTER_TITLE_COLOR), false);
  assert.equal(PINK_PATTERN.test(POLAROID_FOOTER_DATE_COLOR), false);
});

test("fitNaturalSize keeps behavior unchanged (unrelated to color values)", () => {
  assert.deepEqual(fitNaturalSize(3200, 1600), { width: 1600, height: 800 });
  assert.deepEqual(fitNaturalSize(800, 600), { width: 800, height: 600 });
});
