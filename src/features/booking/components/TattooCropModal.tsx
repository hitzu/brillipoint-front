import { Modal } from "react-bootstrap";
import React, { useEffect, useRef, useState } from "react";
import Cropper, { ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import styles from "@assets/css/contract-public.module.css";
import {
  CROP_MAX_SIDE,
  canDecodeImage,
  canvasToCroppedFile,
  getCropOutput,
  isFullImageCrop,
} from "../utils/cropImage";

type Props = {
  /** Images the client picked, already validated. They are cropped in order. */
  files: File[];
  /** Called once with the files to upload (cancelled images are left out). */
  onFinish: (files: File[]) => void;
};

const mutedText = { color: "var(--bp-brown-2)", fontSize: 13 } as const;
const actionStyle = { minHeight: 56, flex: 1, fontSize: 16 } as const;

// cropper.js ships 5 px handles on phones. Bigger visible handles plus an
// invisible hit area of about 44 px around each one make the box workable with
// a finger.
const TOUCH_CSS = `
.tattoo-cropper .cropper-point.point-e,
.tattoo-cropper .cropper-point.point-n,
.tattoo-cropper .cropper-point.point-w,
.tattoo-cropper .cropper-point.point-s,
.tattoo-cropper .cropper-point.point-ne,
.tattoo-cropper .cropper-point.point-nw,
.tattoo-cropper .cropper-point.point-sw,
.tattoo-cropper .cropper-point.point-se {
  box-sizing: border-box;
  width: 16px;
  height: 16px;
  opacity: 1;
  background: #fff;
  border: 2px solid #2c201c;
  border-radius: 50%;
}
.tattoo-cropper .cropper-point::after {
  content: "";
  position: absolute;
  top: -16px;
  right: -16px;
  bottom: -16px;
  left: -16px;
}
.tattoo-cropper .cropper-point.point-e { right: -8px; margin-top: -8px; }
.tattoo-cropper .cropper-point.point-n { top: -8px; margin-left: -8px; }
.tattoo-cropper .cropper-point.point-w { left: -8px; margin-top: -8px; }
.tattoo-cropper .cropper-point.point-s { bottom: -8px; margin-left: -8px; }
.tattoo-cropper .cropper-point.point-ne { top: -8px; right: -8px; }
.tattoo-cropper .cropper-point.point-nw { top: -8px; left: -8px; }
.tattoo-cropper .cropper-point.point-sw { bottom: -8px; left: -8px; }
.tattoo-cropper .cropper-point.point-se { bottom: -8px; right: -8px; }
.tattoo-cropper .cropper-line.line-e { right: -10px; width: 20px; }
.tattoo-cropper .cropper-line.line-w { left: -10px; width: 20px; }
.tattoo-cropper .cropper-line.line-n { top: -10px; height: 20px; }
.tattoo-cropper .cropper-line.line-s { bottom: -10px; height: 20px; }
`;

type StepProps = {
  file: File;
  working: boolean;
  setWorking: (working: boolean) => void;
  /** `null` means the client cancelled this image. */
  onDone: (file: File | null) => void;
};

/** One image. Remounted per image (keyed by the parent) so nothing leaks across. */
function CropStep({ file, working, setWorking, onDone }: StepProps) {
  const cropperRef = useRef<ReactCropperElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<"checking" | "ready">("checking");
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const [cropperReady, setCropperReady] = useState(false);
  const [cropFailed, setCropFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    // Some browsers cannot decode every image (e.g. HEIC on desktop). Such an
    // image is dropped without telling the client.
    void canDecodeImage(url).then((ok) => {
      if (cancelled) return;
      if (ok) setPhase("ready");
      else onDoneRef.current(null);
    });
    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const confirm = async () => {
    const instance = cropperRef.current?.cropper;
    if (!instance) return;
    setWorking(true);
    setCropFailed(false);
    try {
      // Box still over the whole image: keep the original, no re-encode.
      if (isFullImageCrop(instance.getData(true), instance.getImageData())) {
        onDone(file);
        return;
      }
      const canvas = instance.getCroppedCanvas({
        maxWidth: CROP_MAX_SIDE,
        maxHeight: CROP_MAX_SIDE,
        imageSmoothingQuality: "high",
        // JPEG has no alpha: paint transparent areas white instead of black.
        ...(getCropOutput(file).mime === "image/jpeg" ? { fillColor: "#fff" } : {}),
      });
      if (!canvas) throw new Error("The crop produced no canvas.");
      onDone(await canvasToCroppedFile(canvas, file));
    } catch {
      setCropFailed(true);
      setWorking(false);
    }
  };

  return (
    <>
      <Modal.Body>
        <div style={{ display: "grid", gap: "0.75rem" }}>
              <div style={mutedText}>
                Ajusta el recuadro para quedarte solo con lo que quieres subir.
              </div>
              <div className="tattoo-cropper">
                <style>{TOUCH_CSS}</style>
                {phase === "ready" && previewUrl ? (
                  <Cropper
                    ref={cropperRef}
                    src={previewUrl}
                    alt={file.name}
                    style={{ height: "min(55vh, 420px)", width: "100%" }}
                    viewMode={1}
                    autoCropArea={1}
                    background={false}
                    responsive
                    guides
                    minCropBoxWidth={30}
                    minCropBoxHeight={30}
                    zoomable={false}
                    zoomOnTouch={false}
                    zoomOnWheel={false}
                    movable={false}
                    rotatable={false}
                    scalable={false}
                    toggleDragModeOnDblclick={false}
                    ready={() => setCropperReady(true)}
                  />
                ) : (
                  <div style={mutedText}>Cargando imagen…</div>
                )}
              </div>
          {cropFailed ? (
            <div role="alert" style={{ color: "#b3261e", fontWeight: 800 }}>
              No pudimos recortar esta imagen. Intenta de nuevo o cancela.
            </div>
          ) : null}
        </div>
      </Modal.Body>
      <Modal.Footer style={{ display: "flex", gap: 12, flexWrap: "nowrap" }}>
        <button
          type="button"
          className={styles.btnSecondary}
          style={actionStyle}
          disabled={working}
          onClick={() => onDone(null)}
        >
          Cancelar
        </button>
        <button
          type="button"
          className={styles.btnPrimary}
          style={actionStyle}
          disabled={!cropperReady || working}
          onClick={() => void confirm()}
        >
          Listo
        </button>
      </Modal.Footer>
    </>
  );
}

/**
 * Crops the picked images one by one before they are uploaded. Every image
 * passes through it, but the box starts over the whole image, so one tap on
 * "Listo" keeps it unchanged. Only the result is handed back; an original that
 * was cropped is never uploaded.
 */
export function TattooCropModal({ files, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<File[]>([]);
  const [working, setWorking] = useState(false);

  const advance = (file: File | null) => {
    const next = file ? [...results, file] : results;
    if (index + 1 >= files.length) {
      onFinish(next);
      return;
    }
    setResults(next);
    setIndex(index + 1);
    setWorking(false);
  };

  return (
    <Modal
      show
      // Escape or a dismiss counts as cancelling this image, never as uploading it.
      onHide={() => {
        if (!working) advance(null);
      }}
      backdrop="static"
      centered
      fullscreen="sm-down"
      size="lg"
      aria-labelledby="tattoo-crop-title"
    >
      <Modal.Header>
        <div style={{ display: "grid", gap: 2 }}>
          <Modal.Title id="tattoo-crop-title" as="h2" style={{ fontSize: 18 }}>
            Recortar imagen
          </Modal.Title>
          <span aria-live="polite" style={{ ...mutedText, fontWeight: 700 }}>
            {`Imagen ${index + 1} de ${files.length}`}
          </span>
        </div>
      </Modal.Header>
      <CropStep
        key={index}
        file={files[index]}
        working={working}
        setWorking={setWorking}
        onDone={advance}
      />
    </Modal>
  );
}
