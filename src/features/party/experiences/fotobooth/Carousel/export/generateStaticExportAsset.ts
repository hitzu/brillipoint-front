import { SessionEventData } from "../../../../../../interfaces/eventGallery";
import {
  EffectName,
  ExportVariant,
  SessionItem,
} from "../../../../types/session";
import { getConfettiColors } from "../../../../theme/confettiColors";
import { systemDefaultPageTheme } from "../../../../theme/systemDefaultPageTheme";
import { toCssRgbTriplet } from "../../../../utils/themeVars";

export const EXPORT_MIME_TYPE = "image/jpeg";
export const EXPORT_QUALITY = 0.94;
export const MAX_EXPORT_DIMENSION = 1600;

// This module has no caller today (verified repo-wide: nothing imports
// `generateStaticExportAsset`/`renderOriginalVariantFromSource`/
// `renderPolaroidVariantFromSource`), so no resolved `EventPageTheme` ever
// reaches it. Its colors fall back to the neutral system default rather
// than a hardcoded pink palette (T6); wire an actual theme through here
// if/when a caller is added.
export const CONFETTI_OVERLAY_COLORS = getConfettiColors();
export const HEARTS_OVERLAY_COLOR = `rgba(${
  toCssRgbTriplet(systemDefaultPageTheme.accentColor) ?? "55, 65, 81"
}, 0.8)`;
export const POLAROID_FOOTER_TITLE_COLOR =
  systemDefaultPageTheme.accentColor ?? "#374151";
export const POLAROID_FOOTER_DATE_COLOR = `rgba(${
  toCssRgbTriplet(systemDefaultPageTheme.mutedTextColor) ?? "107, 114, 128"
}, 0.72)`;

type GenerateStaticExportAssetParams = {
  effect: EffectName;
  eventData: SessionEventData;
  item: SessionItem;
  variant: ExportVariant;
};

export const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    image.src = src;
  });

export const fitNaturalSize = (
  width: number,
  height: number,
  maxDimension = MAX_EXPORT_DIMENSION,
) => {
  const currentMaxDimension = Math.max(width, height, 1);
  if (currentMaxDimension <= maxDimension) {
    return { width, height };
  }

  const ratio = maxDimension / currentMaxDimension;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
};

const drawConfettiOverlay = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  phase = 0,
) => {
  const colors = CONFETTI_OVERLAY_COLORS;
  const pieces = 28;

  for (let index = 0; index < pieces; index += 1) {
    const x = (((index * 37) % 100) / 100) * width;
    const progress = (phase + index * 0.053) % 1;
    const y = (-0.12 + progress * 1.24) * height;
    const pieceWidth = width * (0.012 + (index % 3) * 0.002);
    const pieceHeight = pieceWidth * 1.8;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((((index * 23 + progress * 320) % 360) * Math.PI) / 180);
    ctx.fillStyle = colors[index % colors.length];
    ctx.fillRect(0, 0, pieceWidth, pieceHeight);
    ctx.restore();
  }
};

const drawHeartsOverlay = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  phase = 0,
) => {
  const hearts = 10;
  ctx.save();
  ctx.fillStyle = HEARTS_OVERLAY_COLOR;
  ctx.textAlign = "center";

  for (let index = 0; index < hearts; index += 1) {
    const lane = index % 5;
    const travel = (phase * 1.15 + index * 0.09) % 1;
    const x = width * (0.12 + lane * 0.18);
    const y = height * (1.12 - travel * 1.18);
    const fontSize = Math.round(width * (0.045 + (index % 3) * 0.01));
    ctx.font = `700 ${fontSize}px "Public Sans", sans-serif`;
    ctx.fillText("❤", x, y);
  }

  ctx.restore();
};

export const drawEffectOverlay = (
  ctx: CanvasRenderingContext2D,
  effect: EffectName,
  x: number,
  y: number,
  width: number,
  height: number,
  phase = 0,
) => {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  ctx.translate(x, y);

  if (effect === "confetti") {
    drawConfettiOverlay(ctx, width, height, phase);
  }

  if (effect === "hearts") {
    drawHeartsOverlay(ctx, width, height, phase);
  }

  ctx.restore();
};

