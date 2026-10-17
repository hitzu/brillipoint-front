import type { Line } from "../../../types";
import styles from "../BrandManualPage.module.css";

const OPTIONS: Array<{ line: Line; label: string }> = [
  { line: "light", label: "PHOTOBOOTH" },
  { line: "dark", label: "GLITTER BAR" },
];

interface LineToggleProps {
  line: Line;
  onChange: (line: Line) => void;
}

export function LineToggle({ line, onChange }: LineToggleProps) {
  return (
    <div className={styles.segment} role="radiogroup" aria-label="Línea de servicio">
      {OPTIONS.map((option) => (
        <button
          key={option.line}
          type="button"
          role="radio"
          aria-checked={line === option.line}
          onClick={() => onChange(option.line)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
