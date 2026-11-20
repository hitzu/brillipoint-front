import { useEffect, useRef } from "react";
import { SessionItem } from "../../../../types/session";
import { CarouselProps } from "../../../types";
import { AnalyticsAction } from "../../../../../../interfaces";
import { trackEvent } from "../../../../../../api/services/eventAnalyticsService";
import { useFotoBoothCarouselStore } from "../stores/useFotoBoothCarouselStore";
import { CtaSource } from "../types";

type UseFotoBoothCarouselEffectsParams = Pick<
  CarouselProps,
  "eventToken" | "photos" | "sessionToken" | "source"
> & {
  activeItem: SessionItem | null;
  activeItemStatus: "idle" | "loaded" | "error";
  index: number;
  isSuccessCtaOpen: boolean;
  items: SessionItem[];
  shareFallbackPreviewUrl: string | null;
  successCtaSource: CtaSource;
};

export const useFotoBoothCarouselEffects = ({
  activeItem,
  activeItemStatus,
  eventToken,
  index,
  isSuccessCtaOpen,
  items,
  photos,
  source = "direct",
  shareFallbackPreviewUrl,
  sessionToken,
  successCtaSource,
}: UseFotoBoothCarouselEffectsParams) => {
  const hasTrackedSessionView = useRef(false);
  const viewedItemIndexes = useRef(new Set<number>());
  const preloadedItemIndexes = useRef(new Set<number>());
  const previousFallbackPreviewUrl = useRef<string | null>(null);
  const hasTrackedCurrentCta = useRef(false);
  const reset = useFotoBoothCarouselStore((state) => state.reset);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  useEffect(() => {
    if (!eventToken || hasTrackedSessionView.current) return;

    hasTrackedSessionView.current = true;
    trackEvent(AnalyticsAction.SESSION_OPENED, eventToken, {
      sessionId: sessionToken,
      surface: "session_page",
      metadata: {
        source,
        session_id: sessionToken,
        photoCount: photos.length,
        itemCount: items.length,
      },
    });
  }, [eventToken, items, photos.length, sessionToken, source]);

  useEffect(() => {
    if (!eventToken || viewedItemIndexes.current.has(index)) return;

    viewedItemIndexes.current.add(index);
    trackEvent(AnalyticsAction.PHOTO_VIEW, eventToken, {
      sessionId: sessionToken,
      surface: "session_page",
      metadata: {
        source,
        itemIndex: index,
        itemType: activeItem?.type ?? "photo",
      },
    });
  }, [activeItem?.type, eventToken, index, sessionToken, source]);

  useEffect(() => {
    if (activeItemStatus !== "loaded") return;

    items.forEach((item, itemIndex) => {
      if (itemIndex === index || preloadedItemIndexes.current.has(itemIndex)) {
        return;
      }

      preloadedItemIndexes.current.add(itemIndex);
      // A video is never an <img>: warm its poster and let the browser stream the clip.
      const preloadSrc = item.type === "video" ? item.posterSrc : item.src;
      if (!preloadSrc) return;
      const image = new Image();
      image.src = preloadSrc;
    });
  }, [activeItemStatus, index, items]);

  useEffect(() => {
    if (!eventToken) return;
    if (!isSuccessCtaOpen) {
      hasTrackedCurrentCta.current = false;
      return;
    }
    if (hasTrackedCurrentCta.current) return;
    hasTrackedCurrentCta.current = true;

    trackEvent(AnalyticsAction.POST_ACTION_CTA_VIEWED, eventToken, {
      sessionId: sessionToken,
      surface: "post_action_confirmation",
      metadata: {
        source,
        session_id: sessionToken,
        ctaSource: successCtaSource,
      },
    });
  }, [eventToken, isSuccessCtaOpen, sessionToken, source, successCtaSource]);

  useEffect(() => {
    if (
      previousFallbackPreviewUrl.current &&
      previousFallbackPreviewUrl.current !== shareFallbackPreviewUrl
    ) {
      URL.revokeObjectURL(previousFallbackPreviewUrl.current);
    }

    previousFallbackPreviewUrl.current = shareFallbackPreviewUrl;
  }, [shareFallbackPreviewUrl]);

  useEffect(() => {
    return () => {
      if (previousFallbackPreviewUrl.current) {
        URL.revokeObjectURL(previousFallbackPreviewUrl.current);
      }
    };
  }, []);
};
