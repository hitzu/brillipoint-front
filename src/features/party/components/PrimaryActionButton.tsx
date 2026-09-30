import styles from "@assets/css/social-media-cta.module.css";
import { SocialCtaChannel } from "../types/themeContract";
import { getPrimaryActionChannelClassName } from "../theme/primaryActionButtonVariant";
import {
  IconExternalLink,
  IconFacebook,
  IconInstagram,
  IconTiktok,
  IconWhatsapp,
} from "./SocialCtaIcons";

const ICON_BY_CHANNEL: Record<SocialCtaChannel, () => JSX.Element> = {
  whatsapp: IconWhatsapp,
  instagram: IconInstagram,
  tiktok: IconTiktok,
  facebook: IconFacebook,
  url: IconExternalLink,
};

interface PrimaryActionButtonProps {
  channel: SocialCtaChannel;
  label: string;
  href: string;
  className: string;
  onClick?: () => void;
}

/**
 * Base primary-action button shared by all 5 `SocialCta` channels
 * (whatsapp/instagram/tiktok/facebook/url). Props-only: the icon is picked
 * from `channel`, everything else (layout, colors) comes from `className`,
 * which the `SocialCta` variant supplies.
 */
export function PrimaryActionButton({
  channel,
  label,
  href,
  className,
  onClick,
}: PrimaryActionButtonProps) {
  const Icon = ICON_BY_CHANNEL[channel];
  const channelClassName = styles[getPrimaryActionChannelClassName(channel)];
  const combinedClassName = channelClassName
    ? `${className} ${channelClassName}`
    : className;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={combinedClassName}
    >
      <Icon />
      {label}
    </a>
  );
}
