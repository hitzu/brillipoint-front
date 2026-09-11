import React, { useRef, useState } from "react";
import styles from "@assets/css/fotobooth.module.css";
import { CarouselProps } from "../../types";
import { useFotoBoothCarousel } from "./hooks/useFotoBoothCarousel";
import { useFotoBoothCarouselEffects } from "./hooks/useFotoBoothCarouselEffects";
import ActionBar from "./ui/ActionBar";
import CarouselHeader from "./ui/CarouselHeader";
import GiftModal from "./ui/GiftModal";
import ItemStage from "./ui/ItemStage";
import SaveActionsHint from "./ui/SaveActionsHint";
import SessionInlineCta from "./ui/SessionInlineCta";
import ShareFallbackModal from "./ui/ShareFallbackModal";
import SuccessCtaModal from "./ui/SuccessCtaModal";
import { buildThemeVars } from "../../../utils/themeVars";

const FotoBoothCarousel = (props: CarouselProps) => {
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const actionBarRef = useRef<HTMLDivElement>(null);
  const {
    activeEffect,
    activeItem,
    activeItemState,
    canNavigate,
    canOpenGallery,
    closeShareFallback,
    closeSuccessCta,
    goTo,
    handleCopySessionLink,
    handleFallbackDownload,
    handleItemError,
    handleItemLoad,
    handleOpenGallery,
    handleOpenRewardPromo,
    handlePointerEnd,
    handlePointerStart,
    handleRetry,
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
    items,
    shareFallbackPreviewUrl,
    successCtaSource,
  } = useFotoBoothCarousel(props);

  useFotoBoothCarouselEffects({
    activeItem,
    activeItemStatus: activeItemState.status,
    eventToken: props.eventToken ?? props.eventData.eventToken,
    index,
    isSuccessCtaOpen,
    items,
    photos: props.photos,
    source: props.source,
    shareFallbackPreviewUrl,
    sessionToken: props.sessionToken,
    successCtaSource,
  });

  return (
    <div
      className={styles.screen}
      style={props.theme ? buildThemeVars(props.theme) : undefined}
    >
      <CarouselHeader
        canOpenGallery={canOpenGallery}
        currentIndex={index}
        onOpenGallery={handleOpenGallery}
        totalItems={items.length}
      />

      <ItemStage
        activeEffect={activeEffect}
        activeIndex={index}
        canNavigate={canNavigate}
        itemState={activeItemState}
        items={items}
        onGoTo={goTo}
        onItemError={handleItemError}
        onItemLoad={handleItemLoad}
        onPointerEnd={handlePointerEnd}
        onPointerStart={handlePointerStart}
        onRetry={handleRetry}
      />

      <SessionInlineCta
        eventName={props.eventData.honoreesNames}
        onWAClick={handleSessionWhatsAppClick}
        onSocialClick={handleSessionSocialClick}
        onGiftPress={() => {
          handleOpenRewardPromo();
          setIsGiftModalOpen(true);
        }}
        onCtaVisible={handleSessionCtaVisible}
      />

      <ActionBar
        ref={actionBarRef}
        isBusy={isGeneratingAsset}
        onSave={handleSave}
        onShare={handleShare}
      />

      <SaveActionsHint targetRef={actionBarRef} />

      <SuccessCtaModal
        eventName={props.eventData.honoreesNames}
        isOpen={isSuccessCtaOpen}
        onClose={closeSuccessCta}
        onSocialClick={handleSuccessCtaSocialClick}
        onWAClick={handleSuccessCtaWhatsAppClick}
        source={successCtaSource}
      />

      <GiftModal
        visible={isGiftModalOpen}
        onClose={() => setIsGiftModalOpen(false)}
        onShare={() => {
          setIsGiftModalOpen(false);
          void handleShare();
        }}
        theme={props.theme}
      />

      {isShareFallbackOpen && shareFallbackPreviewUrl && (
        <ShareFallbackModal
          onClose={closeShareFallback}
          onCopyLink={handleCopySessionLink}
          onDownload={handleFallbackDownload}
          previewUrl={shareFallbackPreviewUrl}
        />
      )}
    </div>
  );
};

export default FotoBoothCarousel;
