import React, { useEffect, useMemo, useState } from "react";
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
import { getEventGallerySessionV2 } from "../../../api/services/partyPublicService";
import {
  buildSessionItems,
  getPhotoItems,
  localizeSessionItems,
} from "../utils/buildSessionItems";
import {
  isExpiredEventStatus,
  isExpiredSessionStatus,
} from "../utils/eventStatus";
import { formatSplashDate } from "../utils/formatSplashDate";
import { buildThemeVars } from "../utils/themeVars";
import { EventPageTheme } from "../types/eventPageTheme";
import { useEventTheme } from "../hooks/useEventTheme";
import { isFreshThemeCacheEnabled } from "../utils/freshThemeCache";
import { useSocialCtaViewModel } from "../hooks/useSocialCtaViewModel";
import { useRewardPromoViewModel } from "../hooks/useRewardPromoViewModel";
import { SessionItem } from "../types/session";
import { readSourceFromRouter } from "../utils/sourceTracking";
import { EventExpiredPage } from "./EventExpiredPage";
import { useT, withLocaleProvider } from "../i18n/LocaleProvider";
import type { TranslationKey } from "../i18n/types";

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
  const { locale, t } = useT();

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
        {t("misFotos.empty.titleBeforeNames")}{" "}
        <strong>
          {eventData?.honoreesNames ?? t("misFotos.fallbackEventName")}
        </strong>{" "}
        {t("misFotos.empty.titleAfterNames")}
      </p>
      {eventData?.date && (
        <p className={styles.emptySubtitle}>
          {formatSplashDate(locale, eventData.date)}
        </p>
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
}) => {
  const { locale, t } = useT();

  return (
    <div
      className={styles.centerState}
      style={theme ? buildThemeVars(theme) : undefined}
    >
      <p className={styles.emptyTitle}>
        {t("misFotos.error.titleBeforeNames")}{" "}
        <strong>
          {eventData?.honoreesNames ?? t("misFotos.fallbackEventName")}
        </strong>{" "}
        {t("misFotos.error.titleAfterNames")}
      </p>
      {eventData?.date && (
        <p className={styles.emptySubtitle}>
          {t("misFotos.error.dateHint", {
            date: formatSplashDate(locale, eventData.date) ?? "",
          })}
        </p>
      )}
      <button
        className={styles.retryBtn}
        onClick={() => window.location.reload()}
      >
        {t("misFotos.error.retry")}
      </button>
    </div>
  );
};

// ─── Page ────────────────────────────────────────────────────────────────────

function MisFotosPage({ sessionToken }: { sessionToken: string }) {
  const router = useRouter();
  const { locale, t } = useT();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [items, setItems] = useState<SessionItem[]>([]);
  const [photos, setPhotos] = useState<SessionPhoto[]>([]);
  const [eventData, setEventData] = useState<SessionEventData | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  // Holds the key, not the copy, so the label follows a language switch.
  const [splashStep, setSplashStep] = useState<TranslationKey>(
    "misFotos.splash.preparing",
  );
  const [themeEventToken, setThemeEventToken] = useState<string | null>(null);
  const [themeReadyOverride, setThemeReadyOverride] = useState(false);

  const source = readSourceFromRouter(router);
  const freshTheme = isFreshThemeCacheEnabled(
    router.isReady,
    router.query.cache,
  );

  // Theme travels in its own request, separate from the session photos. The
  // eventToken is only known after the session resolves (no eventToken in
  // the mis-fotos URL), so `themeEventToken` is only set once fetchSession
  // gets eventData. The splash waits only on this — the session/photos keep
  // loading in the background and render their own loading state once the
  // splash ends.
  const {
    eventTheme,
    pageTheme,
    status: themeStatus,
  } = useEventTheme(router.isReady ? themeEventToken : undefined, freshTheme);
  const socialCta = useSocialCtaViewModel(eventTheme);
  const rewardPromo = useRewardPromoViewModel(eventTheme);
  // Alt texts follow a language switch made after the session loaded.
  const localizedItems = useMemo(
    () => localizeSessionItems(items, locale, eventData?.honoreesNames),
    [items, locale, eventData?.honoreesNames],
  );
  const themeReady = themeEventToken
    ? themeStatus !== "default"
    : themeReadyOverride;

  const fetchSession = async () => {
    try {
      setSplashStep("misFotos.splash.findingSession");
      const session = await getEventGallerySessionV2(sessionToken);
      setEventData(session?.event ?? null);

      if (session?.event?.eventToken) {
        setThemeEventToken(session.event.eventToken);
      } else {
        setThemeReadyOverride(true);
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

      const sessionItems = buildSessionItems(session, locale);
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

      setSplashStep("misFotos.splash.revealing");
      setPhotos(orderedPhotos);
      setPageState("ready");
    } catch (error) {
      setThemeReadyOverride(true);
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
  const { Splash, Carousel } = getExperience(eventData?.eventTheme?.key);
  const theme = pageTheme;
  const splashDate = formatSplashDate(locale, eventData?.date);

  if (showSplash) {
    return (
      <Splash
        honoreesNames={eventData?.honoreesNames}
        date={splashDate}
        isReady={themeReady}
        stepLabel={t(splashStep)}
        onComplete={() => setShowSplash(false)}
        duration={SPLASH_DURATION_MS}
        canFinish={themeReady}
        theme={theme}
        images={eventTheme.images}
        decorations={eventTheme.decorations}
      />
    );
  }

  if (pageState === "loading") {
    return (
      <div
        className={styles.centerState}
        style={theme ? buildThemeVars(theme) : undefined}
      >
        <p className={styles.emptyTitle}>{t("misFotos.loading")}</p>
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
        socialCta={socialCta}
        images={eventTheme.images}
      />
    );
  }

  return (
    <>
      <Head>
        <title>
          {eventData?.honoreesNames
            ? t("misFotos.pageTitleWithNames", {
                names: eventData.honoreesNames,
              })
            : t("misFotos.pageTitle")}
        </title>
      </Head>
      <Carousel
        items={localizedItems}
        photos={photos}
        eventData={eventData!}
        eventToken={eventData?.eventToken}
        sessionToken={sessionToken}
        source={source}
        theme={theme}
        socialCta={socialCta}
        rewardPromo={rewardPromo}
      />
    </>
  );
}

export default withLocaleProvider(MisFotosPage);
