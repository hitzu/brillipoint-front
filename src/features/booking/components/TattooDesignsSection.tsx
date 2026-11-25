import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import styles from "@assets/css/contract-public.module.css";
import { PrepAssetMetadata, PrepProfilePublicResponse } from "../../../interfaces";
import {
  createPublicPrepProfileUploadUrl,
  getPublicPrepProfile,
  setPublicPrepProfileTattooDesigns,
  uploadPrepProfileFileToSignedUrl,
} from "../../../api/services/prepProfileService";
import { getTattooCatalog } from "../../../api/services/tattooCatalogService";
import { usePublicContractPhoneGate } from "../hooks/usePublicContractPhoneGate";
import {
  getTattooClosingDay,
  TATTOO_CATALOG_QUESTION_ID,
  TATTOO_CATALOG_MAX,
  TATTOO_UPLOADS_MAX,
  TATTOO_DESIGNS_QUESTION_ID,
  TattooCatalogChoice,
  TattooCatalogItem,
} from "../utils/tattooDesigns";
import {
  deriveTattooSaveStatus,
  TattooSaveOutcome,
} from "../utils/tattooSaveStatus";
import { TattooCropModal } from "./TattooCropModal";
import { TattooDesignsView } from "./TattooDesignsView";
import {
  RESERVATION_ACTIONS,
  trackReservationAction,
} from "../tracking/reservationTracker";

type Props = {
  contractToken?: string;
  phone?: string;
  /** YYYY-MM-DD of the event booking, if the reservation has one. */
  eventDate?: string | null;
};

const normalizePhone = (raw: string): string => (raw ?? "").replace(/\D/g, "");

const formatDay = (ymd: string): string => {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
};

const toDesigns = (profile: PrepProfilePublicResponse): PrepAssetMetadata[] => {
  const value = profile.answers?.[TATTOO_DESIGNS_QUESTION_ID];
  return Array.isArray(value) ? (value as PrepAssetMetadata[]) : [];
};

const toChosen = (profile: PrepProfilePublicResponse): TattooCatalogChoice[] => {
  const value = profile.answers?.[TATTOO_CATALOG_QUESTION_ID];
  return Array.isArray(value) ? (value as TattooCatalogChoice[]) : [];
};

