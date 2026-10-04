import React, { useEffect, useRef, useState } from "react";
import { Button, Form } from "react-bootstrap";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const ACCEPTED_MIMES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

interface ThemeSplashIconBlockProps {
  previewUrl: string | null;
  onFileSelected: (file: File) => void;
  onInvalidMime: () => void;
  onRemove: () => void;
  removeDisabled: boolean;
  /** Opaque `#RRGGBB` plate or null when unset. */
  plate: string | null;
  onPlateChange: (plate: string | null) => void;
}

/** Splash logo editor: current preview, a file picker and a remove button. */
const ThemeSplashIconBlock = ({
  previewUrl,
  onFileSelected,
  onInvalidMime,
  onRemove,
  removeDisabled,
  plate,
  onPlateChange,
}: ThemeSplashIconBlockProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasLogo = Boolean(previewUrl);
  const [draft, setDraft] = useState(plate ?? "");
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setDraft(plate ?? "");
    setInvalid(false);
  }, [plate]);

  const handleDraftChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.trim();
    setDraft(value);
    if (value === "") {
      setInvalid(false);
      onPlateChange(null);
    } else if (HEX_COLOR.test(value)) {
      setInvalid(false);
      onPlateChange(value.toLowerCase());
    } else {
      setInvalid(true);
    }
  };

  const handlePickerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onPlateChange(event.target.value.toLowerCase());
  };

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
      <h6>Logo y fondo del logo (pantalla de bienvenida)</h6>
      <div className="mb-2">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Logo actual del evento"
            style={{ maxWidth: "240px", maxHeight: "240px", objectFit: "contain" }}
            className="rounded border"
          />
        ) : (
          <div className="text-muted">Sin logo</div>
        )}
      </div>
      <Form.Group className="mb-2">
        <Form.Control
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          aria-label="Archivo del logo de bienvenida"
          onChange={handleChange}
        />
        <Form.Text muted>
          Formatos permitidos: PNG, JPEG, WEBP o SVG. Se muestra sobre el color primario cuando
          el evento no tiene foto de fondo; una versión de un solo color (monocromática) se ve
          mejor.
        </Form.Text>
      </Form.Group>
      <Button
        type="button"
        variant="outline-danger"
        size="sm"
        onClick={onRemove}
        disabled={removeDisabled}
      >
        Quitar logo
      </Button>

      <div className="mt-3">
        <Form.Label htmlFor="splash-plate-text" className="mb-1">
          Color del círculo
        </Form.Label>
        <div className="d-flex align-items-center gap-2 mb-1">
          <Form.Control
            type="color"
            aria-label="Color del círculo (selector)"
            value={plate && HEX_COLOR.test(plate) ? plate : "#000000"}
            onChange={handlePickerChange}
            disabled={!hasLogo}
            style={{ width: "48px", padding: "2px" }}
          />
          <Form.Control
            id="splash-plate-text"
            type="text"
            placeholder="#000000"
            maxLength={7}
            value={draft}
            onChange={handleDraftChange}
            disabled={!hasLogo}
            isInvalid={invalid}
            style={{ maxWidth: "120px" }}
          />
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            onClick={() => onPlateChange(null)}
            disabled={!hasLogo || !plate}
          >
            Sin color
          </Button>
        </div>
        {invalid && <div className="text-danger small">Usa el formato #RRGGBB.</div>}
        <Form.Text muted>
          Úsalo si tu logo trae fondo sólido (por ejemplo negro) para que el círculo se funda con
          él.
        </Form.Text>
        {hasLogo && plate && (
          <div className="mt-2">
            <div
              data-testid="splash-plate-preview"
              style={{
                position: "relative",
                width: "108px",
                height: "108px",
                borderRadius: "50%",
                overflow: "hidden",
                background: plate,
                boxShadow: "0 6px 24px rgba(0, 0, 0, 0.28)",
              }}
            >
              <img
                src={previewUrl as string}
                alt="Vista previa del círculo"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  padding: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThemeSplashIconBlock;
