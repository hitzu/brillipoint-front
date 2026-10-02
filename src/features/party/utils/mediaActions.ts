export type ShareResult = "shared" | "copied" | "unsupported";

type ShareUrlOptions = {
  fallbackText?: string;
  nativeOnly?: boolean;
  text?: string;
};

const OBJECT_URL_REVOKE_DELAY_MS = 3000;

const sanitizeSegment = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const normalizeExtension = (extension: string) => {
  const sanitized = extension.replace(/^\./, "").trim().toLowerCase();
  return sanitized || "jpg";
};

export const inferMimeTypeFromExtension = (extension: string) => {
  switch (normalizeExtension(extension)) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "mp4":
      return "video/mp4";
    default:
      return "application/octet-stream";
  }
};

export const getFileExtensionFromUrl = (url: string, fallback = "jpg") => {
  try {
    const pathname = new URL(url).pathname;
    const extension = pathname.split(".").pop();
    return normalizeExtension(extension || fallback);
  } catch (_error) {
    return normalizeExtension(fallback);
  }
};

export const buildDownloadFilename = (
  eventName: string,
  photoIndex: number,
  extension = "jpg",
) => {
  const safeEventName = sanitizeSegment(eventName || "evento");
  return `brillipoint-${safeEventName}-${photoIndex + 1}.${normalizeExtension(extension)}`;
};

const buildUniqueId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
};

export const buildUniqueDownloadFilename = (
  prefix = "brillipoint",
  extension = "jpg",
) => {
  const normalizedPrefix = sanitizeSegment(prefix || "brillipoint").replace(/-/g, "_");
  const safePrefix = normalizedPrefix || "brillipoint";
  return `${safePrefix}_${buildUniqueId()}.${normalizeExtension(extension)}`;
};

const scheduleObjectUrlRevoke = (objectUrl: string) => {
  globalThis.setTimeout(
    () => URL.revokeObjectURL(objectUrl),
    OBJECT_URL_REVOKE_DELAY_MS,
  );
};

export const downloadPhoto = async (url: string, filename: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not download the photo");

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  scheduleObjectUrlRevoke(objectUrl);
};

export const downloadFile = (file: File, filename?: string) => {
  const objectUrl = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename || file.name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  scheduleObjectUrlRevoke(objectUrl);
};

export const fetchRemoteFile = async (url: string, filename?: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Could not download the original file");
  }

  const blob = await response.blob();
  const fallbackExtension =
    blob.type.split("/").pop() || getFileExtensionFromUrl(url, "jpg");
  const resolvedFileName =
    filename || `brillipoint.${getFileExtensionFromUrl(url, fallbackExtension)}`;
  const resolvedMimeType =
    blob.type && blob.type !== "application/octet-stream"
      ? blob.type
      : inferMimeTypeFromExtension(getFileExtensionFromUrl(url, fallbackExtension));

  return new File([blob], resolvedFileName, { type: resolvedMimeType });
};

export const copyToClipboard = async (value: string): Promise<boolean> => {
  if (typeof navigator === "undefined") return false;

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (_error) {
      // Continue with fallback.
    }
  }

  if (typeof document === "undefined") return false;

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "absolute";
  textArea.style.left = "-9999px";

  try {
    document.body.appendChild(textArea);
    textArea.select();
    textArea.setSelectionRange(0, textArea.value.length);
    return document.execCommand("copy");
  } catch (_error) {
    return false;
  } finally {
    textArea.remove();
  }
};

/**
 * `shareTitle` is the share-sheet title in the guest's language; callers
 * without a translator (the deprecated `/party` route) fall back to Spanish.
 */
export const sharePhoto = async (
  imageUrl: string,
  nombreEvento: string,
  shareTitle = `Recuerdo de ${nombreEvento}`,
): Promise<ShareResult> => {
  if (typeof navigator === "undefined") return "unsupported";

  try {
    const file = await fetchRemoteFile(imageUrl);

    const result = await shareFile(file, shareTitle);
    if (result === "shared") {
      return "shared";
    }
  } catch (_error) {
    // fall through to fallback
  }

  window.open(imageUrl, "_blank");
  return "unsupported";
};

export const shareFile = async (
  file: File,
  title: string,
): Promise<ShareResult> => {
  if (typeof navigator === "undefined") return "unsupported";
  if (!navigator.share) return "unsupported";

  const shareDataWithTitle = {
    files: [file],
    title,
  };
  const shareDataMinimal = {
    files: [file],
  };

  try {
    const canShareFiles = navigator.canShare?.(shareDataMinimal);
    const canShareWithTitle = navigator.canShare?.(shareDataWithTitle);

    if (canShareWithTitle !== false) {
      await navigator.share(shareDataWithTitle);
      return "shared";
    }

    if (canShareFiles !== false) {
      await navigator.share(shareDataMinimal);
      return "shared";
    }
  } catch (error) {
    try {
      await navigator.share(shareDataMinimal);
      return "shared";
    } catch (_retryError) {
      console.warn("[mediaActions] Native file share failed", {
        fileName: file.name,
        fileType: file.type,
        error,
      });
      return "unsupported";
    }
  }

  return "unsupported";
};

export const shareUrl = async (
  url: string,
  title: string,
  options: ShareUrlOptions = {},
): Promise<ShareResult> => {
  if (typeof navigator === "undefined") return "unsupported";
  const { fallbackText, nativeOnly = false, text } = options;

  try {
    if (navigator.share) {
      await navigator.share({
        title,
        url,
        ...(text ? { text } : {}),
      });
      return "shared";
    }

    if (nativeOnly) return "unsupported";

    const copied = await copyToClipboard(fallbackText || url);
    return copied ? "copied" : "unsupported";
  } catch (_error) {
    return "unsupported";
  }
};