export function TattooDesignsSection({ contractToken, phone, eventDate }: Props) {
  const [designs, setDesigns] = useState<PrepAssetMetadata[]>([]);
  const [chosen, setChosen] = useState<TattooCatalogChoice[]>([]);
  const [catalog, setCatalog] = useState<TattooCatalogItem[]>([]);
  const [locked, setLocked] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  // True only while new files travel to storage, so the client sees progress.
  const [isUploading, setIsUploading] = useState(false);
  // How the last finished save ended; the selection bar shows it.
  const [saveOutcome, setSaveOutcome] = useState<TattooSaveOutcome>("none");
  // Images the client picked, waiting to pass through the crop step.
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Same key as PreparationSection: a phone verified there is reused here.
  const storageKey = useMemo(
    () => (contractToken ? `prep-profile:phone:${contractToken}` : null),
    [contractToken],
  );

  const {
    authError,
    setAuthError,
    phoneInput,
    setPhoneInput,
    verifiedPhone,
    setVerifiedPhone,
  } = usePublicContractPhoneGate({
    storageKey,
    onReset: () => {
      setDesigns([]);
      setChosen([]);
      setLocked(false);
      setErrorMessage(null);
      setSaveOutcome("none");
      setPendingFiles(null);
    },
  });

  const applyProfile = useCallback((profile: PrepProfilePublicResponse) => {
    setDesigns(toDesigns(profile));
    setChosen(toChosen(profile));
    setLocked(profile.locked?.[TATTOO_DESIGNS_QUESTION_ID] === true);
  }, []);

  useEffect(() => {
    if (!contractToken || !verifiedPhone) return;
    let cancelled = false;
    const load = async () => {
      try {
        const profile = await getPublicPrepProfile({
          contractToken,
          phone: verifiedPhone,
        });
        if (!cancelled) applyProfile(profile);
      } catch {
        if (cancelled) return;
        // Wrong token/phone pair: force re-auth.
        if (storageKey) window.localStorage.removeItem(storageKey);
        setVerifiedPhone(null);
        setAuthError("Número incorrecto o no autorizado para este contrato.");
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [
    contractToken,
    verifiedPhone,
    storageKey,
    applyProfile,
    setVerifiedPhone,
    setAuthError,
  ]);

  // The catalog is public, but it is only shown after the phone gate. If it
  // cannot be loaded the client can still upload their own designs.
  useEffect(() => {
    if (!verifiedPhone) return;
    let cancelled = false;
    const loadCatalog = async () => {
      try {
        const items = await getTattooCatalog();
        if (!cancelled) setCatalog(items);
      } catch {
        if (!cancelled) setCatalog([]);
      }
    };
    void loadCatalog();
    return () => {
      cancelled = true;
    };
  }, [verifiedPhone]);

  const authorizePhone = async () => {
    if (!contractToken) return;
    const normalized = normalizePhone(phoneInput);
    if (!normalized) {
      setAuthError("Ingresa tu número de celular.");
      return;
    }
    try {
      setIsAuthorizing(true);
      setAuthError(null);
      const profile = await getPublicPrepProfile({
        contractToken,
        phone: normalized,
      });
      if (storageKey) window.localStorage.setItem(storageKey, normalized);
      setVerifiedPhone(normalized);
      applyProfile(profile);
    } catch {
      setVerifiedPhone(null);
      setAuthError("Número incorrecto o no autorizado para este contrato.");
    } finally {
      setIsAuthorizing(false);
    }
  };

  const saveDesigns = async (
    next: Array<{ path: string; mime: string }>,
    catalogDesignIds?: number[],
  ) => {
    const profile = await setPublicPrepProfileTattooDesigns({
      contractToken: contractToken as string,
      phone: verifiedPhone as string,
      assets: next,
      ...(catalogDesignIds === undefined ? {} : { catalogDesignIds }),
    });
    applyProfile(profile);
    setSaveOutcome("saved");
  };

  const failWith = (error: unknown) => {
    if (error instanceof AxiosError && error.response?.status === 409) {
      setLocked(true);
      setErrorMessage("Ya no se pueden modificar los diseños.");
      return;
    }
    setSaveOutcome("failed");
    setErrorMessage("No se pudieron guardar los diseños. Intenta de nuevo.");
  };

  // Validates the pick, then hands it to the crop step. Nothing is uploaded
  // until the client finishes (or skips) each image there.
  const addFiles = (files: File[]) => {
    if (!contractToken || !verifiedPhone || files.length === 0) return;
    setErrorMessage(null);
    if (files.some((f) => !f.type.startsWith("image/"))) {
      setErrorMessage("Solo puedes subir imágenes.");
      return;
    }
    if (designs.length + files.length > TATTOO_UPLOADS_MAX) {
      setErrorMessage(
        `Solo puedes subir hasta ${TATTOO_UPLOADS_MAX} fotos y diseños.`,
      );
      return;
    }
    setPendingFiles(files);
  };

  const finishCrop = (files: File[]) => {
    setPendingFiles(null);
    if (files.length > 0) void uploadFiles(files);
  };

  const uploadFiles = async (files: File[]) => {
    if (!contractToken || !verifiedPhone) return;
    setIsBusy(true);
    setIsUploading(true);
    try {
      const uploaded: Array<{ path: string; mime: string }> = [];
      for (const file of files) {
        const mime = file.type;
        const uploadInfo = await createPublicPrepProfileUploadUrl({
          contractToken,
          phone: verifiedPhone,
          payload: {
            questionId: TATTOO_DESIGNS_QUESTION_ID,
            fileName: file.name,
            mime,
          },
        });
        await uploadPrepProfileFileToSignedUrl({
          signedUrl: uploadInfo.signedUrl,
          file,
          mime,
        });
        uploaded.push({ path: uploadInfo.path, mime });
      }
      await saveDesigns([
        ...designs.map((d) => ({ path: d.path, mime: d.mime })),
        ...uploaded,
      ]);
      trackReservationAction(RESERVATION_ACTIONS.TATTOO_UPLOADED);
    } catch (error) {
      failWith(error);
    } finally {
      setIsBusy(false);
      setIsUploading(false);
    }
  };

  const toggleCatalogDesign = async (carouselId: number) => {
    setErrorMessage(null);
    const isChosen = chosen.some((c) => c.carouselId === carouselId);
    if (!isChosen && chosen.length >= TATTOO_CATALOG_MAX) {
      setErrorMessage(
        `Solo puedes elegir hasta ${TATTOO_CATALOG_MAX} diseños del catálogo.`,
      );
      return;
    }
    const nextIds = isChosen
      ? chosen.filter((c) => c.carouselId !== carouselId).map((c) => c.carouselId)
      : [...chosen.map((c) => c.carouselId), carouselId];
    setIsBusy(true);
    try {
      await saveDesigns(
        designs.map((d) => ({ path: d.path, mime: d.mime })),
        nextIds,
      );
      if (!isChosen) {
        trackReservationAction(RESERVATION_ACTIONS.TATTOO_SELECTED);
      }
    } catch (error) {
      failWith(error);
    } finally {
      setIsBusy(false);
    }
  };

  const removeDesign = async (path: string) => {
    setErrorMessage(null);
    setIsBusy(true);
    try {
      await saveDesigns(
        designs
          .filter((d) => d.path !== path)
          .map((d) => ({ path: d.path, mime: d.mime })),
      );
    } catch (error) {
      failWith(error);
    } finally {
      setIsBusy(false);
    }
  };

  if (!contractToken) {
    return (
      <section className={styles.card}>
        <p className={styles.errorText}>
          Falta el identificador público del contrato.
        </p>
      </section>
    );
  }

  if (!verifiedPhone) {
    const digits = (phone ?? "").replace(/\D/g, "");
    const maskedPhoneHint = digits
      ? `${"*".repeat(Math.max(digits.length - 4, 0))}${digits.slice(-4)}`
      : null;
    const canContinue = normalizePhone(phoneInput).length >= 10;
    return (
      <section className={styles.card} style={{ marginBottom: "1rem" }}>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <h2
            style={{
              margin: 0,
              color: "var(--bp-brown-1)",
              fontWeight: 900,
              fontSize: 18,
            }}
          >
            Confirma tu número de celular
          </h2>
          <div style={{ color: "var(--bp-brown-2)", fontSize: 13 }}>
            Esta sección está protegida. Escribe el celular que registramos
            cuando levantamos tu contrato para subir o elegir tus diseños de
            tatuajes.
          </div>
          <label
            htmlFor="tattoo-phone"
            style={{ color: "var(--bp-brown-1)", fontWeight: 800, fontSize: 14 }}
          >
            Celular del contrato (10 dígitos)
          </label>
          <input
            id="tattoo-phone"
            className="form-control"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="Ej: 2222232323"
            value={phoneInput}
            disabled={isAuthorizing}
            onChange={(e) => setPhoneInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canContinue) void authorizePhone();
            }}
          />
          {maskedPhoneHint ? (
            <div style={{ color: "var(--bp-brown-2)", fontSize: 13 }}>
              Número registrado en el contrato: {maskedPhoneHint}
            </div>
          ) : null}
          {authError ? (
            <div
              role="alert"
              style={{ color: "#b3261e", fontWeight: 800 }}
            >
              {authError}
            </div>
          ) : null}
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => void authorizePhone()}
            disabled={isAuthorizing || !canContinue}
          >
            {isAuthorizing ? "Validando..." : "Continuar"}
          </button>
          <div style={{ color: "var(--bp-brown-2)", fontSize: 13 }}>
            ¿Ya no tienes ese número? Escríbenos por WhatsApp y lo actualizamos.
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <TattooDesignsView
        designs={designs}
        locked={locked}
        closingDayLabel={eventDate ? formatDay(getTattooClosingDay(eventDate)) : null}
        isBusy={isBusy}
        isUploading={isUploading}
        saveStatus={deriveTattooSaveStatus({
          locked,
          isBusy,
          outcome: saveOutcome,
        })}
        errorMessage={errorMessage}
        catalog={catalog}
        chosen={chosen}
        onAddFiles={addFiles}
        onRemove={(path) => void removeDesign(path)}
        onToggleCatalog={(id) => void toggleCatalogDesign(id)}
      />
      {pendingFiles ? (
        <TattooCropModal files={pendingFiles} onFinish={finishCrop} />
      ) : null}
    </>
  );
}
