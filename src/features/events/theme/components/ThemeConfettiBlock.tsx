import React from "react";
import { Form } from "react-bootstrap";
import { CONFETTI_SHAPES, ConfettiShape } from "../../../party/theme/confettiShapes";
import { CONFETTI_SHAPE_ICON } from "../../../party/components/ConfettiShapeIcons";

const SHAPE_LABELS: Record<ConfettiShape, string> = {
  rect: "Rectángulo",
  circle: "Círculo",
  heart: "Corazón",
  flower: "Flor",
  rose: "Rosa",
  star: "Estrella",
  petal: "Pétalo",
};

interface ThemeConfettiBlockProps {
  selectedShapes: string[];
  onToggleShape: (shape: ConfettiShape) => void;
}

/** Confetti shape toggles, one chip per catalog shape (T5's `CONFETTI_SHAPES`). */
const ThemeConfettiBlock = ({ selectedShapes, onToggleShape }: ThemeConfettiBlockProps) => {
  return (
    <div className="mb-4">
      <h6>Formas del confeti</h6>
      <div className="d-flex flex-wrap gap-2">
        {CONFETTI_SHAPES.map((shape) => {
          const Icon = CONFETTI_SHAPE_ICON[shape];
          const checked = selectedShapes.includes(shape);
          return (
            <Form.Check
              key={shape}
              type="checkbox"
              id={`confetti-shape-${shape}`}
              checked={checked}
              onChange={() => onToggleShape(shape)}
              label={
                <span className="d-inline-flex align-items-center gap-1">
                  <span style={{ width: "16px", height: "16px", display: "inline-block" }}>
                    <Icon />
                  </span>
                  {SHAPE_LABELS[shape]}
                </span>
              }
              className="border rounded px-2 py-1"
            />
          );
        })}
      </div>
    </div>
  );
};

export default ThemeConfettiBlock;
