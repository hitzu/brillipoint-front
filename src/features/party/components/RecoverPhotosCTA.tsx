import { useT } from "../i18n/LocaleProvider";
import { buildRecoverPhotosUrl } from "../utils/buildRecoverPhotosUrl";
import styles from "./RecoverPhotosCTA.module.css";

interface RecoverPhotosCTAProps {
  eventName: string;
  eventDate: string;
  onRecover?: () => void;
}

export function RecoverPhotosCTA({
  eventName,
  eventDate,
  onRecover,
}: RecoverPhotosCTAProps) {
  const { t, locale } = useT();
  const url = buildRecoverPhotosUrl(locale, {
    phone: process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "5212215775211",
    eventName,
    eventDate,
  });

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.recoverBtn}
      onClick={onRecover}
    >
      {t("expired.recoverButton")}
    </a>
  );
}
