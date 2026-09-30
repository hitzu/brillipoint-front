import assert from "node:assert/strict";
import test from "node:test";
import { resolveThemeText } from "../resolveThemeText";

test("returns null for an undefined ThemeText", () => {
  assert.equal(resolveThemeText(undefined, "es"), null);
});

test("returns null for a null ThemeText", () => {
  assert.equal(resolveThemeText(null, "es"), null);
});

test("picks the requested locale from an inline text pair", () => {
  const result = resolveThemeText({ text: { es: "Hola", en: "Hello" } }, "es");
  assert.equal(result, "Hola");
});

test("falls back es -> en when the requested locale is missing", () => {
  const result = resolveThemeText({ text: { en: "Hello" } }, "es");
  assert.equal(result, "Hello");
});

test("falls back en -> es when the requested locale is missing", () => {
  const result = resolveThemeText({ text: { es: "Hola" } }, "en");
  assert.equal(result, "Hola");
});

test("returns null when both locales are missing or empty", () => {
  assert.equal(resolveThemeText({ text: {} }, "es"), null);
  assert.equal(resolveThemeText({ text: { es: "", en: "" } }, "es"), null);
});

test("interpolates params into the resolved inline text", () => {
  const result = resolveThemeText(
    { text: { es: "Hola {{name}}" } },
    "es",
    { name: "Ana" },
  );
  assert.equal(result, "Hola Ana");
});

test("resolves the key variant via the injected i18n lookup, merging params (own params win)", () => {
  const i18n = (key: string) => (key === "cta.headline" ? "Hola {{name}}, de {{brandName}}" : undefined);
  const result = resolveThemeText(
    { key: "cta.headline", params: { name: "Override" } },
    "es",
    { name: "Ana", brandName: "Acme" },
    i18n,
  );
  assert.equal(result, "Hola Override, de Acme");
});

test("returns null when the i18n key is missing", () => {
  const i18n = () => undefined;
  const result = resolveThemeText({ key: "unknown.key" }, "es", {}, i18n);
  assert.equal(result, null);
});

test("returns null for the key variant when no i18n lookup is injected", () => {
  const result = resolveThemeText({ key: "cta.headline" }, "es");
  assert.equal(result, null);
});
