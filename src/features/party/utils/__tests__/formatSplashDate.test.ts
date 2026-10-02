import assert from "node:assert/strict";
import test from "node:test";
import { formatSplashDate } from "../formatSplashDate";

test("formatSplashDate keeps the Spanish day · MON · year format", () => {
  assert.equal(formatSplashDate("es", "2026-01-05"), "05 · ENE · 2026");
  assert.equal(formatSplashDate("es", "2026-08-30"), "30 · AGO · 2026");
  assert.equal(formatSplashDate("es", "2026-09-15"), "15 · SEP · 2026");
  assert.equal(formatSplashDate("es", "2026-12-24"), "24 · DIC · 2026");
});

test("formatSplashDate uses English month abbreviations for en", () => {
  assert.equal(formatSplashDate("en", "2026-01-05"), "05 · JAN · 2026");
  assert.equal(formatSplashDate("en", "2026-08-30"), "30 · AUG · 2026");
  assert.equal(formatSplashDate("en", "2026-12-24"), "24 · DEC · 2026");
});

test("formatSplashDate does not shift date-only values across time zones", () => {
  assert.equal(
    formatSplashDate("en", "2026-05-30T00:00:00.000Z".slice(0, 10)),
    "30 · MAY · 2026",
  );
});

test("formatSplashDate returns undefined for empty input and echoes unparseable input", () => {
  assert.equal(formatSplashDate("es", undefined), undefined);
  assert.equal(formatSplashDate("es", ""), undefined);
  assert.equal(formatSplashDate("en", "not a date"), "not a date");
});
