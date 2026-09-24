import { useEffect, useRef, useState } from "react";
import { Form } from "react-bootstrap";
import {
  closestOptionValue,
  isValidTime,
  type TimeOption,
} from "../utils/timeOptions";
import styles from "./TimeSelect.module.css";

interface Props {
  ariaLabel: string;
  value: string;
  options: TimeOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * Google-Calendar-style time field: a text input holding a plain `HH:mm`
 * string, with a dropdown of preset options (30-min steps, duration-labeled
 * for the end field). Typing any `HH:mm` is still allowed; an invalid value
 * reverts to the last valid one on blur.
 */
export const TimeSelect = ({
  ariaLabel,
  value,
  options,
  onChange,
  disabled = false,
}: Props) => {
  const [open, setOpen] = useState(false);
  // Mirrors `value` for display, but is also the source of truth for the
  // text the user is actively typing, independent of when the parent's
  // controlled `value` prop re-renders back down.
  const [draft, setDraft] = useState(value);
  const listRef = useRef<HTMLUListElement>(null);
  const lastValidRef = useRef(value);
  const listId = useRef(
    `time-select-${Math.random().toString(36).slice(2)}`
  ).current;

  useEffect(() => {
    setDraft(value);
    if (isValidTime(value)) lastValidRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const target = closestOptionValue(options, draft);
    const el = target
      ? listRef.current?.querySelector<HTMLElement>(
          `[data-value="${target}"]`
        )
      : null;
    // jsdom (unit tests) doesn't implement scrollIntoView.
    el?.scrollIntoView?.({ block: "nearest" });
  }, [open, options, draft]);

  const choose = (time: string) => {
    setDraft(time);
    lastValidRef.current = time;
    onChange(time);
    setOpen(false);
  };

  const handleChange = (raw: string) => {
    setDraft(raw);
    if (isValidTime(raw)) lastValidRef.current = raw;
    onChange(raw);
  };

  const handleBlur = () => {
    setOpen(false);
    if (!isValidTime(draft)) {
      setDraft(lastValidRef.current);
      onChange(lastValidRef.current);
    }
  };

  return (
    <div className={styles.wrapper}>
      <Form.Control
        aria-label={ariaLabel}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        value={draft}
        disabled={disabled}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={handleBlur}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
      />
      {open ? (
        <ul className={styles.options} id={listId} role="listbox" ref={listRef}>
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                data-value={option.value}
                aria-selected={option.value === draft}
                className={
                  option.value === draft
                    ? `${styles.option} ${styles.optionSelected}`
                    : styles.option
                }
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option.value)}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
