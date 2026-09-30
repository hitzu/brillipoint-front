import assert from "node:assert/strict";
import { test } from "node:test";

import { resolveSplashLayout } from "../resolveSplashLayout";

test("resolveSplashLayout keeps the ambient layers when there is no background", () => {
  assert.deepEqual(resolveSplashLayout(undefined), {
    hasBackground: false,
    showAmbientLayers: true,
    showScrim: false,
  });
  assert.deepEqual(resolveSplashLayout({}), {
    hasBackground: false,
    showAmbientLayers: true,
    showScrim: false,
  });
});

test("resolveSplashLayout ignores a cover-only theme (cover is never the background)", () => {
  const layout = resolveSplashLayout({
    cover: { url: "https://cdn.test/cover.png", path: "cover.png" },
  });
  assert.equal(layout.hasBackground, false);
  assert.equal(layout.showAmbientLayers, true);
});

test("resolveSplashLayout swaps ambient layers for a scrim when a background exists", () => {
  assert.deepEqual(
    resolveSplashLayout({
      background: { url: "https://cdn.test/bg.jpg", path: "bg.jpg" },
    }),
    { hasBackground: true, showAmbientLayers: false, showScrim: true }
  );
});

test("resolveSplashLayout treats an empty background url as absent", () => {
  assert.equal(
    resolveSplashLayout({ background: { url: "", path: "" } }).hasBackground,
    false
  );
});
