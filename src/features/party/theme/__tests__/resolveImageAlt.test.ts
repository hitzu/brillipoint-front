import assert from "node:assert/strict";
import { test } from "node:test";

import { resolveImageAlt } from "../resolveImageAlt";

test("resolveImageAlt returns the requested locale when present", () => {
  assert.equal(
    resolveImageAlt({ es: "Logo del evento", en: "Event logo" }, "es"),
    "Logo del evento",
  );
});

test("resolveImageAlt falls back to the other locale when the requested one is missing", () => {
  assert.equal(resolveImageAlt({ en: "Event logo" }, "es"), "Event logo");
});

test("resolveImageAlt falls back to the other locale when the requested one is an empty string", () => {
  assert.equal(
    resolveImageAlt({ es: "", en: "Event logo" }, "es"),
    "Event logo",
  );
});

test("resolveImageAlt returns '' when alt is undefined", () => {
  assert.equal(resolveImageAlt(undefined, "es"), "");
});

test("resolveImageAlt returns '' when both locales are missing", () => {
  assert.equal(resolveImageAlt({}, "es"), "");
});

test("resolveImageAlt defaults to DEFAULT_LOCALE when no locale is given", () => {
  assert.equal(
    resolveImageAlt({ es: "Logo del evento", en: "Event logo" }),
    "Logo del evento",
  );
});
