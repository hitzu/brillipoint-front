import assert from "node:assert/strict";
import test from "node:test";
import {
  initialEventThemeState,
  resolveEventThemeState,
} from "../eventThemeState";
import { systemDefaultEventTheme } from "../../theme/systemDefaultTheme";
import { EventTheme } from "../../types/themeContract";

test("initial state is the neutral system default with status 'default'", () => {
  assert.equal(initialEventThemeState.status, "default");
  assert.equal(initialEventThemeState.eventTheme, systemDefaultEventTheme);
  assert.equal(
    initialEventThemeState.pageTheme.pageBackground,
    systemDefaultEventTheme.tokens.background,
  );
});

test("resolves to 'loaded' with the response's eventTheme on success", () => {
  const eventTheme: EventTheme = {
    ...systemDefaultEventTheme,
    id: 7,
    key: "custom",
    name: "Custom",
  };

  const state = resolveEventThemeState({ ok: true, eventTheme });

  assert.equal(state.status, "loaded");
  assert.equal(state.eventTheme, eventTheme);
  assert.equal(state.pageTheme.pageBackground, eventTheme.tokens.background);
});

test("falls back to the neutral system default (never pink) on any error (network, 5xx, 404)", () => {
  const state = resolveEventThemeState({ ok: false });

  assert.equal(state.status, "fallback");
  assert.equal(state.eventTheme, systemDefaultEventTheme);
  assert.equal(
    state.pageTheme.pageBackground,
    systemDefaultEventTheme.tokens.background,
  );
});

test("resolved pageTheme always maps splashIcon.url, never a hardcoded emblem", () => {
  const eventTheme: EventTheme = {
    ...systemDefaultEventTheme,
    images: {
      splashIcon: { path: "x", url: "https://example.com/icon.png" },
    },
  };

  const state = resolveEventThemeState({ ok: true, eventTheme });

  assert.equal(state.pageTheme.splashEmblemUrl, "https://example.com/icon.png");
});
