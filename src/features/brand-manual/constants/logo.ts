import type { ColorToken, Line, LogoBackgroundId, LogoVersionId } from "../types";

export interface LogoVersion {
  name: string;
  description: string;
  /** Color of the mark itself: a light logo needs a dark background. */
  ink: "light" | "dark";
  glow?: boolean;
  /** Script signature of the previous brand, kept as reference only. */
  signature?: boolean;
}

export const LOGO_VERSIONS: Record<LogoVersionId, LogoVersion> = {
  neon: {
    name: "Principal · neón",
    description: "Blanco con glow. Pantalla, fondo oscuro, en grande.",
    ink: "light",
    glow: true,
  },
  black: {
    name: "Principal · negro",
    description: "Fondos claros en pantalla. Trae una sombra suave.",
    ink: "dark",
  },
  signatureBlack: {
    name: "Firma · negra",
    description: "Marca anterior. Solo referencia.",
    ink: "dark",
    signature: true,
  },
  signatureWhite: {
    name: "Firma · blanca",
    description: "Marca anterior. Solo referencia.",
    ink: "light",
    signature: true,
  },
};

export interface LogoBackground {
  name: string;
  token: ColorToken;
  line: Line;
  dark: boolean;
}

export const LOGO_BACKGROUNDS: Record<LogoBackgroundId, LogoBackground> = {
  ivory: { name: "Marfil", token: "surface-100", line: "light", dark: false },
  white: { name: "Blanco", token: "surface-000", line: "light", dark: false },
  warmBlack: { name: "Negro cálido", token: "surface-100", line: "dark", dark: true },
  black: { name: "Negro", token: "surface-000", line: "dark", dark: true },
};

export const LOGO_SIZE = { min: 40, max: 280, step: 4, initial: 200 };
