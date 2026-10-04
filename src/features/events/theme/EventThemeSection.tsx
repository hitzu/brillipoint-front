import React, { useEffect, useState } from "react";
import { Button, Card, Toast } from "react-bootstrap";
import { getEventById, updateEventById } from "../../../api/services/eventsService";
import {
  createThemeAssetUploadUrl,
  uploadThemeAssetBlobToSignedUrl,
} from "../../../api/services/themeAssetsService";
import { ThemeAssetMime } from "../../../interfaces";
import { ThemeOverrides } from "../../party/types/themeContract";
import { ConfettiShape } from "../../party/theme/confettiShapes";
import {
  applyImportedThemeOverrides,
  RawThemeOverrides,
  removeBackgroundImage,
  removeSplashIconImage,
  setBackgroundImage,
  setConfettiShapes,
  setSplashIconImage,
  setSplashIconPlate,
} from "./mergeThemeOverrides";
import { getReadOnlyThemeEntries } from "./readOnlyThemeEntries";
import { parseThemeOverridesJson } from "./parseThemeOverridesJson";
import { hasBrandContent } from "./hasBrandContent";
import { storedSocialCtaFrom, useSocialCtaEditor } from "./hooks/useSocialCtaEditor";
import EventBrandSection from "./components/EventBrandSection";
import ThemeBackgroundBlock from "./components/ThemeBackgroundBlock";
import ThemeConfettiBlock from "./components/ThemeConfettiBlock";
import ThemeJsonImportBlock from "./components/ThemeJsonImportBlock";
import ThemeReadOnlyBlock from "./components/ThemeReadOnlyBlock";
import ThemeSplashIconBlock from "./components/ThemeSplashIconBlock";
import ThemeSocialCtaBlock from "./components/ThemeSocialCtaBlock";
import ThemeSocialCtaPreview from "./components/ThemeSocialCtaPreview";

