import assert from "node:assert/strict";
import test from "node:test";
import { getConfettiColors } from "../confettiColors";
import { systemDefaultPageTheme } from "../systemDefaultPageTheme";
import { EventPageTheme } from "../../types/eventPageTheme";

const PINK_HEX_PATTERN = /#(fff5f7|ec4899|be185d|a855f7|831843|9d174d|f9a8d4|fbcfe8|fce7f3)/i;

test("falls back to the neutral system default palette when no theme is given", () => {
  const colors = getConfettiColors();
  assert.ok(colors.length > 0);
  for (const color of colors) {
    assert.equal(PINK_HEX_PATTERN.test(color), false, `${color} looks pink`);
  }
  assert.ok(colors.includes(systemDefaultPageTheme.primaryButtonBg as string));
});

test("derives colors from the given theme's own palette, not the pink default", () => {
  const theme: EventPageTheme = {
    primaryButtonBg: "#123456",
    secondaryButtonBg: "#654321",
    accentColor: "#abcdef",
    mutedTextColor: "#fedcba",
  };

  const colors = getConfettiColors(theme);

  assert.deepEqual(colors, ["#123456", "#654321", "#abcdef", "#fedcba"]);
});

test("fills in missing individual fields from the system default, never pink", () => {
  const colors = getConfettiColors({ primaryButtonBg: "#123456" });

  assert.equal(colors[0], "#123456");
  for (const color of colors) {
    assert.equal(PINK_HEX_PATTERN.test(color), false, `${color} looks pink`);
  }
});
