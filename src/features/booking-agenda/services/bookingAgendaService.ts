import { axiosInstanceWithToken } from "../../../api/config/axiosConfig";
import type { ScheduleAgendaDayDto, YMD } from "../types";

/** GET /bookings/agenda accepts an inclusive [from,to] calendar-day range. */
export const getAgendaRange = async (
  from: YMD,
  to: YMD,
  signal?: AbortSignal
): Promise<ScheduleAgendaDayDto[]> => {
  const response = await axiosInstanceWithToken.get(
    `/bookings/agenda?from=${from}&to=${to}`,
    { signal }
  );
  return Array.isArray(response.data?.days) ? response.data.days : [];
};
