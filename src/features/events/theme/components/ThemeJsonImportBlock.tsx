import React, { useId, useState } from "react";
import { Button, Form } from "react-bootstrap";

interface ThemeJsonImportBlockProps {
  /**
   * Applies the pasted text to the editor. Returns a Spanish error message
   * when the text was rejected (nothing changed), or `null` on success.
   */
  onApply: (text: string) => string | null;
}

/** Textarea to paste a `themeOverrides` JSON and load it into the editor (no save). */
const ThemeJsonImportBlock = ({ onApply }: ThemeJsonImportBlockProps) => {
  const id = useId();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const handleApply = () => {
    const nextError = onApply(text);
    setError(nextError);
    setApplied(nextError === null);
  };

  return (
    <div className="mb-4">
      <Form.Label htmlFor={`${id}-json`}>Importar JSON (themeOverrides)</Form.Label>
      <Form.Control
        id={`${id}-json`}
        as="textarea"
        rows={5}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setApplied(false);
        }}
        isInvalid={Boolean(error)}
        spellCheck={false}
        style={{ fontFamily: "monospace", fontSize: "0.85rem" }}
        placeholder='{ "tokens": { "primary": "#1F2937" } }'
      />
      <Form.Text className="text-muted d-block">
        Las URLs de imágenes se ignoran: súbelas en sus bloques. Nada se guarda hasta pulsar
        «Guardar tema».
      </Form.Text>
      {error && (
        <div role="alert" className="text-danger small mt-1">
          {error}
        </div>
      )}
      {applied && (
        <div role="status" className="text-success small mt-1">
          JSON aplicado. Revisa la vista previa y pulsa «Guardar tema» para guardarlo.
        </div>
      )}
      <Button
        type="button"
        variant="outline-secondary"
        size="sm"
        className="mt-2"
        onClick={handleApply}
      >
        Aplicar JSON
      </Button>
    </div>
  );
};

export default ThemeJsonImportBlock;
