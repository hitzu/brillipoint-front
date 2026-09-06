import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { axiosInstanceWithoutToken } from "../../../api/config/axiosConfig";
import { getExperience } from "../experiences";
import {
  SessionEventData,
  SessionPhoto,
  SessionResponse,
} from "../../../interfaces/eventGallery";
import styles from "@assets/css/party-public.module.css";
import {
  getEventGallerySessionV2,
  getEventTheme,
} from "../../../api/services/partyPublicService";
import { buildSessionItems, getPhotoItems } from "../utils/buildSessionItems";
import {
  isExpiredEventStatus,
  isExpiredSessionStatus,
} from "../utils/eventStatus";
import { formatSplashDate } from "../utils/formatSplashDate";
import { tokensToEventPageTheme } from "../utils/tokensToEventPageTheme";
import { buildThemeVars } from "../utils/themeVars";
import { EventPageTheme } from "../types/eventPageTheme";
import { SessionItem } from "../types/session";
import { readSourceFromRouter } from "../utils/sourceTracking";
import { EventExpiredPage } from "./EventExpiredPage";

type PageState = "loading" | "ready" | "empty" | "error" | "expired";
const SPLASH_DURATION_MS = 3200;

// ─── Empty states ────────────────────────────────────────────────────────────

const EmptyStateEnCamino = ({
  eventData,
  sessionToken,
  theme,
}: {
  eventData: SessionEventData | null;
  sessionToken: string;
  theme?: EventPageTheme;
}) => {
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { data } = await axiosInstanceWithoutToken.get<SessionResponse>(
          `/sessions/${sessionToken}`,
        );
        if (buildSessionItems(data).length > 0) window.location.reload();
      } catch {
        // ignorar
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [sessionToken]);

  return (
    <div
      className={styles.centerState}
      style={theme ? buildThemeVars(theme) : undefined}
    >
      <p className={styles.emptyTitle}>
        Tus fotos del evento de{" "}
        <strong>{eventData?.honoreesNames ?? "tu evento"}</strong> están en
        camino ✨
      </p>
      {eventData?.date && (
        <p className={styles.emptySubtitle}>{eventData.date}</p>
      )}
    </div>
  );
};

const EmptyStateError = ({
  eventData,
  theme,
}: {
  eventData: SessionEventData | null;
  sessionToken: string;
  theme?: EventPageTheme;
}) => (
  <div
    className={styles.centerState}
    style={theme ? buildThemeVars(theme) : undefined}
  >
    <p className={styles.emptyTitle}>
      Estamos teniendo problemas de conexión en{" "}
      <strong>{eventData?.honoreesNames ?? "tu evento"}</strong> ✨
    </p>
    {eventData?.date && (
      <p className={styles.emptySubtitle}>
        {eventData.date} · Mientras tanto puedes ir por tu foto impresa
      </p>
    )}
    <button
      className={styles.retryBtn}
      onClick={() => window.location.reload()}
    >
      Reintentar
    </button>
  </div>
);

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MisFotosPage({
  sessionToken,
}: {
  sessionToken: string;
}) {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [items, setItems] = useState<SessionItem[]>([]);
  const [photos, setPhotos] = useState<SessionPhoto[]>([]);
  const [eventData, setEventData] = useState<SessionEventData | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [splashStep, setSplashStep] = useState("Preparando la experiencia");
  const [resolvedTheme, setResolvedTheme] = useState<EventPageTheme | null>(
    null,
  );
  const [themeReady, setThemeReady] = useState(false);

  const source = readSourceFromRouter(router);

  // Theme travels in its own request, separate from the session photos. The
  // eventToken is only known after the session resolves (no eventToken in
  // the mis-fotos URL), so this is fired once fetchSession gets eventData.
  // The splash waits only on this — the session/photos keep loading in the
  // background and render their own loading state once the splash ends.
  const fetchTheme = async (eventToken: string) => {
    try {
      const { eventTheme } = await getEventTheme(eventToken);
      setResolvedTheme(
        tokensToEventPageTheme(eventTheme.tokens, eventTheme.images),
      );
    } catch {
      setResolvedTheme(null);
    } finally {
      setThemeReady(true);
    }
  };

  const fetchSession = async () => {
    try {
      setSplashStep("Buscando tu sesión de fotos");
      const session = await getEventGallerySessionV2(sessionToken);
      setEventData(session?.event ?? null);

      if (session?.event?.eventToken) {
        void fetchTheme(session.event.eventToken);
      } else {
        setThemeReady(true);
      }

      if (
        isExpiredSessionStatus(session.status) ||
        isExpiredEventStatus(session.event?.status)
      ) {
        setItems([]);
        setPhotos([]);
        setPageState("expired");
        return;
      }

      const sessionItems = buildSessionItems(session);
      const orderedPhotos: SessionPhoto[] = getPhotoItems(sessionItems).map(
        (item) => ({
          // `SessionPhoto.url` is contractually the ORIGINAL — never the
          // coalesced display value — so downstream consumers that fall
          // back to `photos` never silently degrade to the minimized image.
          url: item.originalSrc,
          position: item.photoPosition ?? item.index,
        }),
      );

      setItems(sessionItems);

      if (sessionItems.length === 0) {
        setItems([]);
        setPhotos([]);
        setPageState("empty");
        return;
      }

      setSplashStep("Revelando tus fotos");
      setPhotos(orderedPhotos);
      setPageState("ready");
    } catch (error) {
      setThemeReady(true);
      console.error("[MisFotosPage] Failed to load session", {
        sessionToken,
        error,
      });
      setPageState("error");
    }
  };

  // Fetch en paralelo al splash
  useEffect(() => {
    if (!sessionToken) return;

    fetchSession();
  }, [sessionToken]);

  // El eventType vendrá del backend cuando esté disponible.
  // Por ahora el factory devuelve siempre fotoBoothExperience.
  const { Splash, Carousel, theme: fallbackTheme } = getExperience(
    eventData?.eventTheme?.key,
  );
  const theme = resolvedTheme ?? fallbackTheme;
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

  if (pageState === "loading") {
    return (
      <div
        className={styles.centerState}
        style={theme ? buildThemeVars(theme) : undefined}
      >
        <p className={styles.emptyTitle}>Cargando tus fotos...</p>
      </div>
    );
  }

  if (pageState === "empty") {
    return (
      <EmptyStateEnCamino
        eventData={eventData}
        sessionToken={sessionToken}
        theme={theme}
      />
    );
  }

  if (pageState === "error") {
    return (
      <EmptyStateError
        eventData={eventData}
        sessionToken={sessionToken}
        theme={theme}
      />
    );
  }

  if (pageState === "expired" && eventData) {
    return (
      <EventExpiredPage
        eventName={eventData.honoreesNames}
        eventToken={eventData.eventToken ?? sessionToken}
        eventDate={eventData.date}
        surface="session_expired"
        sessionId={sessionToken}
        path={`/mis-fotos/${sessionToken}`}
        theme={theme}
      />
    );
  }

  return (
    <>
      <Head>
        <title>
          Mis Fotos
          {eventData?.honoreesNames ? ` - ${eventData.honoreesNames}` : ""}
        </title>
      </Head>
      <Carousel
        items={items}
        photos={photos}
        eventData={eventData!}
        eventToken={eventData?.eventToken}
        sessionToken={sessionToken}
        source={source}
        theme={theme}
      />
    </>
  );
}
