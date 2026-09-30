import { ThemeDecorations } from "../types/themeContract";

type DecorationKey = keyof ThemeDecorations;

/**
 * Whether a given decoration (`confetti` or `sparkles`) should render.
 *
 * - `decorations` entirely absent → `true` (keep today's behavior: the
 *   decoration always rendered before this theme layer existed).
 * - `decorations` present but this specific block absent → `false` (an
 *   explicit theme layer that omits the block opts out of it).
 * - Block present → renders unless explicitly disabled (`enabled === false`).
 */
export function shouldRenderDecoration(
  decorations: ThemeDecorations | undefined,
  key: DecorationKey,
): boolean {
  if (decorations === undefined) {
    return true;
  }

  const block = decorations[key];
  if (block === undefined) {
    return false;
  }

  return block.enabled !== false;
}
