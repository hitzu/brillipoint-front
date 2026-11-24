import React, { useEffect, useMemo, useRef, useState } from "react";
import { AxiosError } from "axios";
import styles from "@assets/css/contract-public.module.css";
import FormDropzone from "@shared/forms/file-upload/FormDropzone";
import {
  PREP_PROFILE_QUESTIONS,
  PrepProfileQuestionDefinition,
  stripSocialPrefix,
  getSocialIndex,
} from "./questions";
import { usePublicContractPhoneGate } from "../hooks/usePublicContractPhoneGate";
import {
  PrepAssetMetadata,
  PrepProfileAnswerPatchItem,
  PrepProfileAnswers,
} from "../../../interfaces";
import {
  getPublicPrepProfile,
  createPublicPrepProfileUploadUrl,
  patchPublicPrepProfileAnswer,
  patchPublicPrepProfileAnswers,
  uploadPrepProfileFileToSignedUrl,
} from "../../../api/services/prepProfileService";
import {
  RESERVATION_ACTIONS,
  trackReservationAction,
} from "../tracking/reservationTracker";

type Props = {
  contractToken?: string;
  phone?: string;
  mode?: "public" | "admin";
  view?: "all" | "bride" | "social";
};

const AUTO_CLEAR_TOAST_MS = 2000;
const ERROR_TOAST_MS = 5500;
const SALON_MAPS_URL = "https://maps.app.goo.gl/NAWTWWHmgCgWFd5e8";
const SALON_NAME = "Sucursal Brillipoint / Aletvia Hair & Glow";

function getPrepAtSalonChoice(
  currentAnswers: PrepProfileAnswers,
): "sucursal" | "otra_ubicacion" | "" {
  const v = currentAnswers["prep_at_salon"];
  if (v === true) return "sucursal";
  if (v === false) return "otra_ubicacion";
  if (typeof v === "string" && (v === "sucursal" || v === "otra_ubicacion"))
    return v;
  return "";
}

function isSalonPrepSelected(answers: PrepProfileAnswers): boolean {
  return getPrepAtSalonChoice(answers) === "sucursal";
}

function isExternalPrepSelected(answers: PrepProfileAnswers): boolean {
  return getPrepAtSalonChoice(answers) === "otra_ubicacion";
}

function normalizePrepAtSalonForCompare(v: unknown): string {
  if (v === true || v === "sucursal") return "sucursal";
  if (v === false || v === "otra_ubicacion") return "otra_ubicacion";
  return "";
}

