import { axiosInstanceWithToken } from "../../../api/config/axiosConfig";
import type { BookingDetail, BookingNote, ExactBookingPayload } from "../types";

export const getBookingDetail = async (id: number): Promise<BookingDetail> =>
  (await axiosInstanceWithToken.get<BookingDetail>(`/bookings/${id}`)).data;

/**
 * Creates a booking. `contractId` on the payload is what links it to a
 * contract; leave it out and the booking stands alone. One route for both —
 * the API dropped the internal/commercial split, so a booking is a booking.
 */
export const createBooking = async (
  payload: ExactBookingPayload
): Promise<BookingDetail> =>
  (await axiosInstanceWithToken.post<BookingDetail>("/bookings", payload)).data;

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
