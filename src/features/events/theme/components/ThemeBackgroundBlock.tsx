import React, { useRef } from "react";
import { Button, Form } from "react-bootstrap";

const ACCEPTED_MIMES = ["image/png", "image/jpeg", "image/webp"];

interface ThemeBackgroundBlockProps {
  previewUrl: string | null;
  onFileSelected: (file: File) => void;
  onInvalidMime: () => void;
  onRemove: () => void;
  removeDisabled: boolean;
}

/** Splash background editor: current preview, a file picker and a remove button. */
const ThemeBackgroundBlock = ({
  previewUrl,
  onFileSelected,
  onInvalidMime,
  onRemove,
  removeDisabled,
}: ThemeBackgroundBlockProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_MIMES.includes(file.type)) {
      onInvalidMime();
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    onFileSelected(file);
  };

  return (
    <div className="mb-4">
      <h6>Fondo de la pantalla de bienvenida</h6>
      <div className="mb-2">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Fondo actual del evento"
            style={{ maxWidth: "240px", maxHeight: "240px", objectFit: "cover" }}
            className="rounded border"
          />
        ) : (
          <div className="text-muted">Sin imagen de fondo</div>
        )}
      </div>
      <Form.Group className="mb-2">
        <Form.Control
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleChange}
        />
        <Form.Text muted>Formatos permitidos: PNG, JPEG o WEBP.</Form.Text>
      </Form.Group>
      <Button
        type="button"
        variant="outline-danger"
        size="sm"
        onClick={onRemove}
        disabled={removeDisabled}
      >
        Quitar fondo
      </Button>
    </div>
  );
};

export default ThemeBackgroundBlock;
