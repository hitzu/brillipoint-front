import styles from "./PostActionConfirmation.module.css";
import { CtaSource } from "../experiences/fotobooth/Carousel/types";
import { SocialCta, SocialPlatform } from "./SocialCta";
import { SocialCtaViewModel } from "../theme/buildSocialCtaViewModel";

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
  const title = source === "share" ? "¡Foto compartida!" : "¡Foto guardada!";
  const subtitle =
    source === "share"
      ? "Gracias por compartir tu momento"
      : "Gracias por vivir tu momento";

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
        <span className={styles.brand}>Brillipoint Experience ✨</span>
      </p>

      <button type="button" className={styles.continueBtn} onClick={onClose}>
        Continuar
      </button>
    </div>
  );
}
