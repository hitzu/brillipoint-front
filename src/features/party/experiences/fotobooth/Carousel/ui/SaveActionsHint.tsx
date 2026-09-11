import React, { RefObject, useEffect, useState } from "react";
import styles from "@assets/css/fotobooth.module.css";

type SaveActionsHintProps = {
  targetRef: RefObject<HTMLElement>;
};

// Gives the guest time to take in the photo and the CTA card before nudging.
const REVEAL_DELAY_MS = 900;

// Floating pill that points to the save/share buttons while they sit below
// the fold. It never shows if the buttons are already on screen, and hides
// for good once the guest reaches them.
const SaveActionsHint = ({ targetRef }: SaveActionsHintProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const target = targetRef.current;
    if (!target || typeof IntersectionObserver === "undefined") return;

    let hasReachedTarget = false;
    const revealTimer = window.setTimeout(() => {
      if (!hasReachedTarget) setIsVisible(true);
    }, REVEAL_DELAY_MS);

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        hasReachedTarget = true;
        window.clearTimeout(revealTimer);
        setIsVisible(false);
        observer.disconnect();
      },
      { threshold: 0.6 },
    );

    observer.observe(target);

    return () => {
      window.clearTimeout(revealTimer);
      observer.disconnect();
    };
  }, [targetRef]);

  const handleClick = () => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    targetRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "end",
    });
  };

  return (
    <button
      type="button"
      className={`${styles.saveHint} ${isVisible ? styles.saveHintVisible : ""}`}
      onClick={handleClick}
      aria-hidden={!isVisible}
      tabIndex={isVisible ? 0 : -1}
    >
      Desliza para guardar tu foto
      <span className={styles.saveHintArrow} aria-hidden="true">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="4" x2="12" y2="19" />
          <polyline points="6 13 12 19 18 13" />
        </svg>
      </span>
    </button>
  );
};

export default SaveActionsHint;