const formatEventDate = (isoDate?: string) => {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;

  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const renderOriginalVariantFromSource = ({
  effect,
  phase = 0,
  source,
  sourceHeight,
  sourceWidth,
}: {
  effect: EffectName;
  phase?: number;
  source: CanvasImageSource;
  sourceHeight: number;
  sourceWidth: number;
}) => {
  const size = fitNaturalSize(sourceWidth, sourceHeight);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear el canvas");

  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  drawEffectOverlay(ctx, effect, 0, 0, canvas.width, canvas.height, phase);

  return canvas;
};

export const renderPolaroidVariantFromSource = ({
  effect,
  eventData,
  phase = 0,
  source,
  sourceHeight,
  sourceWidth,
}: {
  effect: EffectName;
  eventData: SessionEventData;
  phase?: number;
  source: CanvasImageSource;
  sourceHeight: number;
  sourceWidth: number;
}) => {
  const contentSize = fitNaturalSize(sourceWidth, sourceHeight);
  const framePadding = Math.round(contentSize.width * 0.06);
  const footerHeight = Math.round(contentSize.width * 0.24);
  const canvas = document.createElement("canvas");

  canvas.width = contentSize.width + framePadding * 2;
  canvas.height = contentSize.height + framePadding * 2 + footerHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear el canvas");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const imageX = framePadding;
  const imageY = framePadding;

  ctx.drawImage(source, imageX, imageY, contentSize.width, contentSize.height);
  drawEffectOverlay(
    ctx,
    effect,
    imageX,
    imageY,
    contentSize.width,
    contentSize.height,
    phase,
  );

  const footerTop = imageY + contentSize.height + Math.round(framePadding * 0.9);
  const textPadding = Math.round(framePadding * 1.1);

  ctx.fillStyle = POLAROID_FOOTER_TITLE_COLOR;
  ctx.font = `700 ${Math.max(24, Math.round(canvas.width * 0.046))}px "Public Sans", sans-serif`;
  ctx.fillText(eventData.honoreesNames || "Tu evento", textPadding, footerTop);

  ctx.fillStyle = POLAROID_FOOTER_DATE_COLOR;
  ctx.font = `500 ${Math.max(18, Math.round(canvas.width * 0.028))}px "Public Sans", sans-serif`;
  const dateLabel = formatEventDate(eventData.date);
  if (dateLabel) {
    ctx.fillText(dateLabel, textPadding, footerTop + Math.round(canvas.width * 0.06));
  }

  return canvas;
};

export const canvasToFile = async (canvas: HTMLCanvasElement, fileName: string) => {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result ? resolve(result) : reject(new Error("No se pudo exportar la imagen")),
      EXPORT_MIME_TYPE,
      EXPORT_QUALITY,
    );
  });

  return new File([blob], fileName, { type: EXPORT_MIME_TYPE });
};

export const generateStaticExportAsset = async ({
  effect,
  eventData,
  item,
  variant,
}: GenerateStaticExportAssetParams) => {
  if (item.type !== "photo") {
    throw new Error("La exportacion estatica solo soporta fotos por ahora.");
  }

  const image = await loadImage(item.src);
  const canvas =
    variant === "polaroid"
      ? renderPolaroidVariantFromSource({
          effect,
          eventData,
          source: image,
          sourceHeight: image.naturalHeight,
          sourceWidth: image.naturalWidth,
        })
      : renderOriginalVariantFromSource({
          effect,
          source: image,
          sourceHeight: image.naturalHeight,
          sourceWidth: image.naturalWidth,
        });

  const safeVariant = variant === "polaroid" ? "polaroid" : "original";
  const fileName = `brillipoint-${safeVariant}-${item.index + 1}.jpg`;
  return canvasToFile(canvas, fileName);
};
