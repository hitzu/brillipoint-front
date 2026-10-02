import type { TranslationKey } from "../../../i18n/types";
import { EffectName, SessionItem } from "../../../types/session";

export type CtaSource = "download" | "share";

export type ItemStatus = "idle" | "loaded" | "error";

export type ItemLoadState = {
  status: ItemStatus;
  retryCount: number;
};

export type EffectOption = {
  id: EffectName;
  labelKey: TranslationKey;
};

export const EFFECT_OPTIONS: EffectOption[] = [
  { id: "original", labelKey: "carousel.effects.original" },
  { id: "confetti", labelKey: "carousel.effects.confetti" },
  { id: "hearts", labelKey: "carousel.effects.hearts" },
];

export const buildFallbackItems = (
  photoUrls: string[],
  buildAlt: (photoNumber: number) => string,
): SessionItem[] =>
  photoUrls.map((src, index) => ({
    type: "photo",
    src,
    originalSrc: src,
    alt: buildAlt(index + 1),
    index,
  }));
