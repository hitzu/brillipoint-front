import { en } from "../../../i18n/dictionaries/en";
import { es } from "../../../i18n/dictionaries/es";
import type { Dictionary } from "../../../i18n/types";
import type { Locale } from "../../../theme/resolveThemeText";

export type RewardPromoCopy = Dictionary["carousel"]["rewardPromo"];

const REWARD_PROMO_COPY: Record<Locale, RewardPromoCopy> = {
  es: es.carousel.rewardPromo,
  en: en.carousel.rewardPromo,
};

/** Reward promo copy for the guest's language (lives in the i18n dictionary). */
export const getRewardPromoCopy = (locale: Locale): RewardPromoCopy =>
  REWARD_PROMO_COPY[locale];
