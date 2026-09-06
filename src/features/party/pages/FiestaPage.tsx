import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { getExperience } from "../experiences";
import {
  GallerySessionItem,
  SessionEventData,
} from "../../../interfaces/eventGallery";
import { AnalyticsAction, EventPhoto } from "../../../interfaces";
import { trackEvent } from "../../../api/services/eventAnalyticsService";
import {
  buildDownloadFilename,
  downloadPhoto,
  sharePhoto,
  shareUrl,
} from "../utils/mediaActions";
import styles from "@assets/css/fotobooth-overview.module.css";
import {
  getEventGalleryV2,
  getEventTheme,
  getPublicPhotosByEventToken,
} from "../../../api/services/partyPublicService";
import { formatSplashDate } from "../utils/formatSplashDate";
import { isExpiredEventStatus } from "../utils/eventStatus";
import { preloadImages } from "../utils/preloadImages";
import { tokensToEventPageTheme } from "../utils/tokensToEventPageTheme";
import { buildThemeVars } from "../utils/themeVars";
import { EventPageTheme } from "../types/eventPageTheme";
import {
  appendSourceToPath,
  readSourceFromRouter,
} from "../utils/sourceTracking";
import PhotoViewerLightbox from "../components/PhotoViewerLightbox";
import { EventExpiredPage } from "./EventExpiredPage";

const SPLASH_DURATION_MS = 3200;
const CRITICAL_COVER_COUNT = 10;

const getQueryValue = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const isRoutePlaceholder = (value: string) =>
  value.startsWith("[") && value.endsWith("]");

