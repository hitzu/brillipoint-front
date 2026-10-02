import assert from "node:assert/strict";
import test from "node:test";
import { en } from "../dictionaries/en";
import { es } from "../dictionaries/es";
import { createThemeI18nLookup, formatDate, t, tPlural } from "../translate";
import { isLocale, resolveLocale } from "../resolveLocale";

const collectKeys = (node: unknown, prefix = ""): string[] =>
  Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
    typeof value === "string" ? [`${prefix}${key}`] : collectKeys(value, `${prefix}${key}.`),
  );

test("es and en dictionaries expose exactly the same keys", () => {
  assert.deepEqual(collectKeys(en).sort(), collectKeys(es).sort());
});

test("no dictionary entry is empty", () => {
  for (const [name, dictionary] of Object.entries({ es, en })) {
    for (const key of collectKeys(dictionary)) {
      const value = key.split(".").reduce<any>((node, part) => node[part], dictionary);
      assert.ok(value.trim().length > 0, `${name}.${key} is empty`);
    }
  }
});

test("t returns the string for the locale", () => {
  assert.equal(t("es", "common.language"), "Idioma");
  assert.equal(t("en", "common.language"), "Language");
});

test("t interpolates {{params}}", () => {
  assert.equal(
    t("es", "common.photoCounter", { current: 2, total: 5 }),
    "2 / 5",
  );
});

test("tPlural picks the plural form for the locale and exposes {{count}}", () => {
  assert.equal(tPlural("es", "common.sessions", 1), "1 sesión");
  assert.equal(tPlural("es", "common.sessions", 3), "3 sesiones");
  assert.equal(tPlural("en", "common.sessions", 1), "1 session");
  assert.equal(tPlural("en", "common.sessions", 0), "0 sessions");
});

test("formatDate formats with the locale", () => {
  const date = new Date(2026, 10, 2, 12);
  const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };
  assert.equal(formatDate("es", date, options), "2 de noviembre");
  assert.equal(formatDate("en", date, options), "November 2");
});

test("createThemeI18nLookup resolves dotted string keys and ignores the rest", () => {
  const lookup = createThemeI18nLookup("en");
  assert.equal(lookup("common.language"), "Language");
  assert.equal(lookup("common"), undefined);
  assert.equal(lookup("common.sessions"), undefined);
  assert.equal(lookup("does.not.exist"), undefined);
});

test("isLocale only accepts supported locales", () => {
  assert.equal(isLocale("es"), true);
  assert.equal(isLocale("en"), true);
  assert.equal(isLocale("fr"), false);
  assert.equal(isLocale(undefined), false);
});

test("resolveLocale prefers the ?lang query param", () => {
  assert.equal(
    resolveLocale({ query: "en", stored: "es", browserLanguages: ["es-MX"] }),
    "en",
  );
});

test("resolveLocale falls back to the stored choice, then the browser", () => {
  assert.equal(resolveLocale({ query: "fr", stored: "en", browserLanguages: ["es"] }), "en");
  assert.equal(resolveLocale({ stored: null, browserLanguages: ["fr-FR", "en-US"] }), "en");
  assert.equal(resolveLocale({ browserLanguages: ["ES-mx"] }), "es");
});

test("resolveLocale defaults to es", () => {
  assert.equal(resolveLocale({}), "es");
  assert.equal(resolveLocale({ browserLanguages: ["de-DE"] }), "es");
});
