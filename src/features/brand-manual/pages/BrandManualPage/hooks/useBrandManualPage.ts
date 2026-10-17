import { useCallback, useRef, useState } from "react";
import { SECTIONS } from "../../../constants/sections";
import type { Line, SectionId } from "../../../types";
import { writeStored } from "../../../utils/storage";

const TOAST_MS = 1800;

export function useBrandManualPage() {
  const [line, setLine] = useState<Line>("light");
  const [section, setSection] = useState<SectionId>("marca");
  // The entrance animation only plays after the viewer navigates, not on first paint.
  const [animate, setAnimate] = useState(false);
  const [toast, setToast] = useState({ message: "", visible: false });
  const scrollRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const selectSection = useCallback((id: SectionId) => {
    setSection(id);
    setAnimate(true);
    writeStored("sec", id);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, []);

  const restoreSection = useCallback((id: SectionId) => setSection(id), []);

  const notify = useCallback((message: string) => {
    setToast({ message, visible: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((current) => ({ ...current, visible: false })), TOAST_MS);
  }, []);

  const activeLabel = SECTIONS.find((item) => item.id === section)?.label ?? "";

  return {
    line,
    setLine,
    section,
    activeLabel,
    selectSection,
    restoreSection,
    animate,
    scrollRef,
    toast,
    toastTimer,
    notify,
  };
}
