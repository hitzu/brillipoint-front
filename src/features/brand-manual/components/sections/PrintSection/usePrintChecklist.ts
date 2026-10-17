import { useCallback, useState } from "react";
import { readStored, writeStored } from "../../../utils/storage";

const STORAGE_KEY = "print";

export const PRINT_CHECKS = [
  "Hay máximo dos tipografías: Jost y Amsterdam One.",
  "El dorado ocupa el 10% o menos, y ningún texto dorado claro va sobre fondo claro.",
  "El logo es la versión plana, sin glow ni sombra, y tiene aire alrededor.",
  "Hay un solo precio por paquete, sin tachados.",
  "Ningún texto de lectura mide menos de 7 pt.",
  "Las fotos son reales, de eventos de Brillipoint.",
  "Se confirmó el color con una prueba de imprenta o con foil.",
  "Photobooth va en claro y Glitter Bar en noche; ninguna cara mezcla las dos líneas.",
  "En la cara oscura: negro enriquecido, texto de 8 pt o más y logo blanco plano.",
];

/** Indexes saved by a previous visit, ignoring anything that isn't a valid checklist index. */
export function readSavedChecks(): number[] {
  try {
    const saved: unknown = JSON.parse(readStored(STORAGE_KEY) ?? "[]");
    return Array.isArray(saved)
      ? saved.filter((index): index is number => Number.isInteger(index) && index >= 0 && index < PRINT_CHECKS.length)
      : [];
  } catch {
    return [];
  }
}

export function usePrintChecklist() {
  const [checked, setChecked] = useState<number[]>([]);

  const save = (next: number[]) => {
    setChecked(next);
    writeStored(STORAGE_KEY, JSON.stringify(next));
  };

  const toggle = (index: number, isChecked: boolean) => {
    const rest = checked.filter((item) => item !== index);
    save(isChecked ? [...rest, index] : rest);
  };

  const reset = () => save([]);

  const restore = useCallback((saved: number[]) => setChecked(saved), []);

  return {
    checked,
    done: checked.length,
    total: PRINT_CHECKS.length,
    progress: (checked.length / PRINT_CHECKS.length) * 100,
    toggle,
    reset,
    restore,
  };
}