const getFiestaTokenFromPath = (asPath: string) => {
  const [pathname = ""] = asPath.split("?");
  const segments = pathname.split("/").filter(Boolean);
  const fiestaIndex = segments.findIndex((segment) => segment === "fiesta");

  if (fiestaIndex === -1) return undefined;

  const token = segments[fiestaIndex + 1];
  if (!token || isRoutePlaceholder(token)) return undefined;

  return decodeURIComponent(token);
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function FiestaPage({ eventToken }: { eventToken?: string }) {
  const router = useRouter();

  const [showSplash, setShowSplash] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<GallerySessionItem[]>([]);
  const [eventData, setEventData] = useState<SessionEventData | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [error, setError] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [splashStep, setSplashStep] = useState("Preparando la experiencia");
  const [allPhotos, setAllPhotos] = useState<EventPhoto[]>([]);
  const [allPhotosLoading, setAllPhotosLoading] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [resolvedTheme, setResolvedTheme] = useState<EventPageTheme | null>(
    null,
  );
  const [themeReady, setThemeReady] = useState(false);

  const hasTrackedGalleryOpened = useRef(false);
  const source = readSourceFromRouter(router);
  const resolvedEventToken =
    eventToken ||
    getQueryValue(router.query.eventToken) ||
    getFiestaTokenFromPath(router.asPath);

  const preloadGalleryCovers = async (
    gallerySessions: GallerySessionItem[],
  ) => {
    const coverUrls = gallerySessions
      .map((session) => session.coverPhoto)
      .filter(Boolean);
    const criticalCoverUrls = coverUrls.slice(0, CRITICAL_COVER_COUNT);
    const backgroundCoverUrls = coverUrls.slice(CRITICAL_COVER_COUNT);

    if (criticalCoverUrls.length > 0) {
      setSplashStep("Revelando los mejores momentos");
      await preloadImages(criticalCoverUrls);
    }

    if (backgroundCoverUrls.length > 0) {
      void preloadImages(backgroundCoverUrls);
    }
  };

  const fetchGallery = async () => {
    if (!resolvedEventToken) return;

    try {
      setSplashStep("Buscando las fotos de la fiesta");
      const data = await getEventGalleryV2(resolvedEventToken);
      setEventData(data.event);

      if (isExpiredEventStatus(data.event.status)) {
        setSessions([]);
        setIsEmpty(false);
        setIsExpired(true);
        setError(false);
        setLoading(false);
        return;
      }

      setIsExpired(false);
      setSessions(data.sessions);
      setIsEmpty(data.sessions.length === 0);
      setError(false);

      setSplashStep("Acomodando la galería");
      await preloadGalleryCovers(data.sessions);
      setLoading(false);
    } catch {
      setError(true);
      setLoading(false);
    }
  };

  // Theme travels in its own request, separate from the gallery (different
  // cache lifecycle — the gallery keeps loading in the background after the
  // splash ends, the splash only waits on the theme).
  const fetchTheme = async () => {
    if (!resolvedEventToken) return;

    try {
      const { eventTheme } = await getEventTheme(resolvedEventToken);
      setResolvedTheme(
        tokensToEventPageTheme(eventTheme.tokens, eventTheme.images),
      );
    } catch {
      setResolvedTheme(null);
    } finally {
      setThemeReady(true);
    }
  };

  useEffect(() => {
    if (!resolvedEventToken) return;
    fetchGallery();
    fetchTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedEventToken]);

  // Polling cuando no hay sesiones aún
  useEffect(() => {
    if (!isEmpty) return;
    const interval = setInterval(fetchGallery, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmpty]);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    await shareUrl(url, eventData?.honoreesNames ?? "Evento");
  };

  const handleViewAllPhotos = async () => {
    if (!eventData?.eventToken || allPhotosLoading) return;

    trackEvent(
      AnalyticsAction.ALL_PHOTOS_GALLERY_GRID_OPENED,
      eventData.eventToken,
      {
        metadata: {
          source,
          surface: "gallery_overview",
        },
      },
    );

    if (allPhotos.length > 0) {
      setViewerIndex(0);
      return;
    }

    try {
      setAllPhotosLoading(true);
      const photos = await getPublicPhotosByEventToken(eventData.eventToken);
      const ordered = [...photos].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setAllPhotos(ordered);
      if (ordered.length > 0) {
        setViewerIndex(0);
      }
    } catch {
      // swallow; lightbox simply won't open
    } finally {
      setAllPhotosLoading(false);
    }
  };

  const handleDownloadPhoto = async (photo: EventPhoto) => {
    const photoIndex = Math.max(
      0,
      allPhotos.findIndex((item) => item.id === photo.id),
    );
    const title = eventData?.honoreesNames ?? "Brillipoint";
    try {
      await downloadPhoto(
        photo.publicUrl,
        buildDownloadFilename(title, photoIndex),
      );
      if (eventData?.eventToken) {
        trackEvent(AnalyticsAction.FIESTA_PHOTO_DOWNLOADED, eventData.eventToken, {
          surface: "fiesta_page",
          metadata: {
            source,
            itemIndex: photoIndex,
          },
        });
      }
    } catch {
      // noop
    }
  };

  const handleSharePhoto = async (photo: EventPhoto) => {
    const title = eventData?.honoreesNames ?? "Brillipoint";
    await sharePhoto(photo.publicUrl, `Brillipoint - ${title}`);
  };

  useEffect(() => {
    if (
      !router.isReady ||
      !resolvedEventToken ||
      isRoutePlaceholder(resolvedEventToken) ||
      hasTrackedGalleryOpened.current
    ) {
      return;
    }

    hasTrackedGalleryOpened.current = true;
    trackEvent(AnalyticsAction.GALLERY_OPENED, resolvedEventToken, {
      source,
      metadata: {
        source,
        surface: "fiesta_page",
      },
    });
  }, [resolvedEventToken, router.isReady, source]);

  const { Splash, Overview, theme: fallbackTheme } = getExperience(
    eventData?.eventTheme?.key,
  );
  const theme = resolvedTheme ?? fallbackTheme;
  const themeVars = theme ? buildThemeVars(theme) : undefined;
  const splashDate = formatSplashDate(eventData?.date);

  if (showSplash) {
    return (
      <Splash
        honoreesNames={eventData?.honoreesNames}
        date={splashDate}
        isReady={themeReady}
        stepLabel={splashStep}
        onComplete={() => setShowSplash(false)}
        duration={SPLASH_DURATION_MS}
        canFinish={themeReady}
        theme={theme}
      />
    );
  }

  if (loading) {
    return (
      <div
        className={styles.centerPage}
        style={themeVars}
      >
        <div className={styles.loaderOrb} />
        <p>Cargando galería del evento...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={styles.centerPage}
        style={themeVars}
      >
        <p>No pudimos cargar la galería</p>
        <button className={styles.retryBtn} onClick={fetchGallery}>
          Reintentar
        </button>
      </div>
    );
  }

  if (!resolvedEventToken) {
    return (
      <div
        className={styles.centerPage}
        style={themeVars}
      >
        <div className={styles.loaderOrb} />
        <p>Cargando galería del evento...</p>
      </div>
    );
  }

  if (isExpired && eventData) {
    return (
      <EventExpiredPage
        eventName={eventData.honoreesNames}
        eventToken={eventData.eventToken ?? resolvedEventToken}
        eventDate={eventData.date}
        surface="fiesta_expired"
        sessionId={null}
        path={`/fiesta/${resolvedEventToken}`}
        theme={theme}
      />
    );
  }

  return (
    <>
      <Head>
        <title>
          Fiesta
          {eventData?.honoreesNames ? ` - ${eventData.honoreesNames}` : ""}
        </title>
      </Head>
      <Overview
        eventToken={resolvedEventToken}
        sessions={sessions}
        eventData={eventData}
        source={source}
        onSelectSession={(token) =>
          router.push(
            appendSourceToPath(`/mis-fotos/${token}`, "fiesta_to_session"),
          )
        }
        onShare={handleShare}
        onViewAllPhotos={
          eventData?.eventToken ? handleViewAllPhotos : undefined
        }
        isViewAllPhotosLoading={allPhotosLoading}
        theme={theme}
      />
      <PhotoViewerLightbox
        isOpen={viewerIndex !== null && allPhotos.length > 0}
        photos={allPhotos}
        activeIndex={viewerIndex}
        eventTitle={eventData?.honoreesNames ?? "Brillipoint"}
        onClose={() => setViewerIndex(null)}
        onActiveIndexChange={setViewerIndex}
        onDownload={handleDownloadPhoto}
        onShare={handleSharePhoto}
        nombreFestejado={eventData?.honoreesNames ?? ""}
        eventToken={resolvedEventToken}
        showNavigationHints
        backdropColor={theme.pageBackground}
        themeVars={themeVars}
      />
    </>
  );
}
