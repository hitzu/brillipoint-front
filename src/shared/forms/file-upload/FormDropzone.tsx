import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, Button, Row, Col } from "react-bootstrap";
import Dropzone from "react-dropzone";

type SelectedFile = File & {
  preview?: string;
  formattedSize?: string;
};

export type FormDropzoneProps = {
  title?: string;
  /** Main call to action; defaults to the generic "drag or tap" text. */
  label?: React.ReactNode;
  description?: React.ReactNode;
  multiple?: boolean;
  disabled?: boolean;
  embedded?: boolean;
  showUploadButton?: boolean;
  /**
   * When true, shows a local preview list of the selected files.
   * Useful for generic uploads, but can be confusing when the parent UI
   * already shows uploaded previews (e.g. prep profile assets).
   */
  showPreviews?: boolean;
  onFilesSelected?: (files: File[]) => void;
  className?: string;
};

function formatBytes(bytes: number): string {
  const n = Number.isFinite(bytes) ? bytes : 0;
  if (n === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(k)), sizes.length - 1);
  const value = n / Math.pow(k, i);
  const rounded = i === 0 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${sizes[i]}`;
}

const FormDropzone = ({
  title = "Carga de archivos",
  label,
  description = "Arrastra archivos aquí para adjuntarlos (mock)",
  multiple = true,
  disabled = false,
  embedded = false,
  showUploadButton = false,
  showPreviews = true,
  onFilesSelected,
  className,
}: FormDropzoneProps) => {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);

  const acceptsLabel = useMemo(() => {
    return multiple
      ? "Arrastra tus archivos aquí o pulsa para agregarlos"
      : "Arrastra tu archivo aquí o pulsa para agregarlo";
  }, [multiple]);

  function handleAcceptedFiles(files: File[]) {
    if (!showPreviews) {
      setSelectedFiles([]);
      onFilesSelected?.(files);
      return;
    }

    const enhanced: SelectedFile[] = files.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
        formattedSize: formatBytes(file.size),
      }),
    );
    setSelectedFiles(enhanced);
    onFilesSelected?.(files);
  }

  useEffect(() => {
    return () => {
      for (const f of selectedFiles) {
        if (f.preview) URL.revokeObjectURL(f.preview);
      }
    };
  }, [selectedFiles]);

  const content = (
    <>
      <Dropzone
        onDrop={(acceptedFiles) => handleAcceptedFiles(acceptedFiles)}
        multiple={multiple}
        disabled={disabled}
      >
        {({ getRootProps, getInputProps }) => (
          <div
            className={[
              "dropzone dz-clickable text-center",
              className ?? "",
            ].join(" ")}
            style={
              embedded
                ? { padding: 0, background: "transparent", border: 0 }
                : undefined
            }
          >
            <div
              className="dz-message needsclick"
              {...getRootProps()}
              style={
                embedded
                  ? {
                      borderRadius: 16,
                      border: "1px dashed rgba(255,255,255,0.22)",
                      background: "rgba(255,255,255,0.05)",
                      padding: "0.9rem",
                      color: "rgba(255,255,255,0.82)",
                    }
                  : undefined
              }
            >
              <input {...getInputProps()} />
              <div
                className="mb-2"
                style={embedded ? { opacity: 0.85 } : undefined}
              >
                <i className="display-4 text-muted ri-upload-cloud-2-fill" />
              </div>
              <div style={{ fontWeight: 800 }}>{label ?? acceptsLabel}</div>
              <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
                {description}
              </div>
            </div>
          </div>
        )}
      </Dropzone>

      {showPreviews ? (
        <div
          className="list-unstyled mb-0"
          id="file-previews"
          style={{ marginTop: "0.75rem" }}
        >
          {selectedFiles.map((f, i) => {
            return (
              <Card
                className="mt-1 mb-0 shadow-none border dz-processing dz-image-preview dz-success dz-complete"
                key={i + "-file"}
                style={
                  embedded
                    ? {
                        background: "rgba(255,255,255,0.06)",
                        borderColor: "rgba(255,255,255,0.12)",
                      }
                    : undefined
                }
              >
                <div className="p-2">
                  <Row className="align-items-center">
                    <Col className="col-auto">
                      {f.preview ? (
                        <Image
                          height={80}
                          width={100}
                          className="avatar-sm rounded bg-light"
                          alt={f.name}
                          src={f.preview}
                        />
                      ) : null}
                    </Col>
                    <Col>
                      <Link
                        href="#"
                        className={
                          embedded
                            ? "text-white"
                            : "text-muted font-weight-bold"
                        }
                        onClick={(e) => e.preventDefault()}
                      >
                        {f.name}
                      </Link>
                      <p
                        className="mb-0"
                        style={
                          embedded
                            ? { color: "rgba(255,255,255,0.72)" }
                            : undefined
                        }
                      >
                        <strong>{f.formattedSize}</strong>
                      </p>
                    </Col>
                  </Row>
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}

      {showUploadButton ? (
        <div className="text-center m-t-20" style={{ marginTop: "0.75rem" }}>
          <Button variant="primary" disabled>
            Upload Now (mock)
          </Button>
        </div>
      ) : null}
    </>
  );

  if (embedded) return <React.Fragment>{content}</React.Fragment>;

  return (
    <React.Fragment>
      <Card>
        <Card.Header>
          <h5>{title}</h5>
        </Card.Header>
        <Card.Body>{content}</Card.Body>
      </Card>
    </React.Fragment>
  );
};

export default FormDropzone;
