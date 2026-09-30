import { ConfettiShape } from "../theme/confettiShapes";

/**
 * Small inline SVGs for the closed confetti shape catalog (T5), one per
 * `ConfettiShape`. Every shape uses `currentColor` for fills or strokes so the piece's CSS
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
    <path
      fillRule="evenodd"
      d="M12 2c3-2 5 2 4 5 3-2 7 0 6 3-.3 2-2 3-4 3 3 2 3 6 0 7-2 1-4-1-6-3-2 2-4 4-6 3-3-1-3-5 0-7-2 0-4-1-4-3-1-3 3-5 6-3-1-3 1-7 4-5Zm0 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
    />
  </svg>
);

const IconRose = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    width="100%"
    height="100%"
  >
    <path d="M8 4c1-3 6-3 8 0 4 0 6 4 4 7-1 4-5 6-8 6s-7-2-8-6C2 8 4 4 8 4Z" />
    <path d="M8 4c-3 3 0 8 4 9 4-1 7-6 4-9M7 9c2-4 8-4 10 0M10 7c-1-3 5-3 4 0M5 12l7 3 7-3M12 17v6" />
    <path
      d="M12 21c-4 0-6-2-6-4 3 0 5 1 6 4Zm0 1c4 0 6-2 6-4-3 0-5 1-6 4Z"
      fill="currentColor"
      stroke="none"
    />
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

const IconDiamond = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinejoin="round"
    width="100%"
    height="100%"
  >
    <path d="m2 8 5-5h10l5 5-10 14L2 8Zm0 0h20M7 3 9 8l3 14L15 8l2-5M9 8l3-5 3 5" />
  </svg>
);

const IconBow = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
    <path
      fillRule="evenodd"
      d="M10 9C6 4 1 3 1 7v8c0 3 5 1 9-1l-4 7 4-1 2-6 2 6 4 1-4-7c4 2 9 4 9 1V7c0-4-5-3-9 2Zm-2 1C5 7 3 6 3 8v5c0 1 3 0 5-2Zm8 0c3-3 5-4 5-2v5c0 1-3 0-5-2Z"
    />
    <rect x="10" y="8" width="4" height="7" rx="2" />
  </svg>
);

const IconButterfly = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
    <path
      fillRule="evenodd"
      d="M11 10C7 1 1 1 1 7c0 4 2 6 5 6-5 2-4 8-1 8 3 0 5-3 6-7Zm-3-1C6 5 3 4 3 7c0 2 2 3 5 2ZM13 10c4-9 10-9 10-3 0 4-2 6-5 6 5 2 4 8 1 8-3 0-5-3-6-7Zm3-1c2-4 5-5 5-2 0 2-2 3-5 2Z"
    />
    <path
      d="M12 7v11m0-11-2-3m2 3 2-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const IconCamera = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinejoin="round"
    width="100%"
    height="100%"
  >
    <path d="M3 7h4l2-3h6l2 3h4v13H3Z" />
    <circle cx="12" cy="13" r="4" />
    <circle cx="18.5" cy="9.5" r="1" fill="currentColor" stroke="none" />
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
  diamond: IconDiamond,
  bow: IconBow,
  butterfly: IconButterfly,
  camera: IconCamera,
};
