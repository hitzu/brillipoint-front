import type { SectionId } from "../types";

export const SECTIONS: Array<{ id: SectionId; label: string }> = [
  { id: "marca", label: "La marca" },
  { id: "logo", label: "Logotipo" },
  { id: "color", label: "Color" },
  { id: "tipo", label: "Tipografía" },
  { id: "piezas", label: "Piezas" },
  { id: "apps", label: "Aplicaciones" },
  { id: "voz", label: "Voz" },
  { id: "no", label: "Prohibiciones" },
  { id: "print", label: "Antes de imprimir" },
];

export const isSectionId = (value: unknown): value is SectionId =>
  SECTIONS.some((section) => section.id === value);
