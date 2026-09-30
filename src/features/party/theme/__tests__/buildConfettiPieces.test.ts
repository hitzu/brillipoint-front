import assert from "node:assert/strict";
import { test } from "node:test";

import { buildConfettiPieces } from "../buildConfettiPieces";
import { systemDefaultPageTheme } from "../systemDefaultPageTheme";

test("buildConfettiPieces defaults to 28 pieces when amount is absent", () => {
  const pieces = buildConfettiPieces(undefined, undefined, () => 0);
  assert.equal(pieces.length, 28);
});

test("buildConfettiPieces uses decorations.confetti.amount when present", () => {
  const pieces = buildConfettiPieces(
    { confetti: { amount: 5 } },
    undefined,
    () => 0,
  );
  assert.equal(pieces.length, 5);
});

test("buildConfettiPieces clamps amount to a max of 150", () => {
  const pieces = buildConfettiPieces(
    { confetti: { amount: 10_000 } },
    undefined,
    () => 0,
  );
  assert.equal(pieces.length, 150);
});

test("buildConfettiPieces clamps a negative amount to 0", () => {
  const pieces = buildConfettiPieces(
    { confetti: { amount: -5 } },
    undefined,
    () => 0,
  );
  assert.equal(pieces.length, 0);
});

test("buildConfettiPieces defaults to plain rect shapes when shapes is absent", () => {
  const pieces = buildConfettiPieces({ confetti: { amount: 3 } }, undefined, () => 0);
  assert.deepEqual(
    pieces.map((p) => p.shape),
    ["rect", "rect", "rect"],
  );
});

test("buildConfettiPieces defaults to plain rect shapes when shapes is an empty array", () => {
  const pieces = buildConfettiPieces(
    { confetti: { amount: 2, shapes: [] } },
    undefined,
    () => 0,
  );
  assert.deepEqual(pieces.map((p) => p.shape), ["rect", "rect"]);
});

test("buildConfettiPieces picks the last theme-supplied catalog shape when random is near 1", () => {
  const pieces = buildConfettiPieces(
    { confetti: { amount: 1, shapes: ["heart", "flower"] } },
    undefined,
    () => 0.999,
  );
  assert.deepEqual(pieces.map((p) => p.shape), ["flower"]);
});

test("buildConfettiPieces picks the first theme-supplied catalog shape when random is 0", () => {
  const pieces = buildConfettiPieces(
    { confetti: { amount: 1, shapes: ["heart", "flower"] } },
    undefined,
    () => 0,
  );
  assert.deepEqual(pieces.map((p) => p.shape), ["heart"]);
});

test("buildConfettiPieces ignores unknown shapes and keeps only catalog ones", () => {
  const pieces = buildConfettiPieces(
    { confetti: { amount: 1, shapes: ["glitter", "star"] } },
    undefined,
    () => 0,
  );
  assert.deepEqual(pieces.map((p) => p.shape), ["star"]);
});

test("buildConfettiPieces falls back to default shapes when every supplied shape is unknown", () => {
  const pieces = buildConfettiPieces(
    { confetti: { amount: 1, shapes: ["glitter", "sequin"] } },
    undefined,
    () => 0,
  );
  assert.deepEqual(pieces.map((p) => p.shape), ["rect"]);
});

test("buildConfettiPieces uses decorations.confetti.colors when non-empty", () => {
  const pieces = buildConfettiPieces(
    { confetti: { amount: 1, colors: ["#abcdef"] } },
    undefined,
    () => 0,
  );
  assert.equal(pieces[0].color, "#abcdef");
});

test("buildConfettiPieces falls back to the theme palette when colors is empty or absent", () => {
  const pieces = buildConfettiPieces(
    { confetti: { amount: 1, colors: [] } },
    systemDefaultPageTheme,
    () => 0,
  );
  assert.equal(pieces[0].color, systemDefaultPageTheme.primaryButtonBg);
});

test("buildConfettiPieces falls back to the system default palette when theme is absent", () => {
  const pieces = buildConfettiPieces(undefined, undefined, () => 0);
  assert.equal(pieces[0].color, systemDefaultPageTheme.primaryButtonBg);
});

test("buildConfettiPieces assigns sequential ids", () => {
  const pieces = buildConfettiPieces({ confetti: { amount: 3 } }, undefined, () => 0);
  assert.deepEqual(pieces.map((p) => p.id), [0, 1, 2]);
});
