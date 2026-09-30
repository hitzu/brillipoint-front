/** Only image mimes accepted by `POST /theme-assets/upload-url` for now (no SVG). */
export type ThemeAssetMime = "image/png" | "image/jpeg" | "image/webp";

export type ThemeAssetOwnerType = "event";

/** Only the `background` slot is editable from the event theme section (T3). */
export type ThemeAssetSlot = "background";

export interface ThemeAssetUploadUrlPayload {
  ownerType: ThemeAssetOwnerType;
  ownerId: number;
  slot: ThemeAssetSlot;
  fileName: string;
  mime: ThemeAssetMime;
}

export interface ThemeAssetUploadUrlResponse {
  bucket: string;
  path: string;
  signedUrl: string;
  token: string;
  publicUrl: string;
}
