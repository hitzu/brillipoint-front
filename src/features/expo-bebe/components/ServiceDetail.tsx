import { useEffect, useRef, useState } from "react";
import styles from "@assets/css/expo-bebe.module.css";
import type { ServiceItem } from "../types";
import { IconChevronLeft, IconChevronRight, IconEye, IconEyeOff, IconX } from "./Icons";

export function ServiceDetail({
  isOpen,
  items,
  currentIndex,
  modeLabel,
  onClose,
  onSelectIndex,
  onPrevious,
  onNext,
}: {
  isOpen: boolean;
  items: ServiceItem[];
  currentIndex: number;
  modeLabel: string;
  onClose: () => void;
  onSelectIndex: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const [controlsVisible, setControlsVisible] = useState(true);
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(
    null,
  );
  const service = items[currentIndex] ?? null;

  useEffect(() => {
    if (isOpen) setControlsVisible(true);
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrevious();
      if (e.key === "ArrowRight") onNext();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose, onNext, onPrevious]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current == null) return;

    const dx = e.changedTouches[0].clientX - touchStart.current.x;

    if (Math.abs(dx) > 40) {
      if (dx < 0) onNext();
      else onPrevious();
    }

    touchStart.current = null;
  };

  const toggleControls = () => {
    setControlsVisible((visible) => !visible);
  };

  const photoStyle = service?.imageUrl
    ? {
        backgroundColor: "#f8f3ec",
        backgroundImage: `url(${service.imageUrl})`,
        backgroundSize: "contain",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
    : { background: service?.bg };

  return (
    <div
      className={`${styles.detailOverlay} ${isOpen ? styles.detailOverlayOpen : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={`${modeLabel} Expo`}
    >
      {service && (
        <>
          <div
            className={styles.detailPhotoArea}
            style={photoStyle}
            onDoubleClick={toggleControls}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          />

          <button
            className={`${styles.detailClose} ${
              !controlsVisible ? styles.detailControlHidden : ""
            }`}
            onClick={onClose}
            aria-label="Cerrar"
            type="button"
          >
            <IconX />
          </button>

          {/* <button
            className={styles.detailToggleControls}
            onClick={toggleControls}
            aria-label={controlsVisible ? "Ocultar controles" : "Mostrar controles"}
            type="button"
          >
            {controlsVisible ? <IconEye /> : <IconEyeOff />}
          </button> */}

          {items.length > 1 && (
            <>
              <button
                className={`${styles.detailArrow} ${styles.detailArrowPrev} ${
                  !controlsVisible ? styles.detailControlHidden : ""
                }`}
                onClick={onPrevious}
                aria-label="Anterior"
                type="button"
              >
                <IconChevronLeft />
              </button>
              <button
                className={`${styles.detailArrow} ${styles.detailArrowNext} ${
                  !controlsVisible ? styles.detailControlHidden : ""
                }`}
                onClick={onNext}
                aria-label="Siguiente"
                type="button"
              >
                <IconChevronRight />
              </button>
            </>
          )}

          {/* <div
            className={`${styles.detailThumbRail} ${
              !controlsVisible ? styles.detailControlHidden : ""
            }`}
          >
            <div className={styles.detailThumbHeader}>
              <span>{modeLabel}</span>
              <span>
                {String(currentIndex + 1).padStart(2, "0")} /{" "}
                {String(items.length).padStart(2, "0")}
              </span>
            </div>

            <div className={styles.detailThumbScroller}>
              {items.map((item, index) => (
                <button
                  key={`${modeLabel}-${index}`}
                  className={`${styles.detailThumb} ${
                    index === currentIndex ? styles.detailThumbActive : ""
                  }`}
                  onClick={() => onSelectIndex(index)}
                  aria-label={`Ver ${item.title.join(" ")}`}
                  aria-current={index === currentIndex}
                  type="button"
                >
                  <span
                    className={styles.detailThumbImage}
                    style={
                      item.imageUrl
                        ? {
                            backgroundColor: "#f8f3ec",
                            backgroundImage: `url(${item.imageUrl})`,
                            backgroundSize: "contain",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                          }
                        : { background: item.bg }
                    }
                  >
                  </span>
                  <span className={styles.detailThumbText}>
                    {item.title.join(" ")}
                  </span>
                </button>
              ))}
            </div>
          </div> */}
        </>
      )}
    </div>
  );
}
