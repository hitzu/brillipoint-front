import { ThemeImages } from "../types/themeContract";

export interface SplashLayout {
  hasBackground: boolean;
  /** Themed gradient + blobs; they would cover a background photo. */
  showAmbientLayers: boolean;
  /** Bottom dark gradient that keeps text legible over the photo. */
  showScrim: boolean;
}

/**
 * Decides which splash layers render. Only `images.background` switches the
 * splash into photo mode; `cover` never does.
 */
export function resolveSplashLayout(images?: ThemeImages): SplashLayout {
  const hasBackground = Boolean(images?.background?.url);

  return {
    hasBackground,
    showAmbientLayers: !hasBackground,
    showScrim: hasBackground,
  };
}
