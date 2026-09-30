import {
  SocialCta,
  SocialCtaChannel,
  SocialCtaSocials,
  ThemeTemplateParams,
} from "../types/themeContract";
import { buildWhatsAppLink } from "./buildWhatsAppLink";
import { Locale, resolveThemeText, ThemeI18nLookup } from "./resolveThemeText";
import { TranslateParams } from "./translate";

/** Fully resolved primary action, ready for a presentational button. */
export interface SocialCtaPrimaryActionViewModel {
  channel: SocialCtaChannel;
  label: string;
  href: string;
}

/**
 * Fully resolved `SocialCta` block, ready for the presentational `SocialCta`
 * component. Every field is either a display string/href or `null`/absent —
 * no further theme knowledge (locale, params, i18n) is needed downstream.
 */
export interface SocialCtaViewModel {
  headline: string | null;
  subtitle: string | null;
  followText: string | null;
  primaryAction: SocialCtaPrimaryActionViewModel | null;
  socials: SocialCtaSocials;
}

/**
 * Pure view-model builder for the theme's `socialCta` block — holds ALL the
 * null-handling/text-resolution/href-building logic so the `SocialCta`
 * component and its container stay props-only and untestable-logic-free.
 *
 * `socialCta` `null`/`undefined` means "hide the whole block" (see
 * `SocialCta` in themeContract.ts) — the frontend never substitutes a
 * fallback CTA of its own, so this returns `null` in that case.
 */
export function buildSocialCtaViewModel(
  socialCta: SocialCta | null | undefined,
  locale: Locale,
  params: ThemeTemplateParams & TranslateParams = {},
  i18n?: ThemeI18nLookup,
): SocialCtaViewModel | null {
  if (!socialCta) {
    return null;
  }

  return {
    headline: resolveThemeText(socialCta.headline, locale, params, i18n),
    subtitle: resolveThemeText(socialCta.subtitle, locale, params, i18n),
    followText: resolveThemeText(socialCta.followText, locale, params, i18n),
    primaryAction: buildPrimaryActionViewModel(
      socialCta.primaryAction,
      locale,
      params,
      i18n,
    ),
    // Render only the present keys — an absent network never appears.
    socials: socialCta.socials ?? {},
  };
}

function buildPrimaryActionViewModel(
  action: SocialCta["primaryAction"],
  locale: Locale,
  params: ThemeTemplateParams & TranslateParams,
  i18n?: ThemeI18nLookup,
): SocialCtaPrimaryActionViewModel | null {
  if (!action) {
    return null;
  }

  const label = resolveThemeText(action.label, locale, params, i18n);
  if (!label) {
    // Label resolves to nothing -> hide the button (contract requirement).
    return null;
  }

  const href =
    action.channel === "whatsapp"
      ? buildWhatsAppLink(action, locale, params, i18n)
      : action.url;

  return { channel: action.channel, label, href };
}
