import styles from "@assets/css/social-media-cta.module.css";
import { SocialCtaViewModel } from "../theme/buildSocialCtaViewModel";
import { PrimaryActionButton } from "./PrimaryActionButton";
import {
  IconExternalLink,
  IconFacebook,
  IconInstagram,
  IconTiktok,
  IconWhatsapp,
} from "./SocialCtaIcons";

type Variant = "modal" | "page" | "sheet" | "compact";

export type SocialPlatform =
  | "whatsapp"
  | "instagram"
  | "tiktok"
  | "facebook"
  | "url";

interface SocialCtaProps {
  /** `null` (or a `null` `SocialCta` from the theme) hides the whole block. */
  viewModel: SocialCtaViewModel | null;
  variant?: Variant;
  onPrimaryActionClick?: () => void;
  onSocialClick?: (platform: SocialPlatform) => void;
  onClose?: () => void;
  contentAlign?: "left" | "center";
}

const SOCIAL_ICON: Record<SocialPlatform, () => JSX.Element> = {
  whatsapp: IconWhatsapp,
  instagram: IconInstagram,
  tiktok: IconTiktok,
  facebook: IconFacebook,
  url: IconExternalLink,
};

const SOCIAL_LABEL: Record<SocialPlatform, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  url: "Sitio web",
};

const socialBrandClass: Record<SocialPlatform, string> = {
  whatsapp: "socialBrandWa",
  instagram: "socialBrandIg",
  tiktok: "socialBrandTt",
  facebook: "socialBrandFb",
  url: "socialBrandUrl",
};

const pageSocialBrandClass: Record<SocialPlatform, string> = {
  whatsapp: "pageSocialBtnWa",
  instagram: "pageSocialBtnIg",
  tiktok: "pageSocialBtnTt",
  facebook: "pageSocialBtnFb",
  url: "pageSocialBtnUrl",
};

/**
 * Presentational only: renders whatever the (already-resolved) `viewModel`
 * carries. No theme knowledge beyond the CSS vars its module already
 * references — null-handling, text resolution and href-building all happen
 * upstream in `buildSocialCtaViewModel`.
 */
export const SocialCta = ({
  viewModel,
  variant = "modal",
  onPrimaryActionClick,
  onSocialClick,
  onClose,
  contentAlign,
}: SocialCtaProps) => {
  if (!viewModel) {
    return null;
  }

  const { headline, subtitle, followText, primaryAction, socials } = viewModel;
  // Defensive: never render the primary channel again as a secondary chip,
  // even if the backend already strips it from `socials`.
  const socialEntries = (Object.keys(socials) as SocialPlatform[]).filter(
    (platform) =>
      Boolean(socials[platform]) && platform !== primaryAction?.channel,
  );

  const renderSocialLinks = (
    baseClassName: string,
    classNameByPlatform: Record<SocialPlatform, string>,
    withLabel: boolean,
  ) =>
    socialEntries.map((platform) => {
      const Icon = SOCIAL_ICON[platform];
      return (
        <a
          key={platform}
          href={socials[platform]}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onSocialClick?.(platform)}
          aria-label={SOCIAL_LABEL[platform]}
          className={`${styles[baseClassName]} ${styles[classNameByPlatform[platform]]}`}
        >
          <Icon />
          {withLabel ? ` ${SOCIAL_LABEL[platform]}` : null}
        </a>
      );
    });

  // ── Page variant (bottom-of-page card, e.g. FotoBoothOverview) ──────────
  if (variant === "page") {
    return (
      <div className={styles.pageCard}>
        <span className={styles.pageSparkle}>✦</span>
        {headline && <p className={styles.pageTitulo}>{headline}</p>}
        {subtitle && <p className={styles.pageSubtitulo}>{subtitle}</p>}
        {primaryAction && (
          <PrimaryActionButton
            channel={primaryAction.channel}
            label={primaryAction.label}
            href={primaryAction.href}
            onClick={onPrimaryActionClick}
            className={styles.pagePrimaryBtn}
          />
        )}
        {followText && <p className={styles.pageFollowNote}>{followText}</p>}
        {socialEntries.length > 0 && (
          <div className={styles.pageSocialRow}>
            {renderSocialLinks("pageSocialBtn", pageSocialBrandClass, true)}
          </div>
        )}
      </div>
    );
  }

  // ── Sheet variant (bottom sheet, e.g. post-action confirmation) ─────────
  if (variant === "sheet") {
    return (
      <div
        className={styles.sheetContent}
        style={contentAlign ? { textAlign: contentAlign } : undefined}
      >
        {onClose && (
          <button
            type="button"
            className={styles.sheetCloseBtn}
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        )}
        {headline && <p className={styles.sheetTitulo}>{headline}</p>}
        {subtitle && <p className={styles.sheetSubtitulo}>{subtitle}</p>}
        {primaryAction && (
          <PrimaryActionButton
            channel={primaryAction.channel}
            label={primaryAction.label}
            href={primaryAction.href}
            onClick={onPrimaryActionClick}
            className={styles.sheetPrimaryBtn}
          />
        )}
        {socialEntries.length > 0 && (
          <div className={styles.sheetSocialRow}>
            {renderSocialLinks("sheetSocialBtn", socialBrandClass, false)}
          </div>
        )}
      </div>
    );
  }

  // ── Compact variant (inline presence, e.g. during a carousel session) ───
  if (variant === "compact") {
    return (
      <div className={styles.compactCard}>
        <div className={styles.compactCopy}>
          {headline && <p className={styles.compactTitulo}>{headline}</p>}
          {subtitle && <p className={styles.compactSubtitulo}>{subtitle}</p>}
        </div>
        <div className={styles.compactActions}>
          {primaryAction && (
            <PrimaryActionButton
              channel={primaryAction.channel}
              label={primaryAction.label}
              href={primaryAction.href}
              onClick={onPrimaryActionClick}
              className={styles.compactPrimaryBtn}
            />
          )}
          {socialEntries.length > 0 && (
            <div className={styles.compactSocialRow}>
              {renderSocialLinks("compactSocialBtn", socialBrandClass, false)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Modal variant (default) ──────────────────────────────────────────────
  return (
    <div className={styles.modalEndState}>
      {onClose && (
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Cerrar"
        >
          ✕
        </button>
      )}
      {headline && <p className={styles.titulo}>{headline}</p>}
      {subtitle && <p className={styles.subtitulo}>{subtitle}</p>}
      {primaryAction && (
        <PrimaryActionButton
          channel={primaryAction.channel}
          label={primaryAction.label}
          href={primaryAction.href}
          onClick={onPrimaryActionClick}
          className={styles.primaryBtn}
        />
      )}
      {socialEntries.length > 0 && (
        <div className={styles.redes}>
          {renderSocialLinks("red", socialBrandClass, false)}
        </div>
      )}
    </div>
  );
};