interface EventThemeSectionProps {
  eventId: number;
  initialThemeOverrides?: ThemeOverrides | null;
  /** Public event token, used to fetch the resolved theme for inherited values. */
  token?: string;
  /** Interpolated as `{{honoreesName}}` in the social CTA preview. */
  honoreesNames?: string | null;
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const plateFrom = (themeOverrides: RawThemeOverrides | null | undefined): string | null => {
  const plate = (themeOverrides as any)?.images?.splashIcon?.plate;
  return typeof plate === "string" && HEX_COLOR.test(plate) ? plate : null;
};

const shapesFrom = (themeOverrides: RawThemeOverrides | null | undefined): string[] => {
  const confetti = (themeOverrides as any)?.decorations?.confetti;
  return Array.isArray(confetti?.shapes) ? confetti.shapes : [];
};

/**
 * Own "Guardar tema" flow, independent from the main event form: uploads a
 * new background and/or splash icon (if picked), re-fetches the event to avoid clobbering
 * concurrent edits, deep-merges the change, then PATCHes the full
 * `themeOverrides` object (the backend replaces it wholesale).
 */
const EventThemeSection = ({
  eventId,
  initialThemeOverrides,
  token,
  honoreesNames,
}: EventThemeSectionProps) => {
  const initialRawThemeOverrides = initialThemeOverrides as RawThemeOverrides | null | undefined;
  const [themeOverrides, setThemeOverrides] = useState<RawThemeOverrides | null | undefined>(
    initialRawThemeOverrides,
  );
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [backgroundPreviewUrl, setBackgroundPreviewUrl] = useState<string | null>(null);
  const [backgroundRemoved, setBackgroundRemoved] = useState(false);
  const [splashFile, setSplashFile] = useState<File | null>(null);
  const [splashPreviewUrl, setSplashPreviewUrl] = useState<string | null>(null);
  const [splashRemoved, setSplashRemoved] = useState(false);
  const [splashPlate, setSplashPlate] = useState<string | null>(plateFrom(initialRawThemeOverrides));
  const [plateDirty, setPlateDirty] = useState(false);
  const [selectedShapes, setSelectedShapes] = useState<string[]>(
    shapesFrom(initialRawThemeOverrides),
  );
  // Confetti is only written when staff touched it, so a background-only save
  // never overrides confetti inherited from the preset or default theme.
  const [confettiDirty, setConfettiDirty] = useState(false);
  // Same rule for socialCta: written only when edited (dirty) or removed (cleared).
  const socialCta = useSocialCtaEditor({
    eventId,
    token,
    initialThemeOverrides: initialRawThemeOverrides,
  });
  // Blocks pasted through "Importar JSON", written over the refetched overrides on save.
  const [importedOverrides, setImportedOverrides] = useState<RawThemeOverrides | null>(null);
  const [saving, setSaving] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState<"success" | "danger">("success");

  useEffect(() => {
    setThemeOverrides(initialThemeOverrides as RawThemeOverrides | null | undefined);
    setSelectedShapes(shapesFrom(initialThemeOverrides as RawThemeOverrides | null | undefined));
    setBackgroundFile(null);
    setBackgroundRemoved(false);
    setBackgroundPreviewUrl(null);
    setSplashFile(null);
    setSplashRemoved(false);
    setSplashPreviewUrl(null);
    setSplashPlate(plateFrom(initialThemeOverrides as RawThemeOverrides | null | undefined));
    setPlateDirty(false);
    setConfettiDirty(false);
    setImportedOverrides(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const currentBackgroundUrl = backgroundFile
    ? backgroundPreviewUrl
    : backgroundRemoved
      ? null
      : ((themeOverrides as any)?.images?.background?.url ?? null);

  const currentSplashUrl = splashFile
    ? splashPreviewUrl
    : splashRemoved
      ? null
      : ((themeOverrides as any)?.images?.splashIcon?.url ?? null);

  const handleFileSelected = (file: File) => {
    if (backgroundPreviewUrl) URL.revokeObjectURL(backgroundPreviewUrl);
    setBackgroundFile(file);
    setBackgroundRemoved(false);
    setBackgroundPreviewUrl(URL.createObjectURL(file));
  };

  const handleInvalidMime = () => {
    setToastMessage("Formato de imagen no permitido. Usa PNG, JPEG o WEBP.");
    setToastVariant("danger");
    setShowToast(true);
  };

  const handleRemoveBackground = () => {
    if (backgroundPreviewUrl) URL.revokeObjectURL(backgroundPreviewUrl);
    setBackgroundFile(null);
    setBackgroundPreviewUrl(null);
    setBackgroundRemoved(true);
  };

  const handleSplashFileSelected = (file: File) => {
    if (splashPreviewUrl) URL.revokeObjectURL(splashPreviewUrl);
    setSplashFile(file);
    setSplashRemoved(false);
    setSplashPreviewUrl(URL.createObjectURL(file));
  };

  const handleInvalidSplashMime = () => {
    setToastMessage("Formato de imagen no permitido. Usa PNG, JPEG, WEBP o SVG.");
    setToastVariant("danger");
    setShowToast(true);
  };

  const handleRemoveSplash = () => {
    if (splashPreviewUrl) URL.revokeObjectURL(splashPreviewUrl);
    setSplashFile(null);
    setSplashPreviewUrl(null);
    setSplashRemoved(true);
    // The plate cannot exist without an image.
    setSplashPlate(null);
    setPlateDirty(false);
  };

  const handlePlateChange = (plate: string | null) => {
    setSplashPlate(plate);
    setPlateDirty(true);
  };

  const handleToggleShape = (shape: ConfettiShape) => {
    setConfettiDirty(true);
    setSelectedShapes((prev) =>
      prev.includes(shape) ? prev.filter((s) => s !== shape) : [...prev, shape],
    );
  };

  /**
   * Loads a pasted `themeOverrides` into the editor for preview (never saves).
   * Images are kept as they are; each editor whose block was imported is
   * re-synced so the import, not a previous unsaved edit, is what gets saved.
   */
  const handleImportJson = (text: string): string | null => {
    const result = parseThemeOverridesJson(text);
    if (!result.ok) return result.error;
    const imported = result.overrides;

    const nextView = applyImportedThemeOverrides(themeOverrides, imported);
    setThemeOverrides(nextView);
    setImportedOverrides((prev) => applyImportedThemeOverrides(prev, imported));

    if ("decorations" in imported) {
      setSelectedShapes(shapesFrom(nextView));
      setConfettiDirty(false);
    }
    const importedPlate = plateFrom(imported);
    if (importedPlate) {
      setSplashPlate(importedPlate);
      setPlateDirty(true);
    }
    socialCta.loadImported(imported);
    return null;
  };

  const handleSave = async () => {
    if (socialCta.invalid) return;
    setSaving(true);
    try {
      let uploadedSlot: { path: string; url: string } | undefined;

      if (backgroundFile) {
        const uploadUrl = await createThemeAssetUploadUrl({
          ownerType: "event",
          ownerId: eventId,
          slot: "background",
          fileName: backgroundFile.name,
          mime: backgroundFile.type as ThemeAssetMime,
        });
        await uploadThemeAssetBlobToSignedUrl({
          signedUrl: uploadUrl.signedUrl,
          blob: backgroundFile,
          mime: backgroundFile.type,
        });
        uploadedSlot = { path: uploadUrl.path, url: uploadUrl.publicUrl };
      }

      let uploadedSplash: { path: string; url: string } | undefined;

      if (splashFile) {
        const uploadUrl = await createThemeAssetUploadUrl({
          ownerType: "event",
          ownerId: eventId,
          slot: "splashIcon",
          fileName: splashFile.name,
          mime: splashFile.type as ThemeAssetMime,
        });
        await uploadThemeAssetBlobToSignedUrl({
          signedUrl: uploadUrl.signedUrl,
          blob: splashFile,
          mime: splashFile.type,
        });
        uploadedSplash = { path: uploadUrl.path, url: uploadUrl.publicUrl };
      }

      const fresh = await getEventById(eventId);
      let merged: RawThemeOverrides = (fresh.themeOverrides as RawThemeOverrides) ?? {};

      if (importedOverrides) {
        merged = applyImportedThemeOverrides(merged, importedOverrides);
      }

      if (uploadedSlot) {
        merged = setBackgroundImage(merged, uploadedSlot);
      } else if (backgroundRemoved) {
        merged = removeBackgroundImage(merged);
      }

      if (uploadedSplash) {
        merged = setSplashIconImage(merged, {
          ...uploadedSplash,
          plate: splashPlate ?? undefined,
        });
      } else if (splashRemoved) {
        merged = removeSplashIconImage(merged);
      } else if (plateDirty) {
        merged = setSplashIconPlate(merged, splashPlate);
      }

      if (confettiDirty) {
        merged = setConfettiShapes(merged, selectedShapes);
      }

      merged = socialCta.applyTo(merged);

      await updateEventById(eventId, { themeOverrides: merged as ThemeOverrides });

      if (backgroundPreviewUrl) URL.revokeObjectURL(backgroundPreviewUrl);
      setThemeOverrides(merged);
      setSelectedShapes(shapesFrom(merged));
      setBackgroundFile(null);
      setBackgroundPreviewUrl(null);
      setBackgroundRemoved(false);
      if (splashPreviewUrl) URL.revokeObjectURL(splashPreviewUrl);
      setSplashFile(null);
      setSplashPreviewUrl(null);
      setSplashRemoved(false);
      setSplashPlate(plateFrom(merged));
      setPlateDirty(false);
      setConfettiDirty(false);
      setImportedOverrides(null);
      socialCta.resetAfterSave(merged);
      setToastMessage("Tema actualizado exitosamente");
      setToastVariant("success");
      setShowToast(true);
    } catch (error: any) {
      console.error("Error updating event theme:", error);
      const msg =
        error?.response?.data?.message || "Error al actualizar el tema del evento";
      setToastMessage(msg);
      setToastVariant("danger");
      setShowToast(true);
    } finally {
      setSaving(false);
    }
  };

  const readOnlyEntries = getReadOnlyThemeEntries(themeOverrides);

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 9999,
        }}
      >
        <Toast
          onClose={() => setShowToast(false)}
          show={showToast}
          delay={4000}
          autohide
          bg={toastVariant}
        >
          <Toast.Header>
            <strong className="me-auto">
              {toastVariant === "success" ? "Exito" : "Error"}
            </strong>
          </Toast.Header>
          <Toast.Body className="text-white">{toastMessage}</Toast.Body>
        </Toast>
      </div>

      <Card className="mt-3">
        <Card.Header>
          <h5 className="mb-0">Tema del evento</h5>
          <small className="text-muted d-block mt-1">
            Elementos propios de cada evento: fondo de bienvenida y confeti.
          </small>
        </Card.Header>
        <Card.Body>
          <ThemeBackgroundBlock
            previewUrl={currentBackgroundUrl}
            onFileSelected={handleFileSelected}
            onInvalidMime={handleInvalidMime}
            onRemove={handleRemoveBackground}
            removeDisabled={!currentBackgroundUrl}
          />

          <ThemeConfettiBlock selectedShapes={selectedShapes} onToggleShape={handleToggleShape} />
        </Card.Body>
      </Card>

      <EventBrandSection key={eventId} defaultOpen={hasBrandContent(initialRawThemeOverrides)}>
        <ThemeJsonImportBlock onApply={handleImportJson} />

        <ThemeSplashIconBlock
          previewUrl={currentSplashUrl}
          onFileSelected={handleSplashFileSelected}
          onInvalidMime={handleInvalidSplashMime}
          onRemove={handleRemoveSplash}
          removeDisabled={!currentSplashUrl}
          plate={splashPlate}
          onPlateChange={handlePlateChange}
        />

        <ThemeSocialCtaBlock
          form={socialCta.form}
          errors={socialCta.errors}
          locale={socialCta.locale}
          onLocaleChange={socialCta.setLocale}
          onChange={socialCta.onChange}
          inherited={socialCta.inherited}
          cleared={socialCta.cleared}
          canUseInherited={Boolean(storedSocialCtaFrom(themeOverrides))}
          onUseInherited={socialCta.onUseInherited}
          preview={
            <ThemeSocialCtaPreview
              form={socialCta.form}
              locale={socialCta.locale}
              honoreesNames={honoreesNames}
              eventTheme={socialCta.eventTheme}
            />
          }
        />

        {readOnlyEntries.length > 0 && (
          <div className="mb-3">
            <h6 className="text-muted">Otros valores del tema (solo lectura)</h6>
            {readOnlyEntries.map((entry) => (
              <ThemeReadOnlyBlock key={entry.key} entry={entry} />
            ))}
          </div>
        )}

      </EventBrandSection>

      <Button
        type="button"
        variant="primary"
        className="mt-3"
        onClick={handleSave}
        disabled={saving || socialCta.invalid}
      >
        {saving ? "Guardando..." : "Guardar tema"}
      </Button>
    </>
  );
};

export default EventThemeSection;
