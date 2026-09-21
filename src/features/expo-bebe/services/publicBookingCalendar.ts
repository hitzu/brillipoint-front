import { axiosInstanceWithoutToken } from "../../../api/config/axiosConfig";
import type {
  AgendaEntry,
  ScheduleAgendaDayDto,
  YMD,
} from "../../booking-agenda/types";

/** The public calendar reduces agenda DTOs to anonymous occupancy only. */
const toPublicEntry = (
  date: YMD,
  index: number,
  entry: ScheduleAgendaDayDto["entries"][number]
): AgendaEntry => ({
  key: `public:${date}:${index}`,
  // Local display IDs prevent booking and contract IDs from reaching expo UI state.
  id: index + 1,
  bookingId: index + 1,
  contractId: null,
  sku: null,
  title: "Ocupado",
  clientName: null,
  venueName: null,
  date,
  continuesFromPreviousDay: Boolean(entry.continuesFromPreviousDay),
  continuesNextDay: Boolean(entry.continuesNextDay),
  // The calendar endpoint already clips this interval to the response day.
  startsAt:
    entry.segmentStartsAt ??
    entry.startsAt ??
    entry.approximateStartsAt ??
    null,
  endsAt:
    entry.segmentEndsAt ?? entry.endsAt ?? entry.approximateEndsAt ?? null,
  blocks: entry.blocks ?? [],
  isApproximate: Boolean(
    entry.approximateStartsAt || entry.approximateEndsAt || entry.blocks?.length
  ),
});

export const publicCalendarEntries = (
  days: ScheduleAgendaDayDto[]
): Record<YMD, AgendaEntry[]> =>
  days.reduce<Record<YMD, AgendaEntry[]>>((entries, day) => {
    entries[day.date] = (day.entries ?? []).map((entry, index) =>
      toPublicEntry(day.date, index, entry)
    );
    return entries;
  }, {});

/** GET /bookings/calendar is public and accepts a one-based calendar month. */
export const getPublicBookingCalendar = async (
  year: number,
  month: number,
  signal?: AbortSignal
): Promise<Record<YMD, AgendaEntry[]>> => {
  const response = await axiosInstanceWithoutToken.get(
    `/bookings/calendar?year=${year}&month=${month}`,
    { signal }
  );
  return publicCalendarEntries(
    Array.isArray(response.data?.days) ? response.data.days : []
  );
};
