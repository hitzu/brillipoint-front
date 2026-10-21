import { useEffect, useId, useRef, useState } from "react";
import styles from "../story.module.css";

type ZoomableImageProps = { src: string; alt: string; className?: string };

/** A photo that opens full size, uncropped, in a modal. Escape, the backdrop or Close dismiss it. */
export const ZoomableImage = ({ src, alt, className }: ZoomableImageProps) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.zoomTrigger}
        aria-label={`View larger: ${alt}`}
        onClick={() => setOpen(true)}
      >
        <img className={className} src={src} alt={alt} loading="lazy" />
      </button>
      {open ? (
        <div className={styles.lightbox} onClick={() => setOpen(false)}>
          <div
            className={styles.lightboxPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}
          >
            <p id={titleId} className={styles.visuallyHidden}>
              {alt}
            </p>
            <img className={styles.lightboxImage} src={src} alt={alt} />
            <button
              ref={closeRef}
              type="button"
              className={styles.lightboxClose}
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
};
