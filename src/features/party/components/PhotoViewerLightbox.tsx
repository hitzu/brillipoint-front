import React, { useCallback, useEffect, useRef, useState } from "react";
import Lightbox, {
  type ControllerRef,
  type SlotStyles,
} from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { EventPhoto, AnalyticsAction } from "../../../interfaces";
import { getEventPhotoDisplayUrl } from "@shared/utils/photoDisplayUrl";
import styles from "@assets/css/party-public.module.css";
import { sharePhoto } from "../utils/mediaActions";
import { trackEvent } from "../../../api/services/eventAnalyticsService";
import { useModalStateMachine } from "../hooks/useModalStateMachine";
import { PostActionConfirmation } from "./PostActionConfirmation";
import { SocialPlatform } from "./SocialCta";
import { SocialCtaViewModel } from "../theme/buildSocialCtaViewModel";
import { RewardPromoViewModel } from "../theme/buildRewardPromoViewModel";
import { useT } from "../i18n/LocaleProvider";

type PhotoViewerLightboxProps = {
  isOpen: boolean;
  photos: EventPhoto[];
  activeIndex: number | null;
  eventTitle: string;
  onClose: () => void;
  onActiveIndexChange: (nextIndex: number) => void;
  onDownload?: (photo: EventPhoto) => Promise<void>;
  onShare?: (photo: EventPhoto) => Promise<void>;
  onPersonalize?: (photo: EventPhoto) => void;
  onDedicate?: (photo: EventPhoto) => void;
  nombreFestejado?: string;
  eventToken?: string;
  showMediaActions?: boolean;
  showNavigationHints?: boolean;
  backdropColor?: string;
  themeVars?: React.CSSProperties;
  /**
   * `undefined`/`null` hides the post-action CTA — the deprecated
   * `/party/[token]` route (`PartyPublicPage`) doesn't have a resolved
   * theme to pass and is left unchanged, so it simply omits this prop.
   */
  socialCta?: SocialCtaViewModel | null;
  /**
   * `undefined`/`null` hides the tag/discount copy in the share-confirm
   * step (brand-kit events, or the deprecated `PartyPublicPage`); the share
   * button keeps working with a neutral title.
   */
  rewardPromo?: RewardPromoViewModel | null;
};

