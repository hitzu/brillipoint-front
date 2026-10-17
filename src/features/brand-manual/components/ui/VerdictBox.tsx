import type { ReactNode } from "react";
import type { VerdictKind } from "../../types";
import ui from "./ui.module.css";

const PILL_TEXT: Record<VerdictKind, string> = { ok: "SE PUEDE", warn: "CON CUIDADO", no: "NO" };

interface VerdictBoxProps {
  kind: VerdictKind;
  children: ReactNode;
  /** Replaces the default pill text for the kind. */
  label?: string;
  className?: string;
  testId?: string;
}

/** A can/can't verdict: a pill with the outcome and the reason next to it. */
export function VerdictBox({ kind, children, label, className, testId }: VerdictBoxProps) {
  return (
    <div className={[ui.verdict, className].filter(Boolean).join(" ")} data-testid={testId}>
      <span className={`${ui.pill} ${ui[kind]}`}>{label ?? PILL_TEXT[kind]}</span>
      <p>{children}</p>
    </div>
  );
}
