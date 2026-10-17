import type { TypeStyleId } from "../../types";
import typeStyles from "./typeStyles.module.css";

const CLASS_BY_STYLE: Record<TypeStyleId, string> = {
  "script-xl": typeStyles.scriptXl,
  "script-l": typeStyles.scriptL,
  display: typeStyles.display,
  h1: typeStyles.h1,
  h2: typeStyles.h2,
  h3: typeStyles.h3,
  eyebrow: typeStyles.eyebrow,
  body: typeStyles.body,
  small: typeStyles.small,
  price: typeStyles.price,
};

export const typeClass = (style: TypeStyleId): string => CLASS_BY_STYLE[style];
