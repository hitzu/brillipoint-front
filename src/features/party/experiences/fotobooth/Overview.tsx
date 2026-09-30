import React, { useEffect, useState } from "react";
import styles from "@assets/css/fotobooth-overview.module.css";
import { SocialCta, SocialPlatform } from "../../components/SocialCta";
import {
  GallerySessionItem,
  SessionEventData,
} from "../../../../interfaces/eventGallery";
import { OverviewProps } from "../types";
import { buildThemeVars } from "../../utils/themeVars";
import { parseLocalDate } from "@common/dates";
import { AnalyticsAction } from "../../../../interfaces";
import { trackEvent } from "../../../../api/services/eventAnalyticsService";

// ─── Icons (solo los que usa Overview directamente) ──────────────────────────

const IconShare = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const IconChevronDown = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconStack = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <rect
      x="1.5"
      y="3.5"
      width="8"
      height="6.5"
      rx="1.5"
      stroke="var(--ep-primary-btn-bg, #111827)"
      strokeWidth="1.3"
    />
    <rect
      x="3"
      y="2"
      width="8"
      height="6.5"
      rx="1.5"
      stroke="var(--ep-primary-btn-bg, rgba(17,24,39,0.4))"
      strokeWidth="1.1"
    />
  </svg>
);

const IconCamera = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="var(--ep-primary-btn-bg, rgba(17,24,39,0.3))"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const IconCheck = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#22c55e"
    strokeWidth="3"
  >
    <polyline points="20,6 9,17 4,12" />
  </svg>
);

// ─── Mirror ornament (empty state asset) ──────────────────────────────────────

const MirrorOrnament = () => (
  <div className={styles.mirrorFrame}>
    <div className={styles.mirrorOval}>
      <div className={styles.mirrorShine} />
    </div>
    <span className={styles.mirrorSparkle} style={{ top: 8, left: 10 }}>
      ✦
    </span>
    <span
      className={styles.mirrorSparkle}
      style={{ top: 8, right: 10, animationDelay: "0.6s" }}
    >
      ✦
    </span>
    <span
      className={styles.mirrorSparkle}
      style={{ bottom: 18, left: 6, animationDelay: "1.1s" }}
    >
      ✦
    </span>
    <span
      className={styles.mirrorSparkle}
      style={{ bottom: 18, right: 6, animationDelay: "0.3s" }}
    >
      ✦
    </span>
    <div className={styles.mirrorCam}>
      <IconCamera />
    </div>
    <div className={styles.mirrorBase} />
    <div className={styles.mirrorStand} />
  </div>
);

// ─── Session card ─────────────────────────────────────────────────────────────

