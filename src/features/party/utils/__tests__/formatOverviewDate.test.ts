import assert from "node:assert/strict";
import test from "node:test";
import { formatOverviewDate } from "../formatOverviewDate";

test("formatOverviewDate keeps the Spanish DD.MM.YYYY format", () => {
  assert.equal(formatOverviewDate("es", "2026-01-05"), "05.01.2026");
  assert.equal(formatOverviewDate("es", "2026-12-24"), "24.12.2026");
});

test("formatOverviewDate uses month-first order for en", () => {
  assert.equal(formatOverviewDate("en", "2026-01-05"), "01.05.2026");
  assert.equal(formatOverviewDate("en", "2026-12-24"), "12.24.2026");
});

test("formatOverviewDate does not shift date-only values across time zones", () => {
  assert.equal(
    formatOverviewDate("es", "2026-05-30T00:00:00.000Z"),
    "30.05.2026",
  );
});

test("formatOverviewDate returns empty for missing input and echoes unparseable input", () => {
  assert.equal(formatOverviewDate("es", undefined), "");
  assert.equal(formatOverviewDate("en", ""), "");
  assert.equal(formatOverviewDate("en", "not a date"), "not a date");
});
