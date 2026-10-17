import type { StaticImageData } from "next/image";

/** Next resolves image imports to StaticImageData; Vite (tests) resolves them to a URL string. */
export const assetUrl = (asset: StaticImageData | string): string =>
  typeof asset === "string" ? asset : asset.src;
