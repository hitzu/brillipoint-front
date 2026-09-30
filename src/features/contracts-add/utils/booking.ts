import type { ExactBookingPayload } from "../../booking-agenda/types";
import { fromMexicoCityDateTimeInput } from "../../booking-agenda/utils/mexicoCityTime";
import { isNextDayEnd } from "../../booking-agenda/utils/timeOptions";

export interface BuildExactBookingPayloadParams {
  eventDate: string;
  startTime: string;
  endTime: string;
  contractId: number;
  title: string;
  venueName?: string;
  mapsUrl?: string;
}

/**
 * Builds the exact-time booking payload for a contract created outside the
 * expo flow. Reuses `fromMexicoCityDateTimeInput` — the same builder
 * `useBookingForm` uses — so the datetime format never drifts between the
 * two flows. `eventDate` stays the start date (it anchors the booking on
 * the agenda); an end time at or before the start time is placed on the next
 * civil day, following the same `endsNextDay` convention as Agenda.
 */
export function buildExactBookingPayload({
  eventDate,
  startTime,
  endTime,
  contractId,
  title,
  venueName,
  mapsUrl,
}: BuildExactBookingPayloadParams): ExactBookingPayload {
  return {
    scheduleType: "exact",
    eventDate,
    serviceStartsAt: fromMexicoCityDateTimeInput(`${eventDate}T${startTime}`),
    serviceEndsAt: fromMexicoCityDateTimeInput(
      `${addCivilDays(eventDate, isNextDayEnd(startTime, endTime) ? 1 : 0)}T${endTime}`,
    ),
    contractId,
    purpose: "event",
    title,
    ...(venueName ? { venueName } : {}),
    ...(mapsUrl ? { mapsUrl } : {}),
  };
}

const addCivilDays = (date: string, days: number): string => {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};