const SessionCard = ({
  session,
  onClick,
}: {
  session: GallerySessionItem;
  onClick: () => void;
}) => (
  <button className={styles.sessionCard} onClick={onClick}>
    {session.coverPhoto ? (
      <img src={session.coverPhoto} alt="" className={styles.sessionCover} />
    ) : (
      <div className={styles.sessionPlaceholder} />
    )}
    <div className={styles.collectionBadge}>
      <IconStack />
    </div>
    <div className={styles.sessionGradient} />
    {session.time && <div className={styles.sessionTime}>{session.time}</div>}
  </button>
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (iso: string) => {
  const d = parseLocalDate(iso);
  if (isNaN(d.getTime())) return iso;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}.${month}.${year}`;
};

const getAlbumPhrase = (eventData: SessionEventData | null) =>
  eventData?.albumPhrase || eventData?.albumPhase || "";

// ─── Overview ─────────────────────────────────────────────────────────────────

const FotoBoothOverview = ({
  eventToken,
  sessions,
  eventData,
  source,
  onSelectSession,
  onShare,
  onViewAllPhotos,
  isViewAllPhotosLoading = false,
  theme,
  socialCta,
}: OverviewProps) => {
  const isEmpty = sessions.length === 0;
  const coverUrls = sessions
    .map((s) => s.coverPhoto)
    .filter(Boolean) as string[];
  const slideCount = Math.max(coverUrls.length, 1);

  const [activeSlide, setActiveSlide] = useState(0);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (coverUrls.length <= 1) return;
    const t = setInterval(
      () => setActiveSlide((s) => (s + 1) % slideCount),
      3200,
    );
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideCount]);

  const handleShare = async () => {
    await onShare();
    trackEvent(AnalyticsAction.SHARE_CONFIRM_EXECUTED, eventToken, {
      metadata: {
        source,
        surface: "gallery_overview",
      },
    });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleVerFotos = () => {
    trackEvent(AnalyticsAction.GALLERY_CTA_CLICKED, eventToken, {
      metadata: {
        source,
        surface: "gallery_overview",
      },
    });
    document.getElementById("sesiones")?.scrollIntoView({ behavior: "smooth" });
  };

  const dateLabel = eventData?.date ? formatDate(eventData.date) : "";
  const albumPhrase = getAlbumPhrase(eventData);

  const handleSessionClick = (
    session: GallerySessionItem,
    sessionIndex: number,
  ) => {
    trackEvent(AnalyticsAction.GALLERY_SESSION_CLICK, eventToken, {
      sessionId: session.sessionToken,
      metadata: {
        source,
        sessionIndex,
        photoCount: session.photoCount,
      },
    });
    onSelectSession(session.sessionToken);
  };

  const handleGalleryWaClick = () => {
    trackEvent(AnalyticsAction.CTA_WA_GALLERY, eventToken, {
      metadata: {
        source,
        surface: "gallery_overview",
      },
    });
  };

  const handleGallerySocialClick = (platform: SocialPlatform) => {
    trackEvent(AnalyticsAction.FIESTA_SOCIAL_CLICKED, eventToken, {
      surface: "fiesta_page",
      metadata: {
        source,
        platform,
      },
    });
  };

  const socialCtaBlock = (
    <SocialCta
      viewModel={socialCta ?? null}
      variant="page"
      onPrimaryActionClick={handleGalleryWaClick}
      onSocialClick={handleGallerySocialClick}
    />
  );

  return (
    <div className={styles.page} style={theme ? buildThemeVars(theme) : undefined}>
      {!isEmpty && (
        <section className={styles.mirrorHero}>
          {coverUrls.length > 0 ? (
            coverUrls.map((url, i) => (
              <div
                key={i}
                className={styles.mirrorSlide}
                style={{ opacity: i === activeSlide ? 1 : 0 }}
              >
                <img src={url} alt="" className={styles.mirrorHeroImg} />
              </div>
            ))
          ) : (
            <div className={styles.mirrorSlide} style={{ opacity: 1 }}>
              <div className={styles.carouselPlaceholder} />
            </div>
          )}
          <div className={styles.mirrorScrim} />
          <div className={styles.mirrorHeroContent}>
            {albumPhrase && (
              <p className={styles.mirrorPhrase}>{albumPhrase}</p>
            )}
            <h1 className={styles.mirrorName}>
              {eventData?.honoreesNames ?? "Bienvenido"}
            </h1>
            {dateLabel && <p className={styles.mirrorDate}>{dateLabel}</p>}
          </div>
          <button
            type="button"
            className={styles.mirrorScrollHint}
            onClick={handleVerFotos}
            aria-label="Desliza para ver las fotos"
          >
            <IconChevronDown />
          </button>
        </section>
      )}

      {/* Body: empty state or sessions grid */}
      <div className={styles.pageBody} id="sesiones">
        {!isEmpty && <div className={styles.sectionDivider} />}

        {isEmpty ? (
          <div className={styles.emptyState}>
            <MirrorOrnament />
            {/* <p className={styles.emptyTitle}>¡La noche apenas empieza!</p> */}
            <div className={styles.emptyEventInfo}>
              {albumPhrase && (
                <p className={styles.emptyTitle}>{albumPhrase}</p>
              )}
              <h1 className={styles.emptyEventName}>
                {eventData?.honoreesNames ?? "Bienvenido"}
              </h1>
              {dateLabel && (
                <p className={styles.emptyEventDate}>{dateLabel}</p>
              )}
            </div>
            <p className={styles.emptySub}>
              Las fotos de tu fiesta aparecerán aquí en cuanto comiencen las
              sesiones
            </p>
            <div className={styles.emptyDots}>
              <div className={styles.emptyDot} />
              <div className={styles.emptyDot} />
              <div className={styles.emptyDot} />
            </div>
          </div>
        ) : (
          <>
            {socialCtaBlock}

            {onViewAllPhotos && (
              <button
                type="button"
                className={styles.viewAllBtn}
                onClick={onViewAllPhotos}
                disabled={isViewAllPhotosLoading}
                aria-busy={isViewAllPhotosLoading}
              >
                {isViewAllPhotosLoading
                  ? "Cargando fotos…"
                  : "Ver todas las fotos del evento"}
              </button>
            )}
            <div className={styles.sessionsGrid}>
              {sessions.map((session, sessionIndex) => (
                <SessionCard
                  key={session.sessionToken}
                  session={session}
                  onClick={() => handleSessionClick(session, sessionIndex)}
                />
              ))}
            </div>
          </>
        )}

        {isEmpty && (
          <div className={styles.emptyActions}>
            <button className={styles.btnSecondary} onClick={handleShare}>
              <IconShare />
              Compartir enlace
            </button>
            <div
              className={`${styles.shareToast} ${showToast ? styles.shareToastVisible : ""}`}
            >
              <IconCheck />
              Enlace copiado ✦
            </div>
          </div>
        )}

        {isEmpty && socialCtaBlock}
      </div>
    </div>
  );
};

export default FotoBoothOverview;
