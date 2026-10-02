/** Image mimes accepted by `POST /theme-assets/upload-url`; SVG only for icon-like slots (e.g. `splashIcon`). */
export type ThemeAssetMime =
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "image/svg+xml";

export type ThemeAssetOwnerType = "event";

/** Slots editable from the event theme section. */
export type ThemeAssetSlot = "background" | "splashIcon";

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
