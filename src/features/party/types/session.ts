export type SessionItem = {
  type: "photo" | "video";
  /** Display URL — coalesced (`minimizedUrl || url`). Never hides a photo. For a video, the .mp4. */
  src: string;
  /** Video only: the poster image shown before playback. */
  posterSrc?: string;
  /** Always the original, full-quality URL. Use for downloads/share/export. */
  originalSrc: string;
  alt: string;
  index: number;
  photoPosition?: number;
};

export type EffectName = "original" | "confetti" | "hearts";

export type ExportVariant = "original" | "polaroid";
