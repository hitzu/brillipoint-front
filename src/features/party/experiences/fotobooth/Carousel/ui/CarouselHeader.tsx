import React from "react";
import styles from "@assets/css/fotobooth.module.css";
import LanguageToggle from "../../../../components/LanguageToggle";
import { useT } from "../../../../i18n/LocaleProvider";

type CarouselHeaderProps = {
  canOpenGallery: boolean;
  currentIndex: number;
  onOpenGallery: () => void;
  totalItems: number;
};

const CarouselHeader = ({
  canOpenGallery,
  currentIndex,
  onOpenGallery,
  totalItems,
}: CarouselHeaderProps) => {
  const { t } = useT();

  return (
    <div className={styles.carouselHeader}>
      <button
        type="button"
        className={styles.carouselBackLink}
        onClick={onOpenGallery}
        disabled={!canOpenGallery}
        aria-label={t("carousel.viewGallery")}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        {t("carousel.viewGallery")}
      </button>
      <div className={styles.carouselHeaderEnd}>
        <div className={styles.carouselCount}>
          {t("common.photoCounter", {
            current: currentIndex + 1,
            total: totalItems,
          })}
        </div>
        <LanguageToggle variant="inline" />
      </div>
    </div>
  );
};

export default CarouselHeader;
