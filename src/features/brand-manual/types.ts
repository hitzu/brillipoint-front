/** Photobooth uses the light token set; Glitter Bar uses the night one. */
export type Line = "light" | "dark";

export type ColorToken =
  | "surface-000"
  | "surface-100"
  | "surface-200"
  | "ink"
  | "ink-muted"
  | "line"
  | "gold-500"
  | "gold-700"
  | "gold-100"
  | "on-gold"
  | "neon";

export type VerdictKind = "ok" | "warn" | "no";

export interface Verdict {
  kind: VerdictKind;
  message: string;
  /** Overrides the default pill text for the kind. */
  label?: string;
}

export type SectionId =
  | "marca"
  | "logo"
  | "color"
  | "tipo"
  | "piezas"
  | "apps"
  | "voz"
  | "no"
  | "print";

export type LogoVersionId = "neon" | "black" | "signatureBlack" | "signatureWhite";

export type LogoBackgroundId = "ivory" | "white" | "warmBlack" | "black";

export type TypeStyleId =
  | "script-xl"
  | "script-l"
  | "display"
  | "h1"
  | "h2"
  | "h3"
  | "eyebrow"
  | "body"
  | "small"
  | "price";
