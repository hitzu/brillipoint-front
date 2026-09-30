import assert from "node:assert/strict";
import test from "node:test";
import {
  contrastRatio,
  SOCIAL_SECONDARY_CHIP_COLORS,
} from "../socialSecondaryChipColors";

test("each fixed secondary chip foreground/background pair meets WCAG AA (4.5:1) for text on a solid fill", () => {
  for (const [channel, { background, foreground }] of Object.entries(
    SOCIAL_SECONDARY_CHIP_COLORS,
  )) {
    const ratio = contrastRatio(foreground, background);
    assert.ok(
      ratio >= 4.5,
      `${channel} contrast ratio ${ratio.toFixed(2)} is below the 4.5:1 WCAG AA threshold`,
    );
  }
});

test("contrastRatio is symmetric and treats black on white as maximum contrast", () => {
  assert.ok(Math.abs(contrastRatio("#000000", "#ffffff") - 21) < 0.01);
  assert.equal(
    contrastRatio("#000000", "#ffffff"),
    contrastRatio("#ffffff", "#000000"),
  );
});
