import { useEffect } from "react";
import { readSavedChecks } from "./usePrintChecklist";

/** Restores the checklist after hydration so server and client render the same markup first. */
export function usePrintChecklistEffects(restore: (saved: number[]) => void): void {
  useEffect(() => {
    restore(readSavedChecks());
  }, [restore]);
}
