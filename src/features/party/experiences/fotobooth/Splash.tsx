import React, { useEffect, useMemo } from "react";
import Image from "next/image";
import logoExperience from "@assets/images/logo-experience-white.png";
import styles from "@assets/css/fotobooth.module.css";
import { SplashProps } from "../types";
import { buildThemeVars } from "../../utils/themeVars";
import { buildConfettiPieces } from "../../theme/buildConfettiPieces";
import { shouldRenderDecoration } from "../../theme/shouldRenderDecoration";
import { resolveImageAlt } from "../../theme/resolveImageAlt";
import { resolveSplashLayout } from "../../theme/resolveSplashLayout";
import { CONFETTI_SHAPE_ICON } from "../../components/ConfettiShapeIcons";

const FotoBoothSplash = ({
  honoreesNames,
  date,
  isReady = false,
  stepLabel = "Preparando la experiencia",
  onComplete,
  duration = 3200,
  canFinish = true,
  theme,
  images,
  decorations,
}: SplashProps) => {
  useEffect(() => {
    if (!canFinish) return;
    const t = setTimeout(onComplete, duration);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFinish]);

  const showConfetti = shouldRenderDecoration(decorations, "confetti");

  const confetti = useMemo(() => {
    if (!showConfetti) return null;

    return buildConfettiPieces(decorations, theme).map((piece) => {
      const ShapeIcon = CONFETTI_SHAPE_ICON[piece.shape];
      return (
        <div
          key={piece.id}
          className={styles.confettiPiece}
          style={
            {
              left: `${piece.left}%`,
              top: "-32px",
              width: `${piece.size}px`,
              height: `${piece.size}px`,
              color: piece.color,
              animationDuration: `${piece.animationDuration}s`,
              animationDelay: `${piece.animationDelay}s`,
              "--confetti-drift": `${piece.drift}px`,
            } as React.CSSProperties
          }
        >
          <div
            className={styles.confettiSway}
            style={
              {
                animationDuration: `${piece.swayDuration}s`,
                animationDelay: `${piece.swayDelay}s`,
                "--confetti-sway": `${piece.sway}px`,
                "--confetti-initial-rotation": `${piece.initialRotation}deg`,
                "--confetti-rotation": `${piece.rotation}deg`,
              } as React.CSSProperties
            }
          >
            <ShapeIcon />
          </div>
        </div>
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decorations, theme, showConfetti]);

  const background = images?.background;
  const layout = resolveSplashLayout(images);
  const cover = images?.cover;
  // A plate only applies together with an emblem image.
  const hasPlate = Boolean(theme?.splashEmblemUrl && theme?.splashEmblemPlate);
  const ringClassName = hasPlate
    ? `${styles.splashLogoRing} ${styles.splashLogoRingEmblem} ${styles.splashLogoRingPlate}`
    : theme?.splashEmblemUrl
      ? `${styles.splashLogoRing} ${styles.splashLogoRingEmblem}`
      : styles.splashLogoRing;

  const coverImage = cover && (
    <div className={styles.splashCoverWrap}>
      <img
        src={cover.url}
        alt={resolveImageAlt(cover.alt)}
        className={styles.splashCoverImage}
      />
    </div>
  );

  return (
    <div
      className={
        layout.hasBackground
          ? `${styles.screen} ${styles.splashHasBackground}`
          : styles.screen
      }
      style={theme ? buildThemeVars(theme) : undefined}
    >
      {background && (
        <img
          src={background.url}
          alt={resolveImageAlt(background.alt)}
          className={styles.splashBackgroundImage}
        />
      )}
      {layout.showScrim && <div className={styles.splashScrim} />}
      {layout.showAmbientLayers && (
        <>
          <div className={styles.splashBg} />
          <div className={styles.splashBlob1} />
          <div className={styles.splashBlob2} />
        </>
      )}
      <div className={styles.confettiContainer} aria-hidden="true">
        {confetti}
      </div>

      <div className={styles.splashContent}>
        {cover &&
          (cover.link ? (
            <a
              href={cover.link}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.splashCoverLink}
            >
              {coverImage}
            </a>
          ) : (
            coverImage
          ))}

        <div
          className={ringClassName}
          style={
            hasPlate
              ? ({ "--splash-plate": theme?.splashEmblemPlate } as React.CSSProperties)
              : undefined
          }
        >
          {theme?.splashEmblemUrl ? (
            <Image
              src={theme.splashEmblemUrl}
              alt={honoreesNames ?? "Brillipoint"}
              fill
              sizes="108px"
              className={styles.splashEmblemImage}
              priority
            />
          ) : (
            <Image
              src={logoExperience}
              alt="Brillipoint"
              width={64}
              height={64}
              priority
            />
          )}
        </div>

        <div className={styles.splashDivider} />

        {isReady ? (
          <>
            {honoreesNames && (
              <div className={styles.splashName}>{honoreesNames}</div>
            )}

            {date && <div className={styles.splashDate}>{date}</div>}
          </>
        ) : (
          <div className={styles.splashStep}>{stepLabel}</div>
        )}

        <div className={styles.splashSparkles}>
          <span className={styles.splashSpark}>✦</span>
          <span className={styles.splashSpark}>✦</span>
          <span className={styles.splashSpark}>✦</span>
        </div>
      </div>
    </div>
  );
};

export default FotoBoothSplash;
