import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const cssPath = join(
  process.cwd(),
  "src/assets/css/social-media-cta.module.css",
);
const css = readFileSync(cssPath, "utf8");

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

test("the page-variant social row wraps instead of overflowing horizontally with 5 channels", () => {
  const rule = extractRule(css, ".pageSocialRow");
  assert.match(rule, /flex-wrap:\s*wrap/);
});

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// Official brand fills (every gradient stop included) must keep white text AA-readable.
test("primary-action brand fills keep white text at WCAG AA", () => {
  const tokens = extractRule(css, ".channelWhatsapp,\n.channelFacebook,\n.channelInstagram,\n.channelTiktok");
  for (const name of ["whatsapp", "facebook", "instagram", "tiktok"]) {
    const decl = new RegExp(`--social-${name}-bg:([^;]+);`).exec(tokens);
    assert.ok(decl, `missing --social-${name}-bg`);
    const stops = decl[1].match(/#[\da-f]{6}/gi) ?? [];
    assert.ok(stops.length > 0);
    for (const stop of stops) {
      assert.ok(contrast(stop, "#ffffff") >= 4.5, `${name} ${stop} vs white is below 4.5`);
    }
  }
  for (const name of ["whatsapp", "facebook", "instagram", "tiktok"]) {
    // The per-channel rule (not the shared custom-property block) sets the text color.
    const rule = new RegExp(`background:\\s*var\\(--social-${name}-bg\\);\\s*color:\\s*#ffffff`, "i");
    assert.match(css, rule, `${name} primary action must use white text`);
  }
});

// Instagram + TikTok + Facebook must fit on one row inside a 390px viewport.
test("page-variant social chips stay compact enough for one row on mobile", () => {
  const rule = extractRule(css, ".pageSocialBtn");
  assert.match(rule, /padding:\s*0 10px/);
  assert.match(rule, /font-size:\s*12px/);
  assert.match(extractRule(css, ".pageSocialRow"), /gap:\s*6px/);
});
