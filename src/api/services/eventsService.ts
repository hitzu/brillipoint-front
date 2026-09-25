import {
  EventV2,
  CreateEventPayload,
  UpdateEventPayload,
} from "../../interfaces";
import { axiosInstanceWithToken } from "../config/axiosConfig";

export const getEvents = async (): Promise<EventV2[]> => {
  try {
    const response = await axiosInstanceWithToken.get(`/v2/events`);
    return response.data;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
};

export const createEvent = async (
  payload: CreateEventPayload
): Promise<EventV2> => {
  try {
    const response = await axiosInstanceWithToken.post<EventV2>(
      "/events",
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};

export const getEventById = async (id: number): Promise<EventV2> => {
  try {
    const response = await axiosInstanceWithToken.get<EventV2>(`/v2/events/id/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching event by id:", error);
    throw error;
  }
};

export const updateEventById = async (
  id: number,
  payload: UpdateEventPayload
): Promise<void> => {
  try {
    await axiosInstanceWithToken.patch(`/events/${id}`, payload);
  } catch (error) {
    console.error("Error updating event by id:", error);
    throw error;
  }
};

export const deleteEventById = async (id: number): Promise<void> => {
  try {
    await axiosInstanceWithToken.delete(`/events/${id}`);
  } catch (error) {
    console.error("Error deleting event by id:", error);
    throw error;
  }
};
