import React from "react";
import styles from "@assets/css/fotobooth.module.css";
import { RewardPromoCopy } from "../rewardPromoCopy";

type RewardPromoModalProps = {
  copy: RewardPromoCopy;
  isOpen: boolean;
  onClose: () => void;
};

const RewardPromoModal = ({
  copy,
  isOpen,
  onClose,
}: RewardPromoModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className={styles.successCtaOverlay}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={styles.rewardPromoModal}
        role="dialog"
        aria-modal="true"
        aria-label={copy.triggerAriaLabel}
      >
        <button
          type="button"
          className={styles.rewardPromoCloseBtn}
          onClick={onClose}
          aria-label={copy.closeAriaLabel}
        >
          ✕
        </button>
        <div className={styles.rewardPromoInner}>
          <span className={styles.rewardPromoEyebrow}>
            {copy.eyebrowLabel}
          </span>

          <div className={styles.rewardPromoCopyBlock}>
            <p className={styles.rewardPromoLead}>{copy.leadLine}</p>

            <p className={styles.rewardPromoSupport}>
              {copy.supportLine}{" "}
              <span className={styles.rewardPromoEmphasisStrong}>
                {copy.shareLabel}
              </span>
            </p>

            <p className={styles.rewardPromoClosing}>
              {copy.closingLinePrefix}{" "}
              <span className={styles.rewardPromoEmphasisAccent}>
                {copy.handleLabel}
              </span>{" "}
              {copy.closingLineSuffix}{" "}
              <span className={styles.rewardPromoEmphasisReward}>
                {copy.rewardLabel}
              </span>
            </p>
          </div>

          <div className={styles.rewardPromoDivider} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};

export default RewardPromoModal;
