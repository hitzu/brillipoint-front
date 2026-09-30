import { SocialCtaWhatsappAction, ThemeTemplateParams } from "../types/themeContract";
import { resolveThemeText, Locale, ThemeI18nLookup } from "./resolveThemeText";
import { TranslateParams } from "./translate";

/**
 * Builds a `https://wa.me/<phone>?text=<encoded>` link from a WhatsApp
 * primary action. When `message` resolves to `null` or an empty string,
 * the `text` query param is omitted entirely.
 */
export function buildWhatsAppLink(
  action: SocialCtaWhatsappAction,
  locale: Locale,
  params: ThemeTemplateParams & TranslateParams = {},
  i18n?: ThemeI18nLookup,
): string {
  const message = resolveThemeText(action.message, locale, params, i18n);
  if (!message) {
    return `https://wa.me/${action.phone}`;
  }
  return `https://wa.me/${action.phone}?text=${encodeURIComponent(message)}`;
}
