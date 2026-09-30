import React, { useId } from "react";
import styles from "./ThemeConfettiBlock.module.css";
import {
  CONFETTI_SHAPES,
  ConfettiShape,
} from "../../../party/theme/confettiShapes";
import { CONFETTI_SHAPE_ICON } from "../../../party/components/ConfettiShapeIcons";

const SHAPE_LABELS: Record<ConfettiShape, string> = {
  rect: "Rectángulo",
  circle: "Círculo",
  heart: "Corazón",
  flower: "Flor",
  rose: "Rosa",
  star: "Estrella",
  petal: "Pétalo",
  diamond: "Diamante",
  bow: "Moño",
  butterfly: "Mariposa",
  camera: "Cámara",
};

interface ThemeConfettiBlockProps {
  selectedShapes: string[];
  onToggleShape: (shape: ConfettiShape) => void;
}

/** Accessible, theme-aware options for the shared confetti catalog. */
const ThemeConfettiBlock = ({
  selectedShapes,
  onToggleShape,
}: ThemeConfettiBlockProps) => {
  const id = useId();
  return (
    <fieldset className={`${styles.fieldset} mb-4`}>
      <legend className={styles.legend}>Formas del confeti</legend>
      <div className={styles.grid}>
        {CONFETTI_SHAPES.map((shape) => {
          const Icon = CONFETTI_SHAPE_ICON[shape];
          const checked = selectedShapes.includes(shape);
          return (
            <label
              key={shape}
              htmlFor={`${id}-${shape}`}
              className={`${styles.option} ${checked ? styles.selected : ""}`}
            >
              <input
                className={styles.checkbox}
                type="checkbox"
                id={`${id}-${shape}`}
                checked={checked}
                onChange={() => onToggleShape(shape)}
              />
              <span className={styles.icon} aria-hidden="true">
                <Icon />
              </span>
              <span>{SHAPE_LABELS[shape]}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};

export default ThemeConfettiBlock;
