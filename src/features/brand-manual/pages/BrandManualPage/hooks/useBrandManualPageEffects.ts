import { useEffect, type MutableRefObject } from "react";
import { isSectionId } from "../../../constants/sections";
import type { SectionId } from "../../../types";
import { readStored } from "../../../utils/storage";

interface Params {
  restoreSection: (id: SectionId) => void;
  toastTimer: MutableRefObject<ReturnType<typeof setTimeout> | undefined>;
}

export function useBrandManualPageEffects({ restoreSection, toastTimer }: Params): void {
  // Reopen the section the viewer had open last time (client only, after hydration).
  useEffect(() => {
    const saved = readStored("sec");
    if (isSectionId(saved)) restoreSection(saved);
  }, [restoreSection]);

  useEffect(() => {
    const timer = toastTimer;
    return () => clearTimeout(timer.current);
  }, [toastTimer]);
}
