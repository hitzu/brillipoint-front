import type {
  AgendaEntry,
  ScheduleAgendaDayDto,
  ScheduleAgendaEntryDto,
  YMD,
} from "../types";
import { entryDates } from "./agendaIntervals";

const normalizeEntry = (
  dto: ScheduleAgendaEntryDto,
  date: YMD
): AgendaEntry => {
  const preciseStart =
    dto.serviceStartsAt ?? dto.startsAt ?? dto.approximateStartsAt ?? null;
  const preciseEnd =
    dto.serviceEndsAt ?? dto.endsAt ?? dto.approximateEndsAt ?? null;
  const startsAt = dto.approximateStartsAt ?? preciseStart;
  const endsAt = dto.approximateEndsAt ?? preciseEnd;
  return {
    key: `agenda:${dto.id}`,
    id: dto.id,
    bookingId: dto.id,
    contractId: dto.contractId ?? null,
    sku: dto.sku ?? null,
    title: dto.title ?? null,
    clientName: dto.clientName ?? null,
    venueName: dto.venueName ?? null,
    date: dto.eventDate ?? date,
    continuesFromPreviousDay: Boolean(dto.continuesFromPreviousDay),
    continuesNextDay: Boolean(dto.continuesNextDay),
    startsAt,
    endsAt,
    blocks: dto.blocks ?? [],
    isApproximate: Boolean(
      dto.approximateStartsAt || dto.approximateEndsAt || dto.blocks?.length
    ),
  };
};

/** Keep every API event and project overnight/block continuations to every visible day. */
export const normalizeAgendaDays = (
  days: ScheduleAgendaDayDto[]
): Record<YMD, AgendaEntry[]> => {
  const result: Record<YMD, AgendaEntry[]> = {};

  for (const day of days) {
    result[day.date] ??= [];
    for (const dto of day.entries) {
      const entry = normalizeEntry(dto, day.date);
      for (const date of entryDates(entry)) {
        result[date] ??= [];
        if (!result[date].some((candidate) => candidate.key === entry.key))
          result[date].push(entry);
      }
    }
  }

  return result;
};
