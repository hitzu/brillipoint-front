import React from "react";
import styles from "@assets/css/fotobooth.module.css";
import { EffectName, SessionItem } from "../../../../types/session";
import { ItemLoadState } from "../types";
import EffectOverlay from "./EffectOverlay";
import { useT } from "../../../../i18n/LocaleProvider";

type ItemStageProps = {
  activeEffect: EffectName;
  activeIndex: number;
  canNavigate: boolean;
  itemState: ItemLoadState;
  items: SessionItem[];
  onGoTo: (index: number) => void;
  onItemError: (index: number) => void;
  onItemLoad: (index: number) => void;
  onPointerEnd: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerStart: (event: React.PointerEvent<HTMLDivElement>) => void;
  onRetry: (index: number) => void;
};

const ItemStage = ({
  activeEffect,
  activeIndex,
  canNavigate,
  itemState,
  items,
  onGoTo,
  onItemError,
  onItemLoad,
  onPointerEnd,
  onPointerStart,
  onRetry,
}: ItemStageProps) => {
  const { t } = useT();

  return (
    <>
      <div className={styles.photoArea}>
        <div
          className={styles.photoCard}
          onPointerDown={onPointerStart}
          onPointerUp={onPointerEnd}
        >
          <div
            className={styles.viewerTrack}
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {items.map((item, itemIndex) => {
              const isActive = itemIndex === activeIndex;
              const currentState = isActive
                ? itemState
                : { retryCount: 0, status: "idle" as const };
              const shouldLoad = isActive || currentState.retryCount > 0;
              const srcWithRetry = `${item.src}${
                currentState.retryCount > 0
                  ? `${item.src.includes("?") ? "&" : "?"}retry=${currentState.retryCount}`
                  : ""
              }`;

              return (
                <div
                  key={`${item.src}-${itemIndex}`}
                  className={styles.viewerSlide}
                >
                  <div className={styles.viewerMediaFrame}>
                    {currentState.status !== "loaded" && (
                      <div className={styles.viewerSkeleton}>
                        <div className={styles.viewerSkeletonShimmer} />
                      </div>
                    )}

                    {currentState.status === "error" ? (
                      <div className={styles.viewerErrorState}>
                        <div className={styles.viewerErrorIcon}>!</div>
                        <div className={styles.viewerErrorText}>
                          {t("carousel.itemLoadError")}
                        </div>
                        <button
                          type="button"
                          className={styles.viewerRetryBtn}
                          onClick={() => onRetry(itemIndex)}
                        >
                          {t("carousel.retry")}
                        </button>
                      </div>
                    ) : shouldLoad ? (
                      <img
                        key={srcWithRetry}
                        src={srcWithRetry}
                        alt={item.alt}
                        className={`${styles.photoImg} ${
                          currentState.status === "loaded"
                            ? styles.photoImgVisible
                            : styles.photoImgHidden
                        }`}
                        onLoad={() => onItemLoad(itemIndex)}
                        onError={() => onItemError(itemIndex)}
                        draggable={false}
                      />
                    ) : null}

                    {isActive && currentState.status === "loaded" ? (
                      <EffectOverlay effect={activeEffect} />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {canNavigate && (
          <>
            <button
              className={`${styles.navBtn} ${styles.navBtnPrev}`}
              onClick={() => onGoTo(activeIndex - 1)}
              aria-label={t("carousel.previousPhoto")}
            >
              <svg
                width="12"
                height="16"
                viewBox="0 0 12 16"
                fill="currentColor"
              >
                <polygon points="12,0 0,8 12,16" />
              </svg>
            </button>
            <button
              className={`${styles.navBtn} ${styles.navBtnNext}`}
              onClick={() => onGoTo(activeIndex + 1)}
              aria-label={t("carousel.nextPhoto")}
            >
              <svg
                width="12"
                height="16"
                viewBox="0 0 12 16"
                fill="currentColor"
              >
                <polygon points="0,0 12,8 0,16" />
              </svg>
            </button>
          </>
        )}
      </div>
    </>
  );
};

export default ItemStage;
