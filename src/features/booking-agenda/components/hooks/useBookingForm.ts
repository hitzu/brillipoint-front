import { FormEvent, useCallback, useEffect, useState } from "react";
import type {
  BookingDetail,
  ContractOption,
  ExactBookingPayload,
  YMD,
} from "../../types";
import {
  fromMexicoCityDateTimeInput,
  toMexicoCityDateTimeInput,
} from "../../utils/mexicoCityTime";
import { bookingConflictMessage } from "@shared/scheduling/bookingConflict";
import { validMapsUrl } from "@shared/scheduling/mapsUrl";
interface BookingFormState {
  eventDate: YMD;
  startsAt: string;
  endsAt: string;
  endsNextDay: boolean;
  title: string;
  purpose: string;
  venueName: string;
  mapsUrl: string;
  note: string;
}
const dateTimeParts = (value: string | null | undefined, fallback: YMD) => {
  const dateTime = toMexicoCityDateTimeInput(value, fallback);
  return { date: dateTime.slice(0, 10), time: dateTime.slice(11) };
};

const addCivilDays = (date: YMD, days: number): YMD => {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

/** A calendar-supplied create intent, prefilling a brand-new booking. */
export interface BookingFormDraft {
  date: YMD;
  startsAt: string;
  endsAt: string;
}

const createState = (
  booking: BookingDetail | null | undefined,
  initialDate: YMD,
  draft?: BookingFormDraft | null
): BookingFormState => {
  if (!booking && draft) {
    return {
      eventDate: draft.date,
      startsAt: draft.startsAt,
      // An exact-hours or block create option whose end lands at or before
      // its start (e.g. "20:00"–"04:00") represents the next civil day —
      // the same convention `endsNextDay` already encodes below.
      endsAt: draft.endsAt,
      endsNextDay: draft.endsAt <= draft.startsAt,
      title: "",
      purpose: "event",
      venueName: "",
      mapsUrl: "",
      note: "",
    };
  }

  const eventDate = booking?.eventDate ?? initialDate;
  const startsAt = dateTimeParts(booking?.serviceStartsAt, eventDate);
  const endsAt = dateTimeParts(booking?.serviceEndsAt, eventDate);
  return {
    eventDate,
    startsAt: booking ? startsAt.time : "12:00",
    endsAt: booking ? endsAt.time : "13:00",
    endsNextDay: booking ? endsAt.date > eventDate : false,
    title: booking?.title ?? "",
    purpose: booking?.purpose ?? "event",
    venueName: booking?.venueName ?? "",
    mapsUrl: booking?.mapsUrl ?? "",
    note: "",
  };
};
interface UseBookingFormArgs {
  initialDate: YMD;
  booking?: BookingDetail | null;
  /** Only applied for a brand-new booking (`booking` is null/undefined). */
  draft?: BookingFormDraft | null;
  contract?: ContractOption | null;
  onSave: (
    payload: ExactBookingPayload,
    note: string,
    contractId: number | null
  ) => Promise<void>;
}
export const useBookingForm = ({
  initialDate,
  booking,
  draft,
  contract,
  onSave,
}: UseBookingFormArgs) => {
  const [state, setState] = useState(() =>
    createState(booking, initialDate, draft)
  );
  const [contractId, setContractId] = useState<number | null>(
    contract?.id ?? null
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const update = <Key extends keyof BookingFormState>(
    key: Key,
    value: BookingFormState[Key]
  ) =>
    setState((current) => {
      const next = { ...current, [key]: value };
      if (key === "startsAt" || key === "endsAt") {
        next.endsNextDay = next.endsAt <= next.startsAt;
      }
      return next;
    });
  const applyPreset = (startsAt: string, endsAt: string, endsNextDay = false) =>
    setState((current) => ({ ...current, startsAt, endsAt, endsNextDay }));
  // Keyed on booking?.id, not the booking object: the parent replaces
  // `booking` with a new reference for the same id while a hold
  // confirmation is in flight (see useAgendaPage.saveBooking), and this
  // must not wipe the in-progress draft mid-save. Same reasoning for the
  // calendar-supplied draft: keyed on its values, not the object reference.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reset = useCallback(() => {
    setState(createState(booking, initialDate, draft));
    setContractId(contract?.id ?? null);
    setError(null);
  }, [booking?.id, contract?.id, initialDate, draft?.date, draft?.startsAt, draft?.endsAt]);
  useEffect(() => {
    reset();
  }, [reset]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (
      !state.eventDate ||
      !state.startsAt ||
      !state.endsAt ||
      !validMapsUrl(state.mapsUrl)
    ) {
      setError("Completa fecha, horarios y una URL de Maps válida.");
      return;
    }
    const payload: ExactBookingPayload = {
      scheduleType: "exact",
      eventDate: state.eventDate,
      serviceStartsAt: fromMexicoCityDateTimeInput(
        `${state.eventDate}T${state.startsAt}`
      ),
      serviceEndsAt: fromMexicoCityDateTimeInput(
        `${addCivilDays(state.eventDate, state.endsNextDay ? 1 : 0)}T${state.endsAt}`
      ),
      ...(state.title.trim() ? { title: state.title.trim() } : {}),
      ...(state.purpose ? { purpose: state.purpose } : {}),
      ...(state.venueName.trim() ? { venueName: state.venueName.trim() } : {}),
      ...(state.mapsUrl.trim() ? { mapsUrl: state.mapsUrl.trim() } : {}),
    };
    if (
      Date.parse(payload.serviceStartsAt) >= Date.parse(payload.serviceEndsAt)
    ) {
      setError("El fin debe ser posterior al inicio.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(payload, state.note.trim(), contractId);
    } catch (cause) {
      setError(
        bookingConflictMessage(cause) ??
          (cause instanceof Error
            ? cause.message
            : "No se pudo guardar el evento.")
      );
    } finally {
      setSaving(false);
    }
  };
  return {
    applyPreset,
    contractId,
    error,
    reset,
    saving,
    setContractId,
    state,
    submit,
    update,
  };
};
