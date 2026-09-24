import { useEffect, useId, useRef, useState } from "react";
import styles from "./MonthYearPicker.module.css";

interface MonthYearPickerProps {
  year: number;
  /** 0-based month (0 = enero). */
  month: number;
  onChange: (year: number, month: number) => void;
  /** Trigger text; defaults to "Octubre 2026". */
  label?: string;
}

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

/**
 * Navigable month title: clicking it opens a 12-month grid with year arrows.
 * Browsing years is local; only choosing a month reports a change.
 */
export const MonthYearPicker = ({
  year,
  month,
  onChange,
  label,
}: MonthYearPickerProps) => {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(year);
  const rootRef = useRef<HTMLDivElement>(null);
  const dialogId = useId();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open]);

  const toggle = () => {
    if (!open) setViewYear(year);
    setOpen((value) => !value);
  };

  const choose = (nextMonth: number) => {
    onChange(viewYear, nextMonth);
    setOpen(false);
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        onClick={toggle}
      >
        <span>{label ?? `${MONTH_NAMES[month]} ${year}`}</span>
        <span className={styles.caret} aria-hidden="true">
          ▾
        </span>
      </button>
      {open ? (
        <div
          id={dialogId}
          className={styles.popover}
          role="dialog"
          aria-label="Elegir mes y año"
        >
          <div className={styles.yearRow}>
            <button
              type="button"
              aria-label="Año anterior"
              onClick={() => setViewYear((value) => value - 1)}
            >
              ‹
            </button>
            <strong aria-live="polite">{viewYear}</strong>
            <button
              type="button"
              aria-label="Año siguiente"
              onClick={() => setViewYear((value) => value + 1)}
            >
              ›
            </button>
          </div>
          <div className={styles.monthGrid} role="group" aria-label="Mes">
            {MONTH_NAMES.map((name, index) => (
              <button
                type="button"
                key={name}
                aria-label={name}
                aria-pressed={viewYear === year && index === month}
                onClick={() => choose(index)}
              >
                {name.slice(0, 3).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
