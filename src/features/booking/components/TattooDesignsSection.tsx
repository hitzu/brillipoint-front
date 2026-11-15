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
import { usePublicContractPhoneGate } from "../hooks/usePublicContractPhoneGate";
import {
  getTattooClosingDay,
  TATTOO_DESIGNS_MAX,
  TATTOO_DESIGNS_QUESTION_ID,
} from "../utils/tattooDesigns";
import { TattooDesignsView } from "./TattooDesignsView";

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

export function TattooDesignsSection({ contractToken, phone, eventDate }: Props) {
  const [designs, setDesigns] = useState<PrepAssetMetadata[]>([]);
  const [locked, setLocked] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
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
      setLocked(false);
      setErrorMessage(null);
    },
  });

  const applyProfile = useCallback((profile: PrepProfilePublicResponse) => {
    setDesigns(toDesigns(profile));
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

  const saveDesigns = async (next: Array<{ path: string; mime: string }>) => {
    const profile = await setPublicPrepProfileTattooDesigns({
      contractToken: contractToken as string,
      phone: verifiedPhone as string,
      assets: next,
    });
    applyProfile(profile);
  };

  const failWith = (error: unknown) => {
    if (error instanceof AxiosError && error.response?.status === 409) {
      setLocked(true);
      setErrorMessage("Ya no se pueden modificar los diseños.");
      return;
    }
    setErrorMessage("No se pudieron guardar los diseños. Intenta de nuevo.");
  };

  const addFiles = async (files: File[]) => {
    if (!contractToken || !verifiedPhone || files.length === 0) return;
    setErrorMessage(null);
    if (files.some((f) => !f.type.startsWith("image/"))) {
      setErrorMessage("Solo puedes subir imágenes.");
      return;
    }
    if (designs.length + files.length > TATTOO_DESIGNS_MAX) {
      setErrorMessage(`Solo puedes tener hasta ${TATTOO_DESIGNS_MAX} diseños.`);
      return;
    }
    setIsBusy(true);
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
    return (
      <section className={styles.card} style={{ marginBottom: "1rem" }}>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <div
            style={{
              color: "rgba(255,255,255,0.96)",
              fontWeight: 900,
              fontSize: 16,
            }}
          >
            Confirma tu número de celular
          </div>
          <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 13 }}>
            Para subir tus diseños de tatuajes, necesitamos validar tu número.
          </div>
          <input
            className="form-control"
            type="tel"
            inputMode="numeric"
            placeholder="Ej: 2222232323"
            aria-label="Número de celular"
            value={phoneInput}
            disabled={isAuthorizing}
            onChange={(e) => setPhoneInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void authorizePhone();
            }}
          />
          {maskedPhoneHint ? (
            <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 13 }}>
              Número registrado en el contrato: {maskedPhoneHint}
            </div>
          ) : null}
          {authError ? (
            <div
              role="alert"
              style={{ color: "rgba(248, 113, 113, 0.95)", fontWeight: 800 }}
            >
              {authError}
            </div>
          ) : null}
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => void authorizePhone()}
            disabled={isAuthorizing}
          >
            {isAuthorizing ? "Validando..." : "Continuar"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <TattooDesignsView
      designs={designs}
      locked={locked}
      closingDayLabel={eventDate ? formatDay(getTattooClosingDay(eventDate)) : null}
      isBusy={isBusy}
      errorMessage={errorMessage}
      onAddFiles={(files) => void addFiles(files)}
      onRemove={(path) => void removeDesign(path)}
    />
  );
}
