import { useEffect, useRef, type ReactNode } from "react";
import { reportReservationBlockViewed } from "../tracking/reservationTracker";

/** Reports once per page load when at least half of the block is on screen. */
export const TrackedBlock = ({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          reportReservationBlockViewed(id);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [id]);

  return <div ref={ref}>{children}</div>;
};
