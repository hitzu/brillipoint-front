import React from "react";
import styles from "@assets/css/fotobooth.module.css";
import { useT } from "../../../../i18n/LocaleProvider";

type ViewAllPhotosButtonProps = {
  disabled?: boolean;
  onClick: () => void;
};

// Tertiary action to the full party gallery at the end of mis-fotos. Guests
// scroll down to save/share and rarely notice the small header link, so the
// gallery action is repeated where they already are.
const ViewAllPhotosButton = ({
  disabled = false,
  onClick,
}: ViewAllPhotosButtonProps) => {
  const { t } = useT();
  const label = t("carousel.viewAllPhotos");

  return (
    <div className={styles.viewAllPhotosRow}>
      <button
        type="button"
        className={styles.btnViewAllPhotos}
        onClick={onClick}
        disabled={disabled}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
        {label}
      </button>
    </div>
  );
};

export default ViewAllPhotosButton;
