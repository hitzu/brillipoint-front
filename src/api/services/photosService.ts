import type {
  EventPhotosPage,
  EventPhotosPageResponse,
  EventPhotoResponse,
  PublicEvent,
  PublicEventResponse,
} from "../../interfaces";
import { axiosInstanceWithToken } from "../config/axiosConfig";

const normalizePublicEvent = (
  token: string,
  payload?: PublicEventResponse
): PublicEvent => ({
  token: payload?.token || token,
  name:
    payload?.honoreesNames ||
    "Experiencia Brillipoint",
  description: payload?.albumPhrase ?? undefined,
  createdAt: payload?.createdAt,
  updatedAt: payload?.updatedAt,
});

export const getEventPhotos = async (
  token: string,
  limit = 100
): Promise<EventPhotosPage> => {
  const normalizedToken = encodeURIComponent(token);
  const response = await axiosInstanceWithToken.get<
    EventPhotoResponse[] | EventPhotosPageResponse
  >(`/photos/event/${normalizedToken}`, {
    params: { limit },
  });

  const payload = response.data;
  const normalizedPayload = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && "data" in payload
      ? (payload as { data?: EventPhotosPageResponse }).data || payload
      : payload;

  if (Array.isArray(normalizedPayload)) {
    return {
      items: normalizedPayload,
      hasMore: false,
      nextCursor: null,
    };
  }

  const items = Array.isArray(normalizedPayload.items)
    ? normalizedPayload.items
    : [];
  return {
    event: normalizedPayload.event
      ? normalizePublicEvent(token, normalizedPayload.event)
      : undefined,
    items,
    hasMore: Boolean(normalizedPayload.hasMore),
    nextCursor: normalizedPayload.nextCursor || null,
  };
};

export const deletePhotoById = async (id: number): Promise<void> => {
  await axiosInstanceWithToken.delete(`/photos/${id}`);
};
