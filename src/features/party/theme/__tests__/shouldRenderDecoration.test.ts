import assert from "node:assert/strict";
import { test } from "node:test";

import { shouldRenderDecoration } from "../shouldRenderDecoration";

test("shouldRenderDecoration renders when decorations is entirely absent (keeps pre-theme behavior)", () => {
  assert.equal(shouldRenderDecoration(undefined, "confetti"), true);
  assert.equal(shouldRenderDecoration(undefined, "sparkles"), true);
});

test("shouldRenderDecoration hides when decorations is present but the block is omitted", () => {
  assert.equal(shouldRenderDecoration({}, "confetti"), false);
  assert.equal(shouldRenderDecoration({ sparkles: { enabled: true } }, "confetti"), false);
});

test("shouldRenderDecoration renders when the block is present without an explicit enabled flag", () => {
  assert.equal(shouldRenderDecoration({ confetti: {} }, "confetti"), true);
});

test("shouldRenderDecoration renders when enabled is explicitly true", () => {
  assert.equal(
    shouldRenderDecoration({ confetti: { enabled: true } }, "confetti"),
    true,
  );
});

test("shouldRenderDecoration hides when enabled is explicitly false", () => {
  assert.equal(
    shouldRenderDecoration({ confetti: { enabled: false } }, "confetti"),
    false,
  );
  assert.equal(
    shouldRenderDecoration({ sparkles: { enabled: false } }, "sparkles"),
    false,
  );
});
