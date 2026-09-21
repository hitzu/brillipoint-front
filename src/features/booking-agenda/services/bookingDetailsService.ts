import { axiosInstanceWithToken } from "../../../api/config/axiosConfig";
import type { BookingDetail, BookingNote, ExactBookingPayload } from "../types";

export const getBookingDetail = async (id: number): Promise<BookingDetail> =>
  (await axiosInstanceWithToken.get<BookingDetail>(`/bookings/${id}`)).data;

export const createInternalBooking = async (
  payload: ExactBookingPayload
): Promise<BookingDetail> =>
  (
    await axiosInstanceWithToken.post<BookingDetail>(
      "/bookings/internal",
      payload
    )
  ).data;

export const confirmBooking = async (
  id: number,
  {
    serviceStartsAt,
    serviceEndsAt,
  }: Pick<ExactBookingPayload, "serviceStartsAt" | "serviceEndsAt">
): Promise<BookingDetail> =>
  (
    await axiosInstanceWithToken.post<BookingDetail>(
      `/bookings/${id}/confirm`,
      { serviceStartsAt, serviceEndsAt }
    )
  ).data;

export const rescheduleBooking = async (
  id: number,
  payload: ExactBookingPayload
): Promise<BookingDetail> =>
  (
    await axiosInstanceWithToken.post<BookingDetail>(
      `/bookings/${id}/reschedule`,
      payload
    )
  ).data;

export const getBookingNotes = async (id: number): Promise<BookingNote[]> =>
  (
    await axiosInstanceWithToken.get<BookingNote[]>(
      `/notes/booking/${id}?kind=internal`
    )
  ).data;

export const createBookingNote = async (
  id: number,
  content: string
): Promise<BookingNote> =>
  (
    await axiosInstanceWithToken.post<BookingNote>("/notes", {
      content,
      kind: "internal",
      targetId: id,
      scope: "booking",
    })
  ).data;
