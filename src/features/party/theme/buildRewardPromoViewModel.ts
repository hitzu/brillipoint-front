import { RewardPromo, ThemeTemplateParams } from "../types/themeContract";
import { Locale, resolveThemeText, ThemeI18nLookup } from "./resolveThemeText";
import { TranslateParams } from "./translate";

/**
 * Fully resolved `rewardPromo` block, ready for the gift modal and the
 * lightbox share-confirm. `title` `null` means "use the i18n default
 * headline"; `disclaimer` `null` means "render no disclaimer".
 */
export interface RewardPromoViewModel {
  handle: string;
  title: string | null;
  disclaimer: string | null;
}

/**
 * Pure view-model builder for the theme's `rewardPromo` block.
 * `null`/`undefined` means "hide the promo" — the frontend never substitutes
 * a fallback promo of its own, so this returns `null` in that case.
 */
export function buildRewardPromoViewModel(
  rewardPromo: RewardPromo | null | undefined,
  locale: Locale,
  params: ThemeTemplateParams & TranslateParams = {},
  i18n?: ThemeI18nLookup,
): RewardPromoViewModel | null {
  if (!rewardPromo) {
    return null;
  }

  return {
    handle: rewardPromo.handle,
    title: resolveThemeText(rewardPromo.title, locale, params, i18n),
    disclaimer: resolveThemeText(rewardPromo.disclaimer, locale, params, i18n),
  };
}
