import { useMemo } from "react";
import { EventTheme, ThemeTemplateParams } from "../types/themeContract";
import { TranslateParams } from "../theme/translate";
import {
  buildRewardPromoViewModel,
  RewardPromoViewModel,
} from "../theme/buildRewardPromoViewModel";
import { useT } from "../i18n/LocaleProvider";

/**
 * Container hook: builds the ready-to-render `RewardPromoViewModel` from the
 * backend-resolved `eventTheme`, or `null` to hide the promo (gift button,
 * gift modal, lightbox tag copy). Mirrors `useSocialCtaViewModel`.
 */
export function useRewardPromoViewModel(
  eventTheme: EventTheme,
): RewardPromoViewModel | null {
  const { locale, themeI18n } = useT();

  return useMemo(
    () =>
      buildRewardPromoViewModel(
        eventTheme.rewardPromo,
        locale,
        eventTheme.params as (ThemeTemplateParams & TranslateParams) | undefined,
        themeI18n,
      ),
    [eventTheme.rewardPromo, eventTheme.params, locale, themeI18n],
  );
}
