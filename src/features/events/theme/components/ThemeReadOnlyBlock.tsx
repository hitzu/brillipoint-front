import React from "react";
import { ReadOnlyThemeEntry } from "../readOnlyThemeEntries";

const KEY_LABELS: Record<string, string> = {
  tokens: "Colores y tipografías",
  images: "Otras imágenes",
  decorations: "Otras decoraciones",
  socialCta: "Llamado a la acción social",
  copy: "Textos",
};

interface ThemeReadOnlyBlockProps {
  entry: ReadOnlyThemeEntry;
}

/** One read-only block per remaining `themeOverrides` key, pretty-printed as JSON. */
const ThemeReadOnlyBlock = ({ entry }: ThemeReadOnlyBlockProps) => {
  return (
    <div className="mb-3">
      <h6>{KEY_LABELS[entry.key] ?? entry.key}</h6>
      <pre className="bg-light border rounded p-2 small mb-0" style={{ overflowX: "auto" }}>
        {JSON.stringify(entry.value, null, 2)}
      </pre>
    </div>
  );
};

export default ThemeReadOnlyBlock;
