import type { Line } from "../../types";

export interface SectionProps {
  line: Line;
  onLineChange: (line: Line) => void;
  /** Shows a short message in the page toast. */
  notify: (message: string) => void;
}
