import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { trackEvent } from "../../../api/services/eventAnalyticsService";
import { RecoverPhotosCTA } from "../components/RecoverPhotosCTA";
import { SocialCta } from "../components/SocialCta";
import { SocialCtaViewModel } from "../theme/buildSocialCtaViewModel";
import { resolveImageAlt } from "../theme/resolveImageAlt";
import LanguageToggle from "../components/LanguageToggle";
import { useT } from "../i18n/LocaleProvider";
import { EventPageTheme } from "../types/eventPageTheme";
import { ThemeImages } from "../types/themeContract";
import { buildThemeVars } from "../utils/themeVars";
import {
  expiredEventFor,
  ExpiredIntent,
  ExpiredSurface,
} from "../utils/expiredAnalytics";
import logo from "@assets/images/logo-experience-white.png";
import styles from "./EventExpiredPage.module.css";

interface EventExpiredPageProps {
  eventName: string;
  eventToken: string;
  eventDate: string;
  surface: ExpiredSurface;
  sessionId: string | null;
  path: string;
  theme?: EventPageTheme;
  socialCta?: SocialCtaViewModel | null;
  /** Typed image slots (T5) — only `logo` has an existing spot on this page. */
  images?: ThemeImages;
}

export function EventExpiredPage({
  eventName,
  eventToken,
  eventDate,
  surface,
  sessionId,
  path,
  theme,
  socialCta,
  images,
}: EventExpiredPageProps) {
  const hasTrackedView = useRef(false);
  const { t, locale } = useT();

  const trackExpiredEvent = (intent: ExpiredIntent) => {
    trackEvent(expiredEventFor(surface, intent), eventToken, {
      sessionId,
      surface,
      metadata: {
        path,
      },
    });
  };

  useEffect(() => {
    if (hasTrackedView.current) return;
    hasTrackedView.current = true;
    trackExpiredEvent("viewed");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventToken, surface, path]);

  const handleMessageClick = () => trackExpiredEvent("message_clicked");
  const handleRecoveryClick = () => trackExpiredEvent("recovery_requested");

  return (
    <main
      className={styles.page}
      style={theme ? buildThemeVars(theme) : undefined}
    >
      <LanguageToggle variant="floating" />
      <section className={styles.card}>
        <div className={styles.logoBadge}>
          {images?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={images.logo.url}
              alt={resolveImageAlt(images.logo.alt, locale) || "Logo"}
              className={styles.logo}
            />
          ) : (
            <Image
              src={logo}
              alt="Brillipoint Experience"
              className={styles.logo}
              priority
            />
          )}
        </div>
        <p className={styles.kicker}>{t("expired.kicker")}</p>
        <h1 className={styles.title}>{t("expired.title", { eventName })}</h1>
        <p className={styles.message}>{t("expired.message")}</p>

        <div className={styles.divider} />

        <SocialCta
          viewModel={socialCta ?? null}
          variant="page"
          onPrimaryActionClick={handleMessageClick}
        />

        <div className={styles.recoverSection}>
          <p className={styles.recoverTitle}>{t("expired.recoverTitle")}</p>
          <p className={styles.recoverCopy}>{t("expired.recoverCopy")}</p>
          <RecoverPhotosCTA
            eventName={eventName}
            eventDate={eventDate}
            onRecover={handleRecoveryClick}
          />
        </div>
      </section>
    </main>
  );
}
