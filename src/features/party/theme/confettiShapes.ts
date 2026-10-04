/**
 * Closed catalog of confetti piece shapes (T5). Kept separate from
 * `buildConfettiPieces` so both the pure builder and the presentational SVG
 * icon set (`components/ConfettiShapeIcons.tsx`) share the same source of
 * truth for "which shapes exist".
 *
 * Open point: the backend
 * (`bookandsign-api`) does not yet validate `decorations.confetti.shapes`
 * against this same catalog.
 */
export const CONFETTI_SHAPES = [
  "rect",
  "circle",
  "heart",
  "flower",
  "rose",
  "star",
  "petal",
  "diamond",
  "bow",
  "butterfly",
  "camera",
] as const;

export type ConfettiShape = (typeof CONFETTI_SHAPES)[number];

export function isConfettiShape(value: string): value is ConfettiShape {
  return (CONFETTI_SHAPES as readonly string[]).includes(value);
}
