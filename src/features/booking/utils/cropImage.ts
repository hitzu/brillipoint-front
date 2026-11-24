// Pure helpers behind the tattoo crop step. They live apart from the modal so
// tests can mock the canvas work (jsdom has no canvas).

/** JPEG quality used when a cropped photo is re-encoded. */
export const CROP_JPEG_QUALITY = 0.92;

/**
 * Longest side of an exported crop. Mobile Safari returns a blank canvas above
 * roughly 16M pixels, which a 48 MP photo would exceed.
 */
export const CROP_MAX_SIDE = 4096;

export type CropRect = { x: number; y: number; width: number; height: number };
export type NaturalSize = { naturalWidth: number; naturalHeight: number };
export type CropOutput = { mime: "image/png" | "image/jpeg"; fileName: string };

/**
 * True while the crop box still covers the whole image. The client then keeps
 * the original file untouched (no re-encode). One pixel absorbs float rounding.
 */
export const isFullImageCrop = (
  crop: CropRect,
  image: NaturalSize,
  tolerance = 1,
): boolean =>
  Math.abs(crop.x) <= tolerance &&
  Math.abs(crop.y) <= tolerance &&
  Math.abs(crop.width - image.naturalWidth) <= tolerance &&
  Math.abs(crop.height - image.naturalHeight) <= tolerance;

const withExtension = (fileName: string, extension: string): string => {
  const base = fileName.replace(/\.[^./\\]+$/, "") || "imagen";
  return `${base}${extension}`;
};

/** A cropped PNG stays PNG (transparency); anything else is exported as JPEG. */
export const getCropOutput = (
  original: Pick<File, "name" | "type">,
): CropOutput =>
  original.type === "image/png"
    ? { mime: "image/png", fileName: withExtension(original.name, ".png") }
    : { mime: "image/jpeg", fileName: withExtension(original.name, ".jpg") };

/** Encodes the cropped canvas as the File that replaces the original upload. */
export const canvasToCroppedFile = (
  canvas: HTMLCanvasElement,
  original: Pick<File, "name" | "type">,
): Promise<File> => {
  const { mime, fileName } = getCropOutput(original);
  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("The cropped image could not be encoded."));
          return;
        }
        resolve(new File([blob], fileName, { type: mime }));
      },
      mime,
      mime === "image/jpeg" ? CROP_JPEG_QUALITY : undefined,
    );
  });
};

/** False when this browser cannot open the image (e.g. HEIC on desktop). */
export const canDecodeImage = (url: string): Promise<boolean> =>
  new Promise<boolean>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image.naturalWidth > 0 && image.naturalHeight > 0);
    image.onerror = () => resolve(false);
    image.src = url;
  });
