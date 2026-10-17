import type { CSSProperties } from "react";

/** Four quarter-circle arcs: the brand's spark, always in gold-500. */
export const SPARK_PATH = "M8 0A8 8 0 0 0 16 8A8 8 0 0 0 8 16A8 8 0 0 0 0 8A8 8 0 0 0 8 0Z";

interface SparkProps {
  className?: string;
  style?: CSSProperties;
}

export function Spark({ className, style }: SparkProps) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className} style={style}>
      <path d={SPARK_PATH} />
    </svg>
  );
}
