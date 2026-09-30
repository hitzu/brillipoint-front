import assert from "node:assert/strict";
import test from "node:test";
import {
  getFreshThemeRequestOptions,
  isFreshThemeCacheEnabled,
} from "../freshThemeCache";

test("fresh theme mode is enabled only after router readiness and exact cache=off", () => {
  assert.equal(isFreshThemeCacheEnabled(false, "off"), false);
  assert.equal(isFreshThemeCacheEnabled(true, "off"), true);
  assert.equal(isFreshThemeCacheEnabled(true, "false"), false);
  assert.equal(isFreshThemeCacheEnabled(true, ["off"]), false);
  assert.equal(isFreshThemeCacheEnabled(true, undefined), false);
});

test("fresh theme requests add only the cache=off query parameter", () => {
  assert.deepEqual(getFreshThemeRequestOptions(true), {
    params: { cache: "off" },
  });
  assert.equal(getFreshThemeRequestOptions(false), undefined);
});
