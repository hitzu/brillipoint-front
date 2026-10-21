import { useEffect, useRef } from "react";
import styles from "../story.module.css";

type LoopVideoProps = { src: string; poster: string; label: string; caption?: string };

/** Muted inline loop that only downloads and plays while it is on screen. */
export const LoopVideo = ({ src, poster, label, caption }: LoopVideoProps) => {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      video.controls = true;
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {
            video.controls = true;
          });
        } else {
          video.pause();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <figure>
      <video
        ref={ref}
        className={styles.photo}
        src={src}
        poster={poster}
        aria-label={label}
        preload="none"
        muted
        loop
        playsInline
      />
      {caption ? <figcaption className={styles.caption}>{caption}</figcaption> : null}
    </figure>
  );
};
