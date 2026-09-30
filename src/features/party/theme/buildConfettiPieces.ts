import { ThemeDecorations } from "../types/themeContract";
import { EventPageTheme } from "../types/eventPageTheme";
import { getConfettiColors } from "./confettiColors";
import { CONFETTI_SHAPES, ConfettiShape, isConfettiShape } from "./confettiShapes";

/** Default piece count when `decorations.confetti.amount` is absent — matches the pre-T5 hardcoded count. */
const DEFAULT_AMOUNT = 28;
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
  /** seconds */
  animationDuration: number;
  /** seconds */
  animationDelay: number;
}

const resolveColors = (
  colors: string[] | undefined,
  theme: EventPageTheme | undefined,
): string[] => {
  if (colors && colors.length > 0) {
    return colors;
  }
  return getConfettiColors(theme);
};

const resolveShapes = (shapes: string[] | undefined): readonly ConfettiShape[] => {
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
 *   keeps the pre-T5 default of 28.
 *
 * Pure — no DOM/React — so it can be unit-tested directly; components
 * render the returned pieces (`Splash.tsx`).
 */
export function buildConfettiPieces(
  decorations: ThemeDecorations | undefined,
  theme: EventPageTheme | undefined,
  random: () => number = Math.random,
): ConfettiPiece[] {
  const confetti = decorations?.confetti;
  const colors = resolveColors(confetti?.colors, theme);
  const shapes = resolveShapes(confetti?.shapes);
  const amount = resolveAmount(confetti?.amount);

  return Array.from({ length: amount }, (_, id) => ({
    id,
    shape: shapes[Math.floor(random() * shapes.length)],
    color: colors[Math.floor(random() * colors.length)],
    size: 4 + random() * 6,
    left: random() * 100,
    animationDuration: 3 + random() * 5,
    animationDelay: random() * 4,
  }));
}

export { CONFETTI_SHAPES };
