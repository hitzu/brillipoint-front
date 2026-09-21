import {
  CalendarSlotsByMonthPayload,
  CalendarSlotsByMonthResponse,
  GetSlotResponse,
  Slot,
} from "../../interfaces";
import type { ExpoBebeBrandKey } from "../../features/expo-bebe/types";

import {
  axiosInstanceWithoutToken,
  axiosInstanceWithToken,
} from "../config/axiosConfig";

export const getSlots = async (
  date: string,
  brand?: ExpoBebeBrandKey
): Promise<GetSlotResponse[]> => {
  try {
    const queryParams = new URLSearchParams();

    queryParams.append("date", date);
    if (brand) queryParams.append("brand", brand);

    const url = `/slots?${queryParams.toString()}`;
    const response = await axiosInstanceWithToken.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching slots:", error);
    throw error;
  }
};

export const holdSlot = async (payload: {
  eventDate: string;
  period: string;
  leadName?: string;
  leadEmail?: string | null;
  leadPhone?: string | null;
}): Promise<Slot> => {
  try {
    const response = await axiosInstanceWithToken.post(`/slots/hold`, payload);
    return response.data;
  } catch (error) {
    console.error("Error holding slot:", error);
    throw error;
  }
};

export const cancelHoldSlot = async (slotId: number) => {
  try {
    const response = await axiosInstanceWithToken.delete(`/slots/${slotId}`);
    return response.data;
  } catch (error) {
    console.error("Error canceling hold slot:", error);
    throw error;
  }
};

export const getSlotById = async (slotId: number): Promise<Slot> => {
  try {
    const response = await axiosInstanceWithToken.get(`/slots/${slotId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching slot by id:", error);
    throw error;
  }
};

export const updateLeadInfo = async (
  slotId: number,
  payload: {
    leadName?: string;
    leadEmail?: string;
    leadPhone?: string;
  }
) => {
  try {
    const response = await axiosInstanceWithToken.patch(
      `/slots/${slotId}/lead-info`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error updating lead info:", error);
    throw error;
  }
};

export const getSlotsByMonthAndYear = async (
  month: number,
  year: number,
  brandId?: number
): Promise<CalendarSlotsByMonthPayload> => {
  try {
    const queryParams = new URLSearchParams({
      year: String(year),
      month: String(month),
    });
    if (brandId) queryParams.append("brandId", String(brandId));

    const response = await axiosInstanceWithoutToken.get(
      `/slots/calendar?${queryParams.toString()}`
    );
    const data = response.data;

    if (Array.isArray(data)) {
      return {
        risk: false,
        days: data as CalendarSlotsByMonthResponse[],
      };
    }

    return {
      risk: Boolean(data?.risk),
      days: Array.isArray(data?.days)
        ? (data.days as CalendarSlotsByMonthResponse[])
        : [],
    };
  } catch (error) {
    console.error("Error fetching slots by month and year:", error);
    throw error;
  }
};
