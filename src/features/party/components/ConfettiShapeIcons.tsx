import { ConfettiShape } from "../theme/confettiShapes";

/**
 * Small inline SVGs for the closed confetti shape catalog (T5), one per
 * `ConfettiShape`. Every shape uses `fill="currentColor"` so the piece's CSS
 * `color` (set by `Splash.tsx` from `buildConfettiPieces`) drives its color —
 * no shape-specific styling needed.
 */
const IconRect = () => (
  <svg viewBox="0 0 10 10" fill="currentColor" width="100%" height="100%">
    <rect x="0" y="0" width="10" height="10" />
  </svg>
);

const IconCircle = () => (
  <svg viewBox="0 0 10 10" fill="currentColor" width="100%" height="100%">
    <circle cx="5" cy="5" r="5" />
  </svg>
);

const IconHeart = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
    <path d="M12 21s-7.5-4.6-10.2-9.1C.2 9 1 5.6 4 4.2c2.1-1 4.4-.3 6 1.5 1.6-1.8 3.9-2.5 6-1.5 3 1.4 3.8 4.8 2.2 7.7C19.5 16.4 12 21 12 21z" />
  </svg>
);

const IconFlower = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
    <circle cx="12" cy="6" r="4" />
    <circle cx="12" cy="18" r="4" />
    <circle cx="6" cy="12" r="4" />
    <circle cx="18" cy="12" r="4" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconRose = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
    <path d="M12 2c-3 1.5-4.5 4-3.5 6.5C6 8 3.5 9 3 12c1.5-.5 3-.3 4 .5-1.5 1-2.5 3-2 5.5 1.5-1.5 3.3-2 4.9-1.3C10.6 18.5 11.2 20 12 22c.8-2 1.4-3.5 2.1-5.3 1.6-.7 3.4-.2 4.9 1.3.5-2.5-.5-4.5-2-5.5 1-.8 2.5-1 4-.5-.5-3-3-4-5.5-3.5C16.5 6 15 3.5 12 2z" />
  </svg>
);

const IconStar = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
    <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8-5.1-4.7 6.9-.8z" />
  </svg>
);

const IconPetal = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
    <path d="M12 2c5 3 5 12 0 20-5-8-5-17 0-20z" />
  </svg>
);

export const CONFETTI_SHAPE_ICON: Record<ConfettiShape, () => JSX.Element> = {
  rect: IconRect,
  circle: IconCircle,
  heart: IconHeart,
  flower: IconFlower,
  rose: IconRose,
  star: IconStar,
  petal: IconPetal,
};
