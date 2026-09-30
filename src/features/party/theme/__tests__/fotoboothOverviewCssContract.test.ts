import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const cssPath = join(
  process.cwd(),
  "src/assets/css/fotobooth-overview.module.css",
);
const css = readFileSync(cssPath, "utf8");

// Isolates the top-level `.btnSecondary { ... }` rule (not the
// `.mirrorActions .btnSecondary` or `.btnSecondary:active` variants).
const extractRule = (source: string, selector: string) => {
  const pattern = new RegExp(
    `(?:^|\\n)${selector.replace(/[.[\]]/g, "\\$&")}\\s*\\{([^}]*)\\}`,
  );
  const match = pattern.exec(source);
  if (!match) {
    throw new Error(`Rule ${selector} not found in ${cssPath}`);
  }
  return match[1];
};

// The button has a transparent fill, so its text sits on the page background.
// `--ep-secondary-btn-text` is the foreground for a *filled* secondary button
// (often white) and is unreadable here; `--ep-text` is validated against the
// page background by the backend.
test("the 'Compartir enlace' outline button (.btnSecondary) uses the page text role", () => {
  const rule = extractRule(css, ".btnSecondary");
  assert.match(rule, /background:\s*transparent/);
  assert.match(rule, /(?:^|\n)\s*color:\s*var\(--ep-text,/);
  assert.doesNotMatch(rule, /color:\s*var\(--ep-secondary-btn-text/);
});
