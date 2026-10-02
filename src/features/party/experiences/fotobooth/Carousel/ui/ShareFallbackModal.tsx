import React, { useState } from "react";
import styles from "@assets/css/fotobooth.module.css";
import { useT } from "../../../../i18n/LocaleProvider";

type ShareFallbackModalProps = {
  onClose: () => void;
  onCopyLink: () => Promise<boolean>;
  onDownload: () => void;
  previewUrl: string;
};

const ShareFallbackModal = ({
  onClose,
  onCopyLink,
  onDownload,
  previewUrl,
}: ShareFallbackModalProps) => {
  const { t } = useT();
  const [copied, setCopied] = useState(false);

  return (
    <div
      className={styles.shareFallbackOverlay}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.shareFallbackModal}>
        <button
          type="button"
          className={styles.shareFallbackClose}
          onClick={onClose}
          aria-label={t("carousel.shareFallback.close")}
        >
          ✕
        </button>

        <p className={styles.shareFallbackEyebrow}>
          {t("carousel.shareFallback.eyebrow")}
        </p>
        <h3 className={styles.shareFallbackTitle}>
          {t("carousel.shareFallback.title")}
        </h3>
        <p className={styles.shareFallbackText}>
          {t("carousel.shareFallback.text")}
        </p>

        <div className={styles.shareFallbackPreviewCard}>
          <img
            src={previewUrl}
            alt={t("carousel.shareFallback.previewAlt")}
            className={styles.shareFallbackPreviewImage}
          />
        </div>

        <div className={styles.shareFallbackActions}>
          <button
            type="button"
            className={styles.shareFallbackPrimary}
            onClick={onDownload}
          >
            {t("carousel.shareFallback.download")}
          </button>
          <button
            type="button"
            className={styles.shareFallbackSecondary}
            onClick={async () => {
              const success = await onCopyLink();
              setCopied(success);
            }}
          >
            {copied
              ? t("carousel.shareFallback.linkCopied")
              : t("carousel.shareFallback.copyLink")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareFallbackModal;
