import { PointerEvent, useRef } from "react";
import { useRouter } from "next/router";
import { CarouselProps } from "../../../types";
import {
  buildUniqueDownloadFilename,
  copyToClipboard,
  downloadFile,
  downloadPhoto,
  fetchRemoteFile,
  getFileExtensionFromUrl,
  shareFile,
} from "../../../../utils/mediaActions";
import { AnalyticsAction } from "../../../../../../interfaces";
import { trackEvent } from "../../../../../../api/services/eventAnalyticsService";
import { useFotoBoothCarouselStore } from "../stores/useFotoBoothCarouselStore";
import { buildFallbackItems } from "../types";
import { appendSourceToPath } from "../../../../utils/sourceTracking";
import { SocialPlatform } from "../../../../components/SocialCta";

const SWIPE_THRESHOLD_PX = 40;

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;

  return date
    .toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();
};

export const useFotoBoothCarousel = ({
  photos,
  items,
  eventData,
  eventToken,
  sessionToken,
  source = "direct",
}: CarouselProps) => {
  const router = useRouter();
  const pointerStartX = useRef<number | null>(null);

  const {
    index,
    activeEffect,
    isGeneratingAsset,
    isSuccessCtaOpen,
    successCtaSource,
    shareFallbackFile,
    shareFallbackPreviewUrl,
    isShareFallbackOpen,
    itemStates,
    setIndex,
    setIsGeneratingAsset,
    openSuccessCta,
    closeSuccessCta,
    openShareFallback,
    closeShareFallback,
    markItemLoaded,
    markItemError,
    retryItem,
  } = useFotoBoothCarouselStore();

  const normalizedItems =
    items && items.length > 0
      ? items
      : buildFallbackItems(photos.map((photo) => photo.url));

  const activeItem = normalizedItems[index] ?? null;
  const activeItemState = itemStates[index] ?? { retryCount: 0, status: "idle" };
  const canNavigate = normalizedItems.length > 1;
  const resolvedEventToken = eventToken ?? eventData.eventToken;
  const canOpenGallery = Boolean(resolvedEventToken);
  const formattedDate = eventData.date ? formatDate(eventData.date) : "";

  const trackSessionEvent = (
    action: AnalyticsAction,
    metadata: Record<string, unknown> = {},
  ) => {
    if (!resolvedEventToken) return;

    trackEvent(action, resolvedEventToken, {
      sessionId: sessionToken,
      metadata: {
        source,
        session_id: sessionToken,
        photoCount: photos.length,
        itemCount: normalizedItems.length,
        ...metadata,
      },
    });
  };

  const buildOriginalItemFile = async () => {
    if (!activeItem) {
      throw new Error("No hay un item activo para exportar.");
    }

    return fetchRemoteFile(
      activeItem.originalSrc,
      buildUniqueDownloadFilename(
        "brillipoint",
        getFileExtensionFromUrl(activeItem.originalSrc, "jpg"),
      ),
    );
  };

  const handleDownloadSuccess = () => {
    if (!activeItem) return;

    trackSessionEvent(AnalyticsAction.DOWNLOAD, {
      surface: "session_page",
      itemIndex: index,
      itemType: activeItem.type,
      effectName: activeEffect,
      variant: "original",
    });
    openSuccessCta("download");
  };

  const handleShareSuccess = async (file: File) => {
    if (!activeItem) return;

    const eventName = eventData.honoreesNames?.trim() || "Brillipoint";
    const shareResult = await shareFile(file, `${eventName} · original`);

    if (shareResult === "shared") {
      trackSessionEvent(AnalyticsAction.SHARE_CONFIRM_EXECUTED, {
        itemIndex: index,
        itemType: activeItem.type,
        effectName: activeEffect,
        variant: "original",
        surface: "session_carousel",
      });
      openSuccessCta("share");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    openShareFallback(file, previewUrl);
  };

  const goTo = (nextIndex: number) => {
    if (!canNavigate) return;

    const total = normalizedItems.length;
    setIndex(((nextIndex % total) + total) % total);
  };

  const handlePointerStart = (event: PointerEvent<HTMLDivElement>) => {
    pointerStartX.current = event.clientX;
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerStartX.current === null) return;

    const deltaX = event.clientX - pointerStartX.current;
    pointerStartX.current = null;

    if (Math.abs(deltaX) <= SWIPE_THRESHOLD_PX) return;

    goTo(deltaX < 0 ? index + 1 : index - 1);
  };

  const handleSave = async () => {
    if (!activeItem) return;

    setIsGeneratingAsset(true);
    try {
      await downloadPhoto(
        activeItem.originalSrc,
        buildUniqueDownloadFilename(
          eventData.honoreesNames || "brillipoint",
          getFileExtensionFromUrl(activeItem.originalSrc, "jpg"),
        ),
      );
      handleDownloadSuccess();
    } finally {
      setIsGeneratingAsset(false);
    }
  };

  const handleShare = async () => {
    if (!activeItem) return;

    setIsGeneratingAsset(true);
    try {
      const file = await buildOriginalItemFile();
      await handleShareSuccess(file);
    } finally {
      setIsGeneratingAsset(false);
    }
  };

  const handleFallbackDownload = () => {
    if (!shareFallbackFile) return;

    downloadFile(shareFallbackFile);
    closeShareFallback();
    openSuccessCta("download");
  };

  const handleCopySessionLink = async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;

    return copyToClipboard(window.location.href);
  };

  const handleOpenGallery = () => {
    if (!resolvedEventToken) return;

    void router.push(
      appendSourceToPath(`/fiesta/${resolvedEventToken}`, "session_to_fiesta"),
    );
  };

  const handleOpenRewardPromo = () => {
    trackSessionEvent(AnalyticsAction.REWARD_PROMO_OPENED, {
      surface: "session_reward_promo",
      entrypoint: "floating_gift",
    });
  };

  const handleSessionCtaVisible = () => {
    trackSessionEvent(AnalyticsAction.SESSION_SOCIAL_CTA_VIEWED, {
      surface: "session_page",
    });
  };

  const handleSuccessCtaWhatsAppClick = () => {
    trackSessionEvent(AnalyticsAction.CTA_WA_POST_DOWNLOAD, {
      surface: "post_action_confirmation",
      ctaSource: successCtaSource,
    });
  };

  const handleSuccessCtaSocialClick = (platform: SocialPlatform) => {
    trackSessionEvent(AnalyticsAction.SESSION_SOCIAL_CLICKED, {
      surface: "post_action_confirmation",
      platform,
      ctaSource: successCtaSource,
    });
  };

  const handleSessionWhatsAppClick = () => {
    trackSessionEvent(AnalyticsAction.SESSION_WHATSAPP_CLICKED, {
      surface: "session_page",
    });
  };

  const handleSessionSocialClick = (platform: SocialPlatform) => {
    trackSessionEvent(AnalyticsAction.SESSION_SOCIAL_CLICKED, {
      surface: "session_page",
      platform,
    });
  };

  return {
    activeEffect,
    activeItem,
    activeItemState,
    canNavigate,
    canOpenGallery,
    closeShareFallback,
    closeSuccessCta,
    formattedDate,
    goTo,
    handleCopySessionLink,
    handleFallbackDownload,
    handleItemError: markItemError,
    handleItemLoad: markItemLoaded,
    handleOpenGallery,
    handleOpenRewardPromo,
    handlePointerEnd,
    handlePointerStart,
    handleRetry: retryItem,
    handleSave,
    handleSessionCtaVisible,
    handleSessionSocialClick,
    handleSessionWhatsAppClick,
    handleShare,
    handleSuccessCtaSocialClick,
    handleSuccessCtaWhatsAppClick,
    index,
    isGeneratingAsset,
    isShareFallbackOpen,
    isSuccessCtaOpen,
    items: normalizedItems,
    shareFallbackPreviewUrl,
    successCtaSource,
  };
};
