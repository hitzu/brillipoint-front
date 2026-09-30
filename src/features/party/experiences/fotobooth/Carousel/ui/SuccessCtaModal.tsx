import styles from "@assets/css/fotobooth.module.css";
import { PostActionConfirmation } from "../../../../components/PostActionConfirmation";
import { SocialPlatform } from "../../../../components/SocialCta";
import { SocialCtaViewModel } from "../../../../theme/buildSocialCtaViewModel";
import { CtaSource } from "../types";

type SuccessCtaModalProps = {
  eventName: string;
  socialCta?: SocialCtaViewModel | null;
  isOpen: boolean;
  onClose: () => void;
  onSocialClick?: (platform: SocialPlatform) => void;
  onWAClick?: () => void;
  source: CtaSource;
};

const SuccessCtaModal = ({
  eventName,
  socialCta,
  isOpen,
  onClose,
  onSocialClick,
  onWAClick,
  source,
}: SuccessCtaModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className={styles.successCtaOverlay}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <PostActionConfirmation
        onClose={onClose}
        source={source}
        nombreFestejado={eventName}
        socialCta={socialCta}
        onWAClick={onWAClick}
        onSocialClick={onSocialClick}
      />
    </div>
  );
};

export default SuccessCtaModal;
