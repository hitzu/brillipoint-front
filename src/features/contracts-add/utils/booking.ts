import type { ExactBookingPayload } from "../../booking-agenda/types";
import { fromMexicoCityDateTimeInput } from "../../booking-agenda/utils/mexicoCityTime";

export interface BuildExactBookingPayloadParams {
  eventDate: string;
  startTime: string;
  endDate: string;
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
 * the agenda); `endDate` can be a later civil day than `eventDate` for an
 * event that crosses midnight (e.g. starts 23:00, ends 03:00 the next day),
 * the same overnight case the agenda handles with `endsNextDay` in
 * `useBookingForm`.
 */
export function buildExactBookingPayload({
  eventDate,
  startTime,
  endDate,
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
    serviceEndsAt: fromMexicoCityDateTimeInput(`${endDate}T${endTime}`),
    contractId,
    purpose: "event",
    title,
    ...(venueName ? { venueName } : {}),
    ...(mapsUrl ? { mapsUrl } : {}),
  };
}