const PhotoViewerLightbox = ({
  isOpen,
  photos,
  activeIndex,
  eventTitle,
  onClose,
  onActiveIndexChange,
  onDownload,
  onShare,
  onPersonalize,
  onDedicate,
  eventToken,
  showMediaActions = true,
  showNavigationHints = false,
  backdropColor,
  themeVars,
  socialCta,
  rewardPromo,
}: PhotoViewerLightboxProps) => {
  const { t } = useT();
  const [currentIndex, setCurrentIndex] = React.useState(activeIndex ?? 0);
  const [hintVisible, setHintVisible] = useState(false);
  const { state: modalState, dispatch, reset } = useModalStateMachine();
  const controllerRef = useRef<ControllerRef | null>(null);

  useEffect(() => {
    if (isOpen && activeIndex !== null) {
      setCurrentIndex(activeIndex);
    }
  }, [isOpen, activeIndex]);

  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  useEffect(() => {
    if (!showNavigationHints || typeof window === "undefined") return;

    const hasSeenHint = window.localStorage.getItem("gallery_hint_seen");
    setHintVisible(!hasSeenHint);
  }, [showNavigationHints]);

  const modalStateRef = useRef(modalState);
  modalStateRef.current = modalState;

  useEffect(() => {
    if (!isOpen) return;

    window.history.pushState({ modal: true }, "");

    const handlePopState = () => {
      const current = modalStateRef.current;
      if (current === "gallery-photo") {
        onClose();
      } else {
        if (current === "share-confirm") {
          dispatch({ type: "CLOSE_SHARE_CONFIRM" });
        } else {
          dispatch({ type: "RETURN_TO_GALLERY" });
        }
        window.history.pushState({ modal: true }, "");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isOpen, onClose, dispatch]);

  const slides = photos.map((p) => ({
    src: getEventPhotoDisplayUrl(p),
    alt: eventTitle,
  }));

  const activePhoto =
    activeIndex !== null && activeIndex >= 0
      ? (photos[activeIndex] ?? null)
      : null;
  const canNavigate = photos.length > 1;

  const handleView = useCallback(
    ({ index }: { index: number }) => {
      setHintVisible(false);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("gallery_hint_seen", "true");
      }
      setCurrentIndex(index);
      reset();
      onActiveIndexChange(index);
    },
    [onActiveIndexChange, reset],
  );

  const currentPhoto = photos[currentIndex] ?? activePhoto;
  const showNavigationUi = showNavigationHints && canNavigate;
  const showActions = showMediaActions && currentPhoto;
  const showControls = showNavigationUi || showActions;
  const lightboxRootStyles = {
    ...(themeVars ?? {}),
    ...(backdropColor
      ? { ["--yarl__color_backdrop" as string]: backdropColor }
      : {}),
  } as React.CSSProperties;
  const lightboxStyles = { root: lightboxRootStyles } as SlotStyles;

  const handleClose = useCallback(() => {
    if (modalStateRef.current !== "gallery-photo") {
      if (modalStateRef.current === "share-confirm") {
        dispatch({ type: "CLOSE_SHARE_CONFIRM" });
      } else {
        dispatch({ type: "RETURN_TO_GALLERY" });
      }
    } else if (window.history.state?.modal) {
      window.history.back();
    } else {
      reset();
      onClose();
    }
  }, [onClose, dispatch, reset]);

  const handlePostActionWaClick = useCallback(() => {
    if (!eventToken) return;
    trackEvent(AnalyticsAction.CTA_WA_POST_DOWNLOAD, eventToken, {
      surface: "gallery_lightbox",
    });
  }, [eventToken]);

  const handlePostActionSocialClick = useCallback(
    (platform: SocialPlatform) => {
      if (!eventToken) return;
      trackEvent(AnalyticsAction.SESSION_SOCIAL_CLICKED, eventToken, {
        surface: "gallery_lightbox",
        metadata: { platform },
      });
    },
    [eventToken],
  );

  const handlePrev = useCallback(() => {
    controllerRef.current?.prev();
  }, []);

  const handleNext = useCallback(() => {
    controllerRef.current?.next();
  }, []);

  if (!isOpen || photos.length === 0) return null;

  return (
    <Lightbox
      open={isOpen}
      index={activeIndex ?? 0}
      close={handleClose}
      slides={slides}
      on={{ view: handleView }}
      carousel={{
        finite: !canNavigate,
        preload: 2,
      }}
      controller={{ closeOnBackdropClick: true, ref: controllerRef }}
      className={styles.yarlDarkOverlay}
      styles={lightboxStyles}
      render={{
        buttonClose: () => (
          <button
            type="button"
            className={styles.viewerClose}
            onClick={handleClose}
            aria-label={t("lightbox.backAriaLabel")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: 6 }}
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {t("lightbox.back")}
          </button>
        ),
        buttonPrev: showNavigationUi ? () => null : undefined,
        buttonNext: showNavigationUi ? () => null : undefined,
        controls: () =>
          showControls ? (
            <>
              {showNavigationUi ? (
                <>
                  <button
                    type="button"
                    className={`${styles.viewerNav} ${styles.viewerNavLeft}`}
                    onClick={handlePrev}
                    aria-label={t("lightbox.previousPhoto")}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className={`${styles.viewerNav} ${styles.viewerNavRight}`}
                    onClick={handleNext}
                    aria-label={t("lightbox.nextPhoto")}
                  >
                    ›
                  </button>
                </>
              ) : null}
              <div className={styles.viewerActionsFixed}>
                {showNavigationUi && hintVisible ? (
                  <div className={styles.viewerNavigationMeta}>
                    <p className={styles.viewerHint}>
                      {t("lightbox.navigationHint")}
                    </p>
                  </div>
                ) : null}
                {showActions ? (
                  <>
                    {modalState === "gallery-photo" && (
                      <>
                        {/* Fila 1 — primarios, color sólido, sin emojis */}
                        <div className={styles.viewerPrimaryActions}>
                          {onPersonalize ? (
                            <button
                              type="button"
                              className={`${styles.btnExperience} ${styles.btnPersonalizar}`}
                              onClick={() => onPersonalize(currentPhoto)}
                              aria-label={t("lightbox.personalizeAriaLabel")}
                            >
                              {t("lightbox.personalize")}
                            </button>
                          ) : null}
                          {onDedicate ? (
                            <button
                              type="button"
                              className={`${styles.btnExperience} ${styles.btnDedicar}`}
                              onClick={() => onDedicate(currentPhoto)}
                              aria-label={t("lightbox.dedicateAriaLabel")}
                            >
                              {t("lightbox.dedicate")}
                              <span className={styles.badgeNew}>
                                {t("lightbox.newBadge")}
                              </span>
                            </button>
                          ) : null}
                        </div>

                        {/* Fila 2 — SVG estilo Instagram, sin texto */}
                        <div className={styles.viewerSecondaryActions}>
                          <button
                            type="button"
                            className={`${styles.btnIcon}${backdropColor ? ` ${styles.btnIconSolid}` : ""}`}
                            aria-label={t("lightbox.downloadAriaLabel")}
                            onClick={async () => {
                              await onDownload?.(currentPhoto);
                              dispatch({ type: "DOWNLOAD_ORIGINAL_SUCCESS" });
                            }}
                          >
                            <svg
                              width="22"
                              height="22"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          </button>
                          {onShare ? (
                            <button
                              type="button"
                              className={`${styles.btnIcon}${backdropColor ? ` ${styles.btnIconSolid}` : ""}`}
                              aria-label={t("lightbox.shareAriaLabel")}
                              onClick={() =>
                                dispatch({ type: "OPEN_SHARE_CONFIRM" })
                              }
                            >
                              <svg
                                width="22"
                                height="22"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                              </svg>
                            </button>
                          ) : null}
                        </div>
                      </>
                    )}

                    {modalState === "post-download" && (
                      <div className={styles.modalEndState}>
                        <PostActionConfirmation
                          onClose={() =>
                            dispatch({ type: "RETURN_TO_GALLERY" })
                          }
                          nombreFestejado={eventTitle}
                          socialCta={socialCta}
                          onWAClick={handlePostActionWaClick}
                          onSocialClick={handlePostActionSocialClick}
                        />
                      </div>
                    )}

                    {modalState === "post-share" && (
                      <div className={styles.modalEndState}>
                        <PostActionConfirmation
                          source="share"
                          onClose={() =>
                            dispatch({ type: "RETURN_TO_GALLERY" })
                          }
                          nombreFestejado={eventTitle}
                          socialCta={socialCta}
                          onWAClick={handlePostActionWaClick}
                          onSocialClick={handlePostActionSocialClick}
                        />
                      </div>
                    )}

                    {modalState === "share-confirm" && (
                      <div className={styles.modalEndState}>
                        <div className={styles.shareConfirmCard}>
                          <button
                            type="button"
                            className={styles.shareConfirmClose}
                            onClick={() =>
                              dispatch({ type: "CLOSE_SHARE_CONFIRM" })
                            }
                            aria-label={t("lightbox.close")}
                          >
                            ✕
                          </button>
                          {rewardPromo ? (
                            <>
                              <p className={styles.endStateTitulo}>
                                {t("lightbox.shareConfirm.titleBeforeHandle")}{" "}
                                <span className={styles.shareHighlight}>
                                  {rewardPromo.handle}
                                </span>
                              </p>
                              <p className={styles.endStateSubtitulo}>
                                {t("lightbox.shareConfirm.text")}
                              </p>
                            </>
                          ) : (
                            <p className={styles.endStateTitulo}>
                              {t("lightbox.shareConfirm.titleNoPromo")}
                            </p>
                          )}
                          <button
                            type="button"
                            className={styles.shareConfirmBtn}
                            onClick={async () => {
                              if (eventToken) {
                                trackEvent(
                                  AnalyticsAction.SHARE_CONFIRM_EXECUTED,
                                  eventToken,
                                );
                              }
                              await sharePhoto(
                                currentPhoto.publicUrl,
                                eventTitle,
                                t("lightbox.shareTitle", { name: eventTitle }),
                              );
                              dispatch({ type: "SHARE_SUCCESS" });
                            }}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="22" y1="2" x2="11" y2="13" />
                              <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                            {t("lightbox.shareConfirm.button")}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </>
          ) : null,
      }}
    />
  );
};

export default PhotoViewerLightbox;
