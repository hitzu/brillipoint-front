import assert from "node:assert/strict";
import { test } from "node:test";

import { buildConfettiPieces } from "../buildConfettiPieces";
import { systemDefaultPageTheme } from "../systemDefaultPageTheme";

test("buildConfettiPieces defaults to 45 pieces when amount is absent", () => {
  const pieces = buildConfettiPieces(undefined, undefined, () => 0);
  assert.equal(pieces.length, 45);
});

test("buildConfettiPieces uses decorations.confetti.amount when present", () => {
  const pieces = buildConfettiPieces(
    { confetti: { amount: 5 } },
    undefined,
    () => 0
  );
  assert.equal(pieces.length, 5);
});

test("buildConfettiPieces clamps amount to a max of 150", () => {
  const pieces = buildConfettiPieces(
    { confetti: { amount: 10_000 } },
    undefined,
    () => 0
  );
  assert.equal(pieces.length, 150);
});

test("buildConfettiPieces clamps a negative amount to 0", () => {
  const pieces = buildConfettiPieces(
    { confetti: { amount: -5 } },
    undefined,
    () => 0
  );
  assert.equal(pieces.length, 0);
});

test("buildConfettiPieces defaults to plain rect shapes when shapes is absent", () => {
  const pieces = buildConfettiPieces(
    { confetti: { amount: 3 } },
    undefined,
    () => 0
  );
  assert.deepEqual(
    pieces.map((p) => p.shape),
    ["rect", "rect", "rect"]
  );
});

test("buildConfettiPieces defaults to plain rect shapes when shapes is an empty array", () => {
  const pieces = buildConfettiPieces(
    { confetti: { amount: 2, shapes: [] } },
    undefined,
    () => 0
  );
  assert.deepEqual(
    pieces.map((p) => p.shape),
    ["rect", "rect"]
  );
});

test("buildConfettiPieces picks the last theme-supplied catalog shape when random is near 1", () => {
  const pieces = buildConfettiPieces(
    { confetti: { amount: 1, shapes: ["heart", "flower"] } },
    undefined,
    () => 0.999
  );
  assert.deepEqual(
    pieces.map((p) => p.shape),
    ["flower"]
  );
});

test("buildConfettiPieces picks the first theme-supplied catalog shape when random is 0", () => {
  const pieces = buildConfettiPieces(
    { confetti: { amount: 1, shapes: ["heart", "flower"] } },
    undefined,
    () => 0
  );
  assert.deepEqual(
    pieces.map((p) => p.shape),
    ["heart"]
  );
});

test("buildConfettiPieces ignores unknown shapes and keeps only catalog ones", () => {
  const pieces = buildConfettiPieces(
    { confetti: { amount: 1, shapes: ["glitter", "star"] } },
    undefined,
    () => 0
  );
  assert.deepEqual(
    pieces.map((p) => p.shape),
    ["star"]
  );
});

test("buildConfettiPieces falls back to default shapes when every supplied shape is unknown", () => {
  const pieces = buildConfettiPieces(
    { confetti: { amount: 1, shapes: ["glitter", "sequin"] } },
    undefined,
    () => 0
  );
  assert.deepEqual(
    pieces.map((p) => p.shape),
    ["rect"]
  );
});

test("buildConfettiPieces uses decorations.confetti.colors when non-empty", () => {
  const pieces = buildConfettiPieces(
    { confetti: { amount: 1, colors: ["#abcdef"] } },
    undefined,
    () => 0
  );
  assert.equal(pieces[0].color, "#abcdef");
});

test("buildConfettiPieces falls back to the theme palette when colors is empty or absent", () => {
  const pieces = buildConfettiPieces(
    { confetti: { amount: 1, colors: [] } },
    systemDefaultPageTheme,
    () => 0
  );
  assert.equal(pieces[0].color, systemDefaultPageTheme.primaryButtonBg);
});

test("buildConfettiPieces falls back to the system default palette when theme is absent", () => {
  const pieces = buildConfettiPieces(undefined, undefined, () => 0);
  assert.equal(pieces[0].color, systemDefaultPageTheme.primaryButtonBg);
});

test("buildConfettiPieces assigns sequential ids", () => {
  const pieces = buildConfettiPieces(
    { confetti: { amount: 3 } },
    undefined,
    () => 0
  );
  assert.deepEqual(
    pieces.map((p) => p.id),
    [0, 1, 2]
  );
});

test("detailed catalog shapes remain recognizable at 20–30px", () => {
  for (const shape of [
    "heart",
    "flower",
    "rose",
    "star",
    "petal",
    "diamond",
    "bow",
    "butterfly",
    "camera",
  ]) {
    for (const random of [0, 0.5, 0.999]) {
      const [piece] = buildConfettiPieces(
        { confetti: { shapes: [shape], amount: 1 } },
        undefined,
        () => random
      );
      assert.equal(piece.shape, shape);
      assert.ok(
        piece.size >= 20 && piece.size <= 30,
        `${shape}: ${piece.size}px`
      );
    }
  }
});

test("simple pieces use smaller 10–16px sizes", () => {
  for (const shape of ["rect", "circle"]) {
    for (const random of [0, 0.999]) {
      const [piece] = buildConfettiPieces(
        { confetti: { shapes: [shape], amount: 1 } },
        undefined,
        () => random
      );
      assert.ok(piece.size >= 10 && piece.size <= 16);
    }
  }
});

test("motion falls slowly and loops with staggered starts so the screen never empties", () => {
  for (const random of [0, 0.5, 0.999]) {
    const [piece] = buildConfettiPieces(undefined, undefined, () => random);
    assert.ok(
      piece.animationDuration >= 4.5 && piece.animationDuration <= 6.5,
      `duration ${piece.animationDuration}`
    );
    // Some pieces start mid-fall (negative delay, upper third only) while the
    // rest enter over time; the loop keeps the top populated.
    assert.ok(piece.animationDelay >= -0.3 * piece.animationDuration);
    assert.ok(piece.animationDelay < 0.6 * piece.animationDuration);
    assert.ok(Math.abs(piece.drift) <= 48);
    assert.ok(Math.abs(piece.initialRotation) <= 25);
    assert.ok(Math.abs(piece.rotation) <= 60);
  }
});

test("pieces sway like paper with a bounded, desynchronized pendulum", () => {
  for (const random of [0, 0.5, 0.999]) {
    const [piece] = buildConfettiPieces(undefined, undefined, () => random);
    assert.ok(piece.sway >= 12 && piece.sway <= 32, `sway ${piece.sway}`);
    assert.ok(piece.swayDuration >= 1.4 && piece.swayDuration <= 2.4);
    assert.ok(piece.swayDelay <= 0 && piece.swayDelay > -piece.swayDuration - 1e-9);
  }
});
