import { ThemeDecorations } from "../types/themeContract";
import { EventPageTheme } from "../types/eventPageTheme";
import { getConfettiColors } from "./confettiColors";
import {
  CONFETTI_SHAPES,
  ConfettiShape,
  isConfettiShape,
} from "./confettiShapes";

/** Default piece count when `decorations.confetti.amount` is absent; pieces loop, so this is the steady on-screen density. */
const DEFAULT_AMOUNT = 45;
/** Hard cap so a theme-supplied `amount` can never render an unbounded number of pieces. */
const MAX_AMOUNT = 150;
/** Shapes used when `decorations.confetti.shapes` is absent or empty — the pre-T5 look. */
const DEFAULT_SHAPES: readonly ConfettiShape[] = ["rect"];

export interface ConfettiPiece {
  id: number;
  shape: ConfettiShape;
  color: string;
  /** px */
  size: number;
  /** percent, 0-100 */
  left: number;
  /** Seconds for one full fall; the fall loops so the screen keeps refilling. */
  animationDuration: number;
  /** Seconds; negative values start the piece mid-fall (upper third only). */
  animationDelay: number;
  /** Horizontal travel in px. */
  drift: number;
  /** Degrees; small angles retain recognizable silhouettes. */
  initialRotation: number;
  /** Degrees of pendulum tilt while swaying. */
  rotation: number;
  /** Horizontal pendulum amplitude in px (paper-like flutter). */
  sway: number;
  /** Seconds for one sway half-cycle. */
  swayDuration: number;
  /** Seconds, always <= 0, so pieces sway out of phase from the first frame. */
  swayDelay: number;
}

const resolveColors = (
  colors: string[] | undefined,
  theme: EventPageTheme | undefined
): string[] => {
  if (colors && colors.length > 0) {
    return colors;
  }
  return getConfettiColors(theme);
};

const resolveShapes = (
  shapes: string[] | undefined
): readonly ConfettiShape[] => {
  if (!shapes || shapes.length === 0) {
    return DEFAULT_SHAPES;
  }
  const known = shapes.filter(isConfettiShape);
  return known.length > 0 ? known : DEFAULT_SHAPES;
};

const resolveAmount = (amount: number | undefined): number => {
  if (amount === undefined) {
    return DEFAULT_AMOUNT;
  }
  return Math.max(0, Math.min(amount, MAX_AMOUNT));
};

/**
 * Builds the confetti pieces for the splash screen from the resolved theme,
 * with an injectable `random` (defaults to `Math.random`) so callers (and
 * tests) get deterministic output.
 *
 * - Colors: `decorations.confetti.colors` when non-empty, else the theme's
 *   own palette via `getConfettiColors` (T6).
 * - Shapes: `decorations.confetti.shapes` filtered against the closed
 *   catalog (`confettiShapes.ts`); unknown values are dropped; empty/absent
 *   (after filtering) falls back to plain `rect` pieces.
 * - Amount: `decorations.confetti.amount`, clamped to `[0, 150]`; absent
 *   uses the default of 45.
 * - Motion: slow looping fall with staggered (partly negative) delays so the
 *   top never empties, plus a desynchronized pendulum sway for a paper feel.
 *
 * Pure — no DOM/React — so it can be unit-tested directly; components
 * render the returned pieces (`Splash.tsx`).
 */
export function buildConfettiPieces(
  decorations: ThemeDecorations | undefined,
  theme: EventPageTheme | undefined,
  random: () => number = Math.random
): ConfettiPiece[] {
  const confetti = decorations?.confetti;
  const colors = resolveColors(confetti?.colors, theme);
  const shapes = resolveShapes(confetti?.shapes);
  const amount = resolveAmount(confetti?.amount);

  return Array.from({ length: amount }, (_, id) => {
    const shape = shapes[Math.floor(random() * shapes.length)];
    const simple = shape === "rect" || shape === "circle";
    const animationDuration = 4.5 + random() * 2;
    const swayDuration = 1.4 + random();
    return {
      id,
      shape,
      color: colors[Math.floor(random() * colors.length)],
      size: simple ? 10 + random() * 6 : 20 + random() * 10,
      left: 3 + random() * 94,
      animationDuration,
      animationDelay: animationDuration * (-0.3 + random() * 0.9),
      drift: -48 + random() * 96,
      initialRotation: -25 + random() * 50,
      rotation: -60 + random() * 120,
      sway: 12 + random() * 20,
      swayDuration,
      swayDelay: -random() * swayDuration,
    };
  });
}

export { CONFETTI_SHAPES };