function prepValuesEqualForBaseline(
  questionId: string,
  value: PrepProfileAnswers[string],
  baseline: PrepProfileAnswers,
): boolean {
  if (questionId === "prep_at_salon") {
    return (
      normalizePrepAtSalonForCompare(value) ===
      normalizePrepAtSalonForCompare(baseline[questionId])
    );
  }
  const b = baseline[questionId];
  const valueEmpty =
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "");
  const baselineEmpty =
    b === undefined ||
    b === null ||
    (typeof b === "string" && b.trim() === "");
  if (valueEmpty && baselineEmpty) return true;
  if (typeof value === "string" && typeof b === "string") {
    return value.trim() === b.trim();
  }
  if (value === b) return true;
  try {
    return JSON.stringify(value) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function getPrepPatchValidationError(
  q: PrepProfileQuestionDefinition,
  value: PrepProfileAnswerPatchItem["value"],
  answers: PrepProfileAnswers,
): string | null {
  if (q.id === "prep_location_maps_url") {
    if (isSalonPrepSelected(answers)) return null;
    if (typeof value !== "string" || value.trim() === "") {
      return "Indica el enlace de Google Maps.";
    }
    return null;
  }
  if (q.type === "string" || q.type === "textarea") {
    if (typeof value !== "string" || value.trim() === "") {
      return "Este campo es obligatorio.";
    }
    return null;
  }
  if (q.type === "date") {
    if (typeof value !== "string" || value.trim() === "") {
      return "Selecciona una fecha.";
    }
    return null;
  }
  if (q.type === "time") {
    if (typeof value !== "string" || value.trim() === "") {
      return "Indica una hora.";
    }
    const t = value.trim();
    if (!/^\d{2}:\d{2}$/.test(t)) {
      return "Usa formato de 24 horas (ej. 17:00).";
    }
    return null;
  }
  return null;
}

function messageFromAxiosError(error: unknown): string | null {
  if (!(error instanceof AxiosError)) return null;
  const data = error.response?.data;
  if (data == null || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const msg = o.message;
  if (typeof msg === "string" && msg.trim()) return msg;
  if (
    Array.isArray(msg) &&
    msg.every((x) => typeof x === "string") &&
    msg.length
  ) {
    return msg.join(" ");
  }
  if (typeof o.error === "string" && o.error.trim()) return o.error;
  if (typeof o.detail === "string" && o.detail.trim()) return o.detail;
  const errors = o.errors;
  if (Array.isArray(errors)) {
    const parts = errors
      .map((e) => {
        if (typeof e === "string") return e;
        if (e && typeof e === "object") {
          const row = e as Record<string, unknown>;
          if (typeof row.message === "string") return row.message;
        }
        return null;
      })
      .filter(Boolean) as string[];
    if (parts.length) return parts.join(" ");
  }
  return null;
}

type ToastState = { message: string; variant: "success" | "error" };

export function PreparationSection({
  contractToken,
  phone,
  mode = "public",
  view = "all",
}: Props) {
  const QUESTIONS = PREP_PROFILE_QUESTIONS;

  const maskPhoneHint = (raw?: string): string | null => {
    const digits = (raw ?? "").toString().replace(/\D/g, "");
    if (!digits) return null;
    if (digits.length <= 4) return digits;
    return `${"*".repeat(digits.length - 4)}${digits.slice(-4)}`;
  };

  const maskedPhoneHint = useMemo(() => {
    return maskPhoneHint(phone);
  }, [phone]);

  const [answers, setAnswers] = useState<PrepProfileAnswers>({});
  // Keep a mutable pointer to the latest answers so async callbacks (e.g. uploads)
  // don't close over a stale render-time snapshot.
  const answersRef = useRef<PrepProfileAnswers>({});
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  const [locked, setLocked] = useState<Record<string, boolean>>({});
  const [pendingChanges, setPendingChanges] = useState<
    PrepProfileAnswerPatchItem[]
  >([]);
  const [activeTab, setActiveTab] = useState<"bride" | "social">("bride");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [uploadingByQuestionId, setUploadingByQuestionId] = useState<
    Record<string, boolean>
  >({});
  const [openAccessoryUploaderByKey, setOpenAccessoryUploaderByKey] = useState<
    Record<string, boolean>
  >({});

  const toastTimeoutRef = useRef<number | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isSocialQuestionId = (questionId: string): boolean => {
    return /^social-n-\d+-/.test(questionId);
  };

  const lastSyncedAnswersRef = useRef<PrepProfileAnswers>({});

  const GROUP_META: Record<
    string,
    { step: string; title: string; subtitle: string }
  > = {
    celebracion: {
      step: "Paso 1",
      title: "Sobre tu boda",
      subtitle: "Contexto del gran día",
    },
    concepto: {
      step: "Paso 2",
      title: "Concepto y mood",
      subtitle: "La vibra que quieres proyectar",
    },
    look_nupcial: {
      step: "Paso 3",
      title: "Tu look nupcial (Vestido y accesorios)",
      subtitle: "La base y los detalles que completan tu look",
    },
    maquillaje: {
      step: "Paso 4",
      title: "Tu maquillaje de novia",
      subtitle: "Preferencias, no negociables y fotos",
    },
    peinado: {
      step: "Paso 5",
      title: "Tu peinado de novia",
      subtitle: "Preferencias, no negociables y fotos",
    },
  };

  const ASSET_ARRAY_SLOTS: Record<string, { label: string }[]> = {
    face_photos: [
      { label: "Rostro despejado" },
      { label: "Cabello a los lados" },
    ],
    hair_photos: [{ label: "Espalda" }, { label: "Perfil" }],
    makeup_references: [{ label: "Referencia 1" }, { label: "Referencia 2" }],
    hair_references: [{ label: "Referencia 1" }, { label: "Referencia 2" }],
    gift_makeup_references: [
      { label: "Referencia 1" },
      { label: "Referencia 2" },
    ],
    gift_hair_photo: [{ label: "Espalda" }, { label: "Perfil" }],
    gift_hair_references: [
      { label: "Referencia 1" },
      { label: "Referencia 2" },
    ],
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const brideQuestions = useMemo(() => {
    return QUESTIONS.filter((q) => !isSocialQuestionId(q.id));
  }, [QUESTIONS]);

  const socialQuestionsByIndex = useMemo(() => {
    const by = new Map<number, PrepProfileQuestionDefinition[]>();
    for (const q of QUESTIONS) {
      if (!isSocialQuestionId(q.id)) continue;
      const n = getSocialIndex(q.id) ?? 1;
      const list = by.get(n) ?? [];
      list.push(q);
      by.set(n, list);
    }
    return Array.from(by.entries()).sort((a, b) => a[0] - b[0]);
  }, [QUESTIONS]);

  const questionsInView = useMemo(() => {
    if (view === "bride") return brideQuestions;
    if (view === "social")
      return socialQuestionsByIndex.flatMap(([, qs]) => qs);
    // view === "all"
    return QUESTIONS;
  }, [QUESTIONS, brideQuestions, socialQuestionsByIndex, view]);

  const isAssetArrayComplete = (
    questionId: string,
    value: PrepProfileAnswers[string] | undefined,
  ): boolean => {
    const baseId = stripSocialPrefix(questionId);
    const slots = ASSET_ARRAY_SLOTS[baseId];
    if (!slots?.length) return false;
    const arr = (value as PrepAssetMetadata[] | undefined) ?? [];
    return slots.every((_, idx) => Boolean(arr[idx]?.path));
  };

  const isSavedForQuestion = (q: PrepProfileQuestionDefinition): boolean => {
    const v = answers[q.id];

    // Special case: si acepta venir a sucursal, no pedimos la ubicación externa.
    // Consideramos "guardada" esta pregunta cuando el backend ya guardó/lockeó `prep_at_salon`.
    if (q.id === "prep_location_maps_url" && isSalonPrepSelected(answers)) {
      return Boolean(locked["prep_at_salon"]);
    }

    if (q.id === "prep_location_maps_url") {
      const str = typeof v === "string" ? v.trim() : "";
      return Boolean(locked[q.id]) && str.length > 0;
    }

    if (q.type === "asset_array") {
      return isAssetArrayComplete(q.id, v);
    }

    if (q.type === "asset") {
      const a = v as PrepAssetMetadata | undefined;
      return Boolean(a?.path);
    }

    if (
      q.type === "string" ||
      q.type === "textarea" ||
      q.type === "date" ||
      q.type === "time"
    ) {
      const str = typeof v === "string" ? v.trim() : "";
      return Boolean(locked[q.id]) && str.length > 0;
    }

    return Boolean(locked[q.id]);
  };

  const isComplete = useMemo(() => {
    return questionsInView.every((q) => isSavedForQuestion(q));
  }, [questionsInView, answers, locked]);

  const showToast = (
    message: string,
    variant: ToastState["variant"] = "success",
  ) => {
    setToast({ message, variant });
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    const ms = variant === "error" ? ERROR_TOAST_MS : AUTO_CLEAR_TOAST_MS;
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), ms);
  };

  const storageKey = useMemo(() => {
    if (!contractToken) return null;
    return `prep-profile:phone:${contractToken}`;
  }, [contractToken]);

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
      lastSyncedAnswersRef.current = {};
      setAnswers({});
      setLocked({});
      setPendingChanges([]);
      setFieldErrors({});
      setActiveTab(view === "social" ? "social" : "bride");
    },
  });

  const canUsePublicApi = Boolean(contractToken && verifiedPhone);
  const isUploadingAny = useMemo(() => {
    return Object.values(uploadingByQuestionId).some(Boolean);
  }, [uploadingByQuestionId]);

  const getAssetDisplayUrl = (
    asset: PrepAssetMetadata | undefined,
  ): string | null => {
    if (!asset) return null;
    return asset.url ?? null;
  };

  const isImageMime = (mime: string | undefined): boolean => {
    return typeof mime === "string" && mime.toLowerCase().startsWith("image/");
  };

  const refreshProfile = async () => {
    if (!canUsePublicApi) return;
    const profile = await getPublicPrepProfile({
      contractToken: contractToken as string,
      phone: verifiedPhone as string,
    });
    const nextAnswers = profile.answers ?? {};
    lastSyncedAnswersRef.current = nextAnswers;
    setAnswers(nextAnswers);
    setLocked(profile.locked ?? {});
    setPendingChanges([]);
  };

  useEffect(() => {
    const load = async () => {
      if (!canUsePublicApi) return;
      try {
        setIsLoading(true);
        await refreshProfile();
        setAuthError(null);
      } catch (_e: unknown) {
        // If the phone/token combination is wrong, force re-auth.
        if (typeof window !== "undefined" && storageKey) {
          window.localStorage.removeItem(storageKey);
        }
        setVerifiedPhone(null);
        setAuthError(
          "No pudimos validar tu número. Verifica e intenta de nuevo.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [canUsePublicApi, contractToken, storageKey, verifiedPhone]);

  const normalizePhone = (raw: string): string => {
    return (raw ?? "").replace(/\D/g, "");
  };

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

      if (typeof window !== "undefined" && storageKey) {
        window.localStorage.setItem(storageKey, normalized);
      }

      setVerifiedPhone(normalized);
      const nextAnswers = profile.answers ?? {};
      lastSyncedAnswersRef.current = nextAnswers;
      setAnswers(nextAnswers);
      setLocked(profile.locked ?? {});
      setPendingChanges([]);
    } catch (_e: unknown) {
      setVerifiedPhone(null);
      setAuthError("Número incorrecto o no autorizado para este contrato.");
    } finally {
      setIsAuthorizing(false);
    }
  };

  const upsertPendingChange = (
    questionId: string,
    value: PrepProfileAnswerPatchItem["value"],
  ) => {
    setPendingChanges((prev) => {
      if (
        prepValuesEqualForBaseline(
          questionId,
          value as PrepProfileAnswers[string],
          lastSyncedAnswersRef.current,
        )
      ) {
        return prev.filter((c) => c.questionId !== questionId);
      }
      const idx = prev.findIndex((c) => c.questionId === questionId);
      if (idx === -1) return [...prev, { questionId, value }];
      const next = prev.slice();
      next[idx] = { questionId, value };
      return next;
    });
  };

  const onChangeAnswer = (
    questionId: string,
    value: PrepProfileAnswers[string],
  ) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setFieldErrors((prev) => {
      if (!prev[questionId]) return prev;
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
    upsertPendingChange(questionId, value);
  };

  const saveChanges = async () => {
    if (pendingChanges.length === 0) return;
    try {
      setIsSaving(true);
      if (!canUsePublicApi) {
        showToast("Falta el token o el teléfono para guardar.", "error");
        return;
      }

      const validationErrors: Record<string, string> = {};
      for (const c of pendingChanges) {
        const q = QUESTIONS.find((item) => item.id === c.questionId);
        if (!q) continue;
        const err = getPrepPatchValidationError(q, c.value, answers);
        if (err) validationErrors[c.questionId] = err;
      }
      if (Object.keys(validationErrors).length > 0) {
        setFieldErrors(validationErrors);
        showToast("Revisa los campos marcados.", "error");
        const firstId =
          pendingChanges.find((c) => validationErrors[c.questionId])
            ?.questionId ?? Object.keys(validationErrors)[0];
        if (firstId && typeof window !== "undefined") {
          window.requestAnimationFrame(() => {
            cardRefs.current[firstId]?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          });
        }
        return;
      }
      setFieldErrors({});

      await patchPublicPrepProfileAnswers({
        contractToken: contractToken as string,
        phone: verifiedPhone as string,
        answers: pendingChanges,
      });
      trackReservationAction(RESERVATION_ACTIONS.PREP_ANSWERED);

      // Optimista: si el backend bloquea al guardar, reflejamos eso de inmediato.
      setLocked((prev) => {
        const next = { ...prev };
        for (const c of pendingChanges) next[c.questionId] = true;
        return next;
      });
      setPendingChanges([]);
      showToast("Guardado", "success");

      // Fuente de verdad: recargamos el perfil para traer valores/locks reales.
      try {
        await refreshProfile();
      } catch (_e: unknown) {
        // Si falla el refresh, nos quedamos con el estado optimista.
      }
    } catch (e: unknown) {
      const serverMsg = messageFromAxiosError(e);
      showToast(serverMsg ?? "No se pudo guardar.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const setUploading = (questionId: string, value: boolean) => {
    setUploadingByQuestionId((prev) => ({ ...prev, [questionId]: value }));
  };

  const uploadAndPatchAnswer = async (params: {
    questionId: string;
    files: File[];
    computeNextValue: (
      uploaded: PrepAssetMetadata[],
    ) => PrepProfileAnswers[string];
  }) => {
    if (!canUsePublicApi) {
      showToast("Falta el token o el teléfono para subir archivos.", "error");
      return;
    }

    const qid = params.questionId;
    setUploading(qid, true);
    try {
      const uploaded: PrepAssetMetadata[] = [];

      for (const f of params.files) {
        const mime = f.type || "application/octet-stream";
        const uploadInfo = await createPublicPrepProfileUploadUrl({
          contractToken: contractToken as string,
          phone: verifiedPhone as string,
          payload: {
            questionId: qid,
            fileName: f.name,
            mime,
          },
        });

        await uploadPrepProfileFileToSignedUrl({
          signedUrl: uploadInfo.signedUrl,
          file: f,
          mime,
        });

        uploaded.push({
          path: uploadInfo.path,
          mime,
          url: uploadInfo.publicUrl,
        });
      }

      const nextValue = params.computeNextValue(uploaded);

      // Optimista para UI.
      setAnswers((prev) => ({ ...prev, [qid]: nextValue }));

      await patchPublicPrepProfileAnswer({
        contractToken: contractToken as string,
        phone: verifiedPhone as string,
        payload: {
          questionId: qid,
          value: nextValue,
        },
      });

      // Optimista: asumimos lock tras guardar.
      setLocked((prev) => ({ ...prev, [qid]: true }));
      lastSyncedAnswersRef.current = {
        ...lastSyncedAnswersRef.current,
        [qid]: nextValue,
      };

      showToast("Archivo(s) subido(s)");
    } catch (_e: unknown) {
      showToast("No se pudo subir el archivo.", "error");
    } finally {
      setUploading(qid, false);
    }
  };

  const renderInput = (q: PrepProfileQuestionDefinition, disabled: boolean) => {
    const value = answers[q.id];
    const placeholder = q.placeholder ?? "";
    const hasHelperText = Boolean(q.placeholder);
    const placeholderForInput = hasHelperText ? "" : placeholder;

    if (q.type === "string") {
      return (
        <input
          className="form-control"
          type="text"
          value={typeof value === "string" ? value : ""}
          placeholder={placeholderForInput}
          disabled={disabled}
          onChange={(e) => onChangeAnswer(q.id, e.target.value)}
        />
      );
    }

    if (q.type === "textarea") {
      return (
        <textarea
          className="form-control"
          rows={4}
          value={typeof value === "string" ? value : ""}
          placeholder={placeholderForInput}
          disabled={disabled}
          onChange={(e) => onChangeAnswer(q.id, e.target.value)}
        />
      );
    }

    if (q.type === "date") {
      return (
        <input
          className="form-control"
          type="date"
          value={typeof value === "string" ? value : ""}
          disabled={disabled}
          onChange={(e) => onChangeAnswer(q.id, e.target.value)}
        />
      );
    }

    if (q.type === "time") {
      return (
        <input
          className="form-control"
          type="time"
          step={60}
          value={typeof value === "string" ? value : ""}
          disabled={disabled}
          onChange={(e) => onChangeAnswer(q.id, e.target.value)}
        />
      );
    }

    if (q.type === "radio") {
      if (q.id === "prep_at_salon") {
        const choice = getPrepAtSalonChoice(answers);
        const disabledAll = disabled;

        const option = (opt: {
          value: "sucursal" | "otra_ubicacion";
          title: string;
          description: string;
        }) => {
          const id = `prep-q-${q.id}-${opt.value}`;
          return (
            <div
              key={opt.value}
              style={{
                padding: "0.65rem 0.75rem",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <div className="form-check" style={{ marginBottom: 0 }}>
                <input
                  className="form-check-input"
                  type="radio"
                  name={`prep-q-${q.id}`}
                  id={id}
                  disabled={disabledAll}
                  checked={choice === opt.value}
                  onChange={() => onChangeAnswer(q.id, opt.value)}
                />
                <label
                  className="form-check-label text-white"
                  htmlFor={id}
                  style={{ fontWeight: 900 }}
                >
                  {opt.title}
                </label>
              </div>
              <div
                style={{
                  marginTop: 6,
                  color: "rgba(255,255,255,0.72)",
                  fontSize: 13,
                  lineHeight: 1.45,
                }}
              >
                {opt.description}
              </div>
            </div>
          );
        };

        return (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {option({
              value: "sucursal",
              title: "En nuestra sucursal (opción recomendada)",
              description:
                "Recomendamos realizar el arreglo en sucursal para garantizar tiempos, comodidad y el mejor resultado. Contamos con iluminación adecuada, espacio para acompañantes y yo personalmente te ayudo a cambiarte y a colocar tu ajuar con todo el cuidado que merece tu gran día",
            })}
            {option({
              value: "otra_ubicacion",
              title: "En otra ubicación (hotel / domicilio / venue)",
              description:
                "Podemos trasladarnos al lugar donde te encuentres el día del evento.",
            })}

            {choice === "sucursal" ? (
              <div style={{ display: "grid", gap: "0.4rem" }}>
                <div
                  style={{
                    color: "rgba(255,255,255,0.92)",
                    fontWeight: 900,
                  }}
                >
                  {SALON_NAME}
                </div>
                <a
                  href={SALON_MAPS_URL}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: "rgba(255,255,255,0.92)",
                    fontWeight: 800,
                    textDecoration: "underline",
                    width: "fit-content",
                  }}
                >
                  Ver ubicación en Google Maps
                </a>
              </div>
            ) : null}

            {choice === "otra_ubicacion" ? (
              <div
                style={{
                  color: "rgba(255,255,255,0.72)",
                  fontSize: 13,
                  lineHeight: 1.45,
                }}
              >
                Por favor compártenos tu ubicación exacta (link de Google Maps)
                en la siguiente pregunta.
              </div>
            ) : null}
          </div>
        );
      }

      const current = typeof value === "string" ? value : "";
      const options = q.options ?? [];
      return (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {options.map((opt) => {
            const id = `prep-q-${q.id}-${opt.value}`;
            return (
              <div className="form-check" key={opt.value}>
                <input
                  className="form-check-input"
                  type="radio"
                  name={`prep-q-${q.id}`}
                  id={id}
                  disabled={disabled}
                  checked={current === opt.value}
                  onChange={() => onChangeAnswer(q.id, opt.value)}
                />
                <label className="form-check-label text-white" htmlFor={id}>
                  {opt.label}
                </label>
              </div>
            );
          })}
        </div>
      );
    }

    if (q.type === "boolean") {
      if (q.id === "prep_at_salon") {
        const checked = Boolean(value);
        return (
          <div style={{ display: "grid", gap: "0.6rem" }}>
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(e) => onChangeAnswer(q.id, e.target.checked)}
                id={`prep-q-${q.id}`}
              />
              <label
                className="form-check-label text-white"
                htmlFor={`prep-q-${q.id}`}
                style={{ fontWeight: 800 }}
              >
                {q.label ?? "Aceptar"}
              </label>
            </div>

            <a
              href={SALON_MAPS_URL}
              target="_blank"
              rel="noreferrer"
              style={{
                color: "rgba(255,255,255,0.92)",
                fontWeight: 800,
                textDecoration: "underline",
                width: "fit-content",
              }}
            >
              Ver ubicación de la sucursal en Google Maps
            </a>
          </div>
        );
      }
      return (
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            checked={Boolean(value)}
            disabled={disabled}
            onChange={(e) => onChangeAnswer(q.id, e.target.checked)}
            id={`prep-q-${q.id}`}
          />
          <label
            className="form-check-label text-white"
            htmlFor={`prep-q-${q.id}`}
          >
            Sí
          </label>
        </div>
      );
    }

    if (q.type === "asset") {
      const current = value as PrepAssetMetadata | undefined;
      const isUploading = Boolean(uploadingByQuestionId[q.id]);
      const url = getAssetDisplayUrl(current);
      const hasExisting = Boolean(current?.path);
      const showUploader = !hasExisting;
      return (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {showUploader ? (
            <FormDropzone
              embedded
              showPreviews={false}
              multiple={false}
              disabled={disabled || isUploading}
              description={
                hasHelperText ? "Toca para seleccionar" : "Selecciona una foto"
              }
              onFilesSelected={(files) => {
                const f = files[0];
                if (!f) return;
                void uploadAndPatchAnswer({
                  questionId: q.id,
                  files: [f],
                  computeNextValue: (uploaded) =>
                    uploaded[0] as PrepAssetMetadata,
                });
              }}
            />
          ) : null}

          {hasExisting ? (
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {url && isImageMime(current?.mime) ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "inline-block" }}
                  title="Abrir imagen"
                >
                  <img
                    src={url}
                    alt={q.label ?? q.id}
                    style={{
                      width: "100%",
                      maxWidth: 520,
                      borderRadius: 16,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.04)",
                      display: "block",
                    }}
                  />
                </a>
              ) : (
                <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 13 }}>
                  Archivo:{" "}
                  <span
                    style={{ color: "rgba(255,255,255,0.92)", fontWeight: 900 }}
                  >
                    {current?.path}
                  </span>
                </div>
              )}
            </div>
          ) : null}
          {isUploading ? (
            <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 13 }}>
              Subiendo...
            </div>
          ) : null}
        </div>
      );
    }

    if (q.type === "asset_array") {
      const current = (value as PrepAssetMetadata[] | undefined) ?? [];
      const isUploading = Boolean(uploadingByQuestionId[q.id]);
      const baseId = stripSocialPrefix(q.id);
      const slots = ASSET_ARRAY_SLOTS[baseId];

      const upsertAtIndex = (
        arr: PrepAssetMetadata[],
        idx: number,
        it: PrepAssetMetadata,
      ) => {
        const next = arr.slice();
        next[idx] = it;
        return next;
      };

      if (slots?.length) {
        return (
          <div style={{ display: "grid", gap: "0.85rem" }}>
            {slots.map((slot, idx) => {
              const asset = current[idx];
              const url = getAssetDisplayUrl(asset);
              const hasExisting = Boolean(asset?.path);
              const canPreview = Boolean(url && isImageMime(asset?.mime));
              const showUploader = !hasExisting;

              return (
                <div
                  key={`${q.id}-slot-${idx}`}
                  style={{
                    display: "grid",
                    gap: "0.55rem",
                    padding: "0.65rem",
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  <div
                    style={{ color: "rgba(255,255,255,0.86)", fontWeight: 900 }}
                  >
                    {slot.label}
                  </div>

                  {showUploader ? (
                    <FormDropzone
                      embedded
                      showPreviews={false}
                      multiple={false}
                      disabled={disabled || isUploading}
                      description={
                        hasHelperText
                          ? "Toca para seleccionar"
                          : "Selecciona una foto"
                      }
                      onFilesSelected={(files) => {
                        const f = files[0];
                        if (!f) return;
                        void uploadAndPatchAnswer({
                          questionId: q.id,
                          files: [f],
                          computeNextValue: (uploaded) => {
                            const prev =
                              (answersRef.current[q.id] as
                                | PrepAssetMetadata[]
                                | undefined) ?? [];
                            const next = upsertAtIndex(
                              prev,
                              idx,
                              uploaded[0] as PrepAssetMetadata,
                            );
                            return next;
                          },
                        });
                      }}
                    />
                  ) : null}

                  {hasExisting ? (
                    <div style={{ display: "grid", gap: "0.5rem" }}>
                      {canPreview ? (
                        <a
                          href={url as string}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: "inline-block" }}
                          title="Abrir imagen"
                        >
                          <img
                            src={url as string}
                            alt={`${q.label ?? q.id} - ${slot.label}`}
                            style={{
                              width: "100%",
                              maxWidth: 520,
                              borderRadius: 16,
                              border: "1px solid rgba(255,255,255,0.12)",
                              background: "rgba(255,255,255,0.04)",
                              display: "block",
                            }}
                          />
                        </a>
                      ) : (
                        <div
                          style={{
                            color: "rgba(255,255,255,0.72)",
                            fontSize: 13,
                          }}
                        >
                          Archivo:{" "}
                          <span
                            style={{
                              color: "rgba(255,255,255,0.92)",
                              fontWeight: 900,
                            }}
                          >
                            {asset?.path}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}

            {isUploading ? (
              <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 13 }}>
                Subiendo...
              </div>
            ) : null}
          </div>
        );
      }

      // Fallback genérico: array sin slots definidos (1 foto por carga, no multicarga).
      return (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <FormDropzone
            embedded
            showPreviews={false}
            multiple={false}
            disabled={disabled || isUploading}
            description={
              hasHelperText ? "Toca para seleccionar" : "Selecciona una foto"
            }
            onFilesSelected={(files) => {
              const f = files[0];
              if (!f) return;
              void uploadAndPatchAnswer({
                questionId: q.id,
                files: [f],
                computeNextValue: (uploaded) => {
                  const prev =
                    (answersRef.current[q.id] as
                      | PrepAssetMetadata[]
                      | undefined) ?? [];
                  const merged = [
                    ...prev,
                    ...(uploaded as PrepAssetMetadata[]),
                  ];
                  const dedup = new Map<string, PrepAssetMetadata>();
                  for (const it of merged) dedup.set(it.path, it);
                  return Array.from(dedup.values());
                },
              });
            }}
          />

          {current.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "0.5rem",
                maxWidth: 720,
              }}
            >
              {current.slice(0, 9).map((it, idx) => {
                const url = getAssetDisplayUrl(it);
                const canPreview = Boolean(url && isImageMime(it.mime));
                return (
                  <a
                    key={`${it.path}-${idx}`}
                    href={url ?? "#"}
                    target={url ? "_blank" : undefined}
                    rel={url ? "noreferrer" : undefined}
                    onClick={(e) => {
                      if (!url) e.preventDefault();
                    }}
                    title={it.path}
                    style={{ display: "block" }}
                  >
                    {canPreview ? (
                      <img
                        src={url as string}
                        alt={`Foto ${idx + 1}`}
                        style={{
                          width: "100%",
                          aspectRatio: "1 / 1",
                          objectFit: "cover",
                          borderRadius: 14,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(255,255,255,0.04)",
                          display: "block",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          borderRadius: 14,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(255,255,255,0.05)",
                          padding: "0.55rem 0.65rem",
                          color: "rgba(255,255,255,0.8)",
                          fontSize: 12,
                          fontWeight: 800,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {it.path}
                      </div>
                    )}
                  </a>
                );
              })}
            </div>
          ) : null}

          {isUploading ? (
            <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 13 }}>
              Subiendo...
            </div>
          ) : null}
        </div>
      );
    }

    if (q.type === "object") {
      if (q.id === "dress") {
        const obj =
          (value as {
            noDress?: boolean;
            photo?: PrepAssetMetadata;
            note?: string;
          }) ?? {};
        const isUploading = Boolean(uploadingByQuestionId[q.id]);
        const existingUrl = getAssetDisplayUrl(obj.photo);
        const hasExisting = Boolean(obj.photo?.path);
        const showUploader = !hasExisting;

        return (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                disabled={disabled}
                checked={Boolean(obj.noDress)}
                onChange={(e) =>
                  onChangeAnswer(q.id, {
                    ...obj,
                    noDress: e.target.checked,
                    ...(e.target.checked ? { photo: undefined } : null),
                  })
                }
                id={`prep-dress-${q.id}-hasDress`}
              />
              <label
                className="form-check-label text-white"
                htmlFor={`prep-dress-${q.id}-hasDress`}
              >
                Aún no tengo vestido
              </label>
            </div>

            {obj.noDress ? (
              <div style={{ display: "grid", gap: "0.6rem" }}>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Cuéntanos tu idea (silueta, escote, tela o estilo)"
                  disabled={disabled}
                  value={typeof obj.note === "string" ? obj.note : ""}
                  onChange={(e) =>
                    onChangeAnswer(q.id, { ...obj, note: e.target.value })
                  }
                />
              </div>
            ) : (
              <div style={{ display: "grid", gap: "0.6rem" }}>
                {showUploader ? (
                  <FormDropzone
                    embedded
                    showPreviews={false}
                    multiple={false}
                    disabled={disabled || isUploading}
                    description="Sube una foto del vestido"
                    onFilesSelected={(files) => {
                      const f = files[0];
                      if (!f) return;
                      void uploadAndPatchAnswer({
                        questionId: q.id,
                        files: [f],
                        computeNextValue: (uploaded) => ({
                          ...obj,
                          photo: uploaded[0] as PrepAssetMetadata,
                        }),
                      });
                    }}
                  />
                ) : null}

                {hasExisting && existingUrl && isImageMime(obj.photo?.mime) ? (
                  <a
                    href={existingUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: "inline-block" }}
                    title="Abrir imagen"
                  >
                    <img
                      src={existingUrl}
                      alt="Foto del vestido"
                      style={{
                        width: "100%",
                        maxWidth: 520,
                        borderRadius: 16,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.04)",
                        display: "block",
                      }}
                    />
                  </a>
                ) : null}

                {isUploading ? (
                  <div
                    style={{ color: "rgba(255,255,255,0.72)", fontSize: 13 }}
                  >
                    Subiendo...
                  </div>
                ) : null}
              </div>
            )}
          </div>
        );
      }

      if (q.id === "accessories") {
        const obj =
          (value as {
            // Legacy: antes existían checks tipo `hasBouquet`, `hasJewelry`, etc.
            // Ya no se usan, pero podrían venir del backend.
            hasBouquet?: boolean;
            hasJewelry?: boolean;
            hasHeadpiece?: boolean;
            hasVeil?: boolean;
            bouquetPhoto?: PrepAssetMetadata | PrepAssetMetadata[];
            jewelryPhoto?: PrepAssetMetadata | PrepAssetMetadata[];
            headpiecePhoto?: PrepAssetMetadata | PrepAssetMetadata[];
            veilPhoto?: PrepAssetMetadata | PrepAssetMetadata[];
          }) ?? {};

        const isUploading = Boolean(uploadingByQuestionId[q.id]);

        const toAssetArray = (v: unknown): PrepAssetMetadata[] => {
          if (!v) return [];
          return Array.isArray(v)
            ? (v as PrepAssetMetadata[])
            : [v as PrepAssetMetadata];
        };

        const accessoryBlock = (params: {
          title: string;
          note?: string;
          photoKey:
            | "bouquetPhoto"
            | "jewelryPhoto"
            | "headpiecePhoto"
            | "veilPhoto";
          uploadLabel: string;
        }) => {
          const photos = toAssetArray(obj[params.photoKey]);
          const primary = photos[photos.length - 1];
          const primaryUrl = primary ? getAssetDisplayUrl(primary) : null;
          const hasPhoto = Boolean(primary?.path);
          const uploaderKey = params.photoKey;
          const isReplaceOpen = Boolean(
            openAccessoryUploaderByKey[uploaderKey],
          );
          const showUploader = !hasPhoto || isReplaceOpen;

          return (
            <div style={{ display: "grid", gap: "0.6rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                }}
              >
                <div className="text-white" style={{ fontWeight: 800 }}>
                  {params.title}
                </div>

                {hasPhoto && !disabled ? (
                  <button
                    type="button"
                    className="btn btn-link p-0"
                    style={{
                      color: "rgba(255,255,255,0.86)",
                      fontWeight: 800,
                      textDecoration: "none",
                    }}
                    disabled={disabled || isUploading}
                    onClick={() =>
                      setOpenAccessoryUploaderByKey((prev) => ({
                        ...prev,
                        [uploaderKey]: !isReplaceOpen,
                      }))
                    }
                  >
                    {isReplaceOpen ? "Cancelar" : "Reemplazar"}
                  </button>
                ) : null}
              </div>

              {params.note ? (
                <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 13 }}>
                  {params.note}
                </div>
              ) : null}

              {showUploader ? (
                <FormDropzone
                  embedded
                  showPreviews={false}
                  multiple={false}
                  disabled={disabled || isUploading}
                  description={
                    hasPhoto
                      ? `${params.uploadLabel} (reemplazar)`
                      : params.uploadLabel
                  }
                  onFilesSelected={(files) => {
                    const f = files[0];
                    if (!f) return;

                    // Cerramos el uploader inmediatamente para evitar que se siga viendo
                    // el texto "Arrastra tu archivo aquí" cuando ya hay imagen.
                    setOpenAccessoryUploaderByKey((prev) => ({
                      ...prev,
                      [uploaderKey]: false,
                    }));

                    void uploadAndPatchAnswer({
                      questionId: q.id,
                      files: [f],
                      computeNextValue: (uploaded) =>
                        ({
                          ...obj,
                          // Siempre 1 foto por accesorio (si venía un array legacy, se reemplaza).
                          [params.photoKey]: uploaded[0] as PrepAssetMetadata,
                        }) as PrepProfileAnswers[string],
                    });
                  }}
                />
              ) : null}

              {photos.length ? (
                <div style={{ display: "grid", gap: "0.5rem" }}>
                  {primaryUrl && isImageMime(primary?.mime) ? (
                    <a
                      href={primaryUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: "inline-block" }}
                      title="Abrir imagen"
                    >
                      <img
                        src={primaryUrl}
                        alt={params.title}
                        style={{
                          width: "100%",
                          maxWidth: 520,
                          borderRadius: 16,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(255,255,255,0.04)",
                          display: "block",
                        }}
                      />
                    </a>
                  ) : (
                    <div
                      style={{ color: "rgba(255,255,255,0.72)", fontSize: 13 }}
                    >
                      Archivo:{" "}
                      <span
                        style={{
                          color: "rgba(255,255,255,0.92)",
                          fontWeight: 900,
                        }}
                      >
                        {primary?.path ?? photos[0]?.path}
                      </span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          );
        };

        return (
          <div style={{ display: "grid", gap: "1rem" }}>
            {accessoryBlock({
              title: "Ramo",
              photoKey: "bouquetPhoto",
              uploadLabel: "Sube una foto del ramo",
            })}
            {accessoryBlock({
              title: "Joyería",
              note: "Aretes, collares, pulseras, etc.",
              photoKey: "jewelryPhoto",
              uploadLabel: "Sube una foto de la joyería",
            })}
            {accessoryBlock({
              title: "Tocado",
              photoKey: "headpiecePhoto",
              uploadLabel: "Sube una foto del tocado",
            })}
            {accessoryBlock({
              title: "Velo",
              photoKey: "veilPhoto",
              uploadLabel: "Sube una foto del velo",
            })}
            {isUploading ? (
              <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 13 }}>
                Subiendo...
              </div>
            ) : null}
          </div>
        );
      }

      // Fallback (si se agrega un objeto nuevo en el futuro)
      const obj = (value as { note?: string }) ?? {};
      return (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <input
            className="form-control"
            type="text"
            placeholder={hasHelperText ? "" : "Notas (opcional)"}
            disabled={disabled}
            value={typeof obj.note === "string" ? obj.note : ""}
            onChange={(e) =>
              onChangeAnswer(q.id, { ...obj, note: e.target.value })
            }
          />
        </div>
      );
    }

    return null;
  };

  const renderQuestionList = (
    list: ReadonlyArray<PrepProfileQuestionDefinition>,
    opts?: { showGroupSeparators?: boolean },
  ): React.ReactNode[] => {
    let lastGroup: string | null = null;
    const showGroupSeparators = opts?.showGroupSeparators ?? true;

    return list.flatMap((q) => {
      const nodes: React.ReactNode[] = [];

      // Solo pedimos la ubicación externa si eligió "otra ubicación".
      if (
        q.id === "prep_location_maps_url" &&
        !isExternalPrepSelected(answers)
      ) {
        return nodes;
      }
      const group = q.group;

      if (showGroupSeparators && group && group !== lastGroup) {
        lastGroup = group;
        const meta = GROUP_META[group] ?? {
          step: "Sección",
          title: group,
          subtitle: "",
        };
        nodes.push(
          <section
            key={`group-${group}-${q.id}`}
            className={styles.groupSeparatorCard}
          >
            <div className={styles.groupSeparatorRow}>
              <div style={{ minWidth: 0 }}>
                <div className={styles.groupKicker}>{meta.step}</div>
                <div className={styles.groupTitle}>{meta.title}</div>
                {meta.subtitle ? (
                  <div className={styles.groupSubtitle}>{meta.subtitle}</div>
                ) : null}
              </div>
            </div>
          </section>,
        );
      }

      const isSaved = isSavedForQuestion(q);
      // Accesorios: permitir seguir subiendo/ajustando fotos aun si ya aparece como "Guardado".
      // Para fotos con máximo (asset_array con slots), se marca "Guardado" solo cuando
      // se completan todas las fotos requeridas.
      const isDisabled = mode !== "admin" && q.id !== "accessories" && isSaved;
      const badgeClass = isSaved ? styles.badgeSuccess : styles.badgeId;
      const badgeText = isSaved ? "Guardado" : "Pendiente";

      nodes.push(
        <div
          key={q.id}
          ref={(el) => {
            cardRefs.current[q.id] = el;
          }}
          style={{ scrollMarginTop: 110 }}
        >
          <section className={styles.card}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "0.75rem",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>
                  {q.label ?? q.id}
                </h2>
                {q.placeholder ? (
                  <div
                    style={{
                      marginTop: 6,
                      color: "rgba(255,255,255,0.72)",
                      fontSize: 13,
                      lineHeight: 1.45,
                    }}
                  >
                    {q.placeholder}
                  </div>
                ) : null}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  flexShrink: 0,
                }}
              >
                <span className={[styles.badge, badgeClass].join(" ")}>
                  {badgeText}
                </span>
              </div>
            </div>

            <div className={styles.sectionBody}>
              {renderInput(q, isDisabled)}
              {fieldErrors[q.id] ? (
                <div
                  style={{
                    marginTop: "0.5rem",
                    color: "rgba(248, 113, 113, 0.96)",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {fieldErrors[q.id]}
                </div>
              ) : null}
            </div>
          </section>
        </div>,
      );

      return nodes;
    });
  };

  return (
    <div className={styles.contentMax} style={{ paddingBottom: 120 }}>
      {!contractToken ? (
        <section className={`${styles.card} ${styles.errorCard}`}>
          <div className={styles.errorTitle}>
            No pudimos cargar la preparación
          </div>
          <p className={styles.errorText}>
            Falta el identificador público del contrato.
          </p>
        </section>
      ) : (
        <>
          {!verifiedPhone ? (
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
                  Para acceder a tu ficha de preparación, necesitamos validar tu
                  número.
                </div>

                <input
                  className="form-control"
                  type="tel"
                  inputMode="numeric"
                  placeholder="Ej: 2222232323"
                  value={phoneInput}
                  disabled={isAuthorizing}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void authorizePhone();
                  }}
                />

                {maskedPhoneHint ? (
                  <div
                    style={{ color: "rgba(255,255,255,0.72)", fontSize: 13 }}
                  >
                    Número registrado en el contrato: {maskedPhoneHint}
                  </div>
                ) : null}

                {authError ? (
                  <div
                    style={{
                      color: "rgba(248, 113, 113, 0.95)",
                      fontWeight: 800,
                    }}
                  >
                    {authError}
                  </div>
                ) : null}

                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={authorizePhone}
                  disabled={isAuthorizing}
                  style={{
                    opacity: isAuthorizing ? 0.55 : 1,
                    cursor: isAuthorizing ? "not-allowed" : "pointer",
                  }}
                >
                  {isAuthorizing ? "Validando..." : "Continuar"}
                </button>
              </div>
            </section>
          ) : null}

          {toast ? (
            <div style={{ marginBottom: "0.85rem" }}>
              <div
                className={styles.badge}
                style={{
                  width: "fit-content",
                  background:
                    toast.variant === "error"
                      ? "rgba(248, 113, 113, 0.14)"
                      : "rgba(16, 185, 129, 0.14)",
                  borderColor:
                    toast.variant === "error"
                      ? "rgba(248, 113, 113, 0.35)"
                      : "rgba(16, 185, 129, 0.3)",
                  color:
                    toast.variant === "error"
                      ? "rgba(254, 226, 226, 0.96)"
                      : "rgba(209, 250, 229, 0.95)",
                  fontWeight: 900,
                }}
              >
                {toast.message}
              </div>
            </div>
          ) : null}

          {verifiedPhone ? (
            <>
              {isLoading ? (
                <section
                  className={styles.card}
                  style={{ marginBottom: "1rem" }}
                >
                  <div
                    style={{ color: "rgba(255,255,255,0.86)", fontWeight: 900 }}
                  >
                    Cargando ficha de preparación...
                  </div>
                </section>
              ) : null}

              {isComplete ? (
                <section
                  className={styles.card}
                  style={{ marginBottom: "1rem" }}
                >
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    <div
                      style={{
                        color: "rgba(255,255,255,0.96)",
                        fontWeight: 900,
                        fontSize: 16,
                      }}
                    >
                      ¡Listo! Tu ficha quedó completada.
                    </div>
                    <div
                      style={{ color: "rgba(255,255,255,0.72)", fontSize: 13 }}
                    >
                      Si necesitas hacer algún ajuste, contáctanos y con gusto
                      te ayudamos.
                    </div>
                  </div>
                </section>
              ) : null}

              {view === "all" ? (
                <div
                  style={{
                    display: "flex",
                    gap: "0.65rem",
                    flexWrap: "wrap",
                    marginBottom: "0.9rem",
                  }}
                >
                  <button
                    type="button"
                    className={
                      activeTab === "bride"
                        ? styles.btnPrimary
                        : styles.btnSecondary
                    }
                    onClick={() => setActiveTab("bride")}
                  >
                    Preparación novia
                  </button>
                  <button
                    type="button"
                    className={
                      activeTab === "social"
                        ? styles.btnPrimary
                        : styles.btnSecondary
                    }
                    onClick={() => setActiveTab("social")}
                    disabled={socialQuestionsByIndex.length === 0}
                    style={{
                      opacity: socialQuestionsByIndex.length === 0 ? 0.55 : 1,
                      cursor:
                        socialQuestionsByIndex.length === 0
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    Preparación social
                  </button>
                </div>
              ) : null}

              {view === "bride" || (view === "all" && activeTab === "bride") ? (
                <div style={{ display: "grid", gap: "0.9rem" }}>
                  {renderQuestionList(brideQuestions)}
                </div>
              ) : null}

              {view === "social" ||
              (view === "all" && activeTab === "social") ? (
                <div style={{ display: "grid", gap: "0.9rem" }}>
                  {socialQuestionsByIndex.length === 0 ? (
                    <section className={styles.card}>
                      <div
                        style={{
                          color: "rgba(255,255,255,0.86)",
                          fontWeight: 900,
                        }}
                      >
                        No hay formularios sociales disponibles.
                      </div>
                    </section>
                  ) : (
                    socialQuestionsByIndex.map(([n, qs]) => (
                      <div
                        key={`social-${n}`}
                        style={{ display: "grid", gap: "0.9rem" }}
                      >
                        <section
                          className={styles.card}
                          style={{ padding: "0.9rem 1rem" }}
                        >
                          <h2
                            className={styles.sectionTitle}
                            style={{ marginBottom: 0 }}
                          >
                            Preparación social #{n}
                          </h2>
                        </section>
                        {renderQuestionList(qs, { showGroupSeparators: false })}
                      </div>
                    ))
                  )}
                </div>
              ) : null}

              {pendingChanges.length > 0 || isSaving ? (
                <div className={styles.ctaSticky}>
                  <div className={styles.ctaSurface}>
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      onClick={saveChanges}
                      disabled={
                        pendingChanges.length === 0 ||
                        isSaving ||
                        isLoading ||
                        isUploadingAny
                      }
                      style={{
                        opacity:
                          pendingChanges.length === 0 ||
                          isSaving ||
                          isLoading ||
                          isUploadingAny
                            ? 0.55
                            : 1,
                        cursor:
                          pendingChanges.length === 0 ||
                          isSaving ||
                          isLoading ||
                          isUploadingAny
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {isSaving
                        ? "Guardando..."
                        : isLoading
                          ? "Cargando..."
                          : isUploadingAny
                            ? "Subiendo..."
                            : `Guardar (${pendingChanges.length})`}
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
