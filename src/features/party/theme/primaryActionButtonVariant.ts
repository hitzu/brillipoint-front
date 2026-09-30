import { SocialCtaChannel } from "../types/themeContract";

/**
 * CSS Modules class name (from `social-media-cta.module.css`) that gives the
 * `PrimaryActionButton` its per-channel brand design (T4b): each social
 * network gets a distinct look (WhatsApp green, Facebook blue, Instagram
 * gradient, TikTok black with cyan/pink accent); `url` keeps the theme's own
 * primary-button color since it has no fixed brand.
 *
 * Pure and independent of any specific CSS module instance so the mapping
 * can be unit-tested without a DOM/CSS runner.
 */
const CHANNEL_CLASS_NAME: Record<SocialCtaChannel, string> = {
  whatsapp: "channelWhatsapp",
  facebook: "channelFacebook",
  instagram: "channelInstagram",
  tiktok: "channelTiktok",
  url: "channelUrl",
};

export function getPrimaryActionChannelClassName(
  channel: SocialCtaChannel,
): string {
  return CHANNEL_CLASS_NAME[channel];
}
