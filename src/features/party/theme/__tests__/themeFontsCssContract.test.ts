import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

// Public party CSS should let the resolved theme's fonts (--ep-font-heading
// / --ep-font-body, set by utils/themeVars.ts) override the hardcoded
// families, while keeping the current family as the fallback so nothing
// changes for events without a font token.
const PUBLIC_PARTY_CSS_FILES = [
  "src/assets/css/fotobooth.module.css",
  "src/assets/css/fotobooth-overview.module.css",
  "src/assets/css/social-media-cta.module.css",
  "src/assets/css/inspiration-v2.module.css",
];

/** Every `font-family: <value>;` declaration's raw value. */
const extractFontFamilyValues = (css: string): string[] => {
  const matches = css.match(/font-family:\s*[^;]+;/g) || [];
  return matches.map((declaration) =>
    declaration.replace(/^font-family:\s*/, "").replace(/;$/, ""),
  );
};

for (const relativePath of PUBLIC_PARTY_CSS_FILES) {
  const cssPath = join(process.cwd(), relativePath);
  const css = readFileSync(cssPath, "utf8");
  const values = extractFontFamilyValues(css);

  test(`${relativePath}: every Dancing Script heading declaration is wrapped in var(--ep-font-heading, ...)`, () => {
    const headingValues = values.filter((value) =>
      value.includes("Dancing Script"),
    );
    for (const value of headingValues) {
      assert.match(
        value,
        /^var\(--ep-font-heading,.*Dancing Script/,
        `bare declaration "font-family: ${value};" must reference var(--ep-font-heading, ...) with "Dancing Script" kept as the fallback`,
      );
    }
  });

  test(`${relativePath}: every DM Sans/Public Sans body declaration is wrapped in var(--ep-font-body, ...)`, () => {
    const bodyValues = values.filter(
      (value) => value.includes("DM Sans") || value.includes("Public Sans"),
    );
    for (const value of bodyValues) {
      assert.match(
        value,
        /^var\(--ep-font-body,.*(DM Sans|Public Sans)/,
        `bare declaration "font-family: ${value};" must reference var(--ep-font-body, ...) with the current family kept as the fallback`,
      );
    }
  });
}

test("_document.tsx loads Inter alongside the other public-facing font families", () => {
  const documentPath = join(process.cwd(), "src/pages/_document.tsx");
  const source = readFileSync(documentPath, "utf8");
  assert.match(source, /family=Inter/);
});
