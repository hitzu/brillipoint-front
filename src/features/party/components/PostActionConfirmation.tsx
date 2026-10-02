import styles from "./PostActionConfirmation.module.css";
import { CtaSource } from "../experiences/fotobooth/Carousel/types";
import { SocialCta, SocialPlatform } from "./SocialCta";
import { SocialCtaViewModel } from "../theme/buildSocialCtaViewModel";
import { useT } from "../i18n/LocaleProvider";

interface PostActionConfirmationProps {
  onClose: () => void;
  source?: CtaSource;
  nombreFestejado?: string;
  /** `undefined`/`null` hides the CTA — e.g. the deprecated `/party/[token]`
   * route (via `PhotoViewerLightbox`) doesn't have a resolved theme to pass. */
  socialCta?: SocialCtaViewModel | null;
  onWAClick?: () => void;
  onSocialClick?: (platform: SocialPlatform) => void;
}

export function PostActionConfirmation({
  onClose,
  source = "download",
  socialCta,
  onWAClick,
  onSocialClick,
}: PostActionConfirmationProps) {
  const { t } = useT();
  const title =
    source === "share" ? t("postAction.sharedTitle") : t("postAction.savedTitle");
  const subtitle =
    source === "share"
      ? t("postAction.sharedSubtitle")
      : t("postAction.savedSubtitle");

  return (
    <div className={styles.card}>
      <div className={styles.ctaWrapper}>
        <SocialCta
          viewModel={socialCta ?? null}
          variant="sheet"
          onPrimaryActionClick={onWAClick}
          onSocialClick={onSocialClick}
          contentAlign="center"
        />
      </div>

      <p className={styles.check}>✓</p>
      <p className={styles.title}>{title}</p>
      <p className={styles.subtitle}>
        {subtitle}
        <br />
        <span className={styles.brand}>{t("postAction.brand")}</span>
      </p>

      <button type="button" className={styles.continueBtn} onClick={onClose}>
        {t("postAction.continue")}
      </button>
    </div>
  );
}
