import {
  EventPhoto,
  EventPhotosPage,
  EventPhotosPageResponse,
  EventPhotoResponse,
  PublicEvent,
  PublicEventResponse,
  EventPhraseResponse,
  GalleryResponse,
  SessionResponse
} from "../../interfaces";
import { EventThemeResponse } from "../../features/party/types/themeContract";
import { axiosInstanceWithoutToken } from "../config/axiosConfig";

const normalizePublicEvent = (
  token: string,
  payload?: PublicEventResponse,
): PublicEvent => ({
  id: payload?.id,
  token: payload?.token || token,
  name: payload?.honoreesNames ?? undefined,
  description: payload?.albumPhrase ?? undefined,
  createdAt: payload?.createdAt,
  updatedAt: payload?.updatedAt,
});

export const getPublicEventByToken = async (
  token: string,
): Promise<PublicEvent> => {
  const normalizedToken = encodeURIComponent(token);
  const response = await axiosInstanceWithoutToken.get<PublicEventResponse>(
    `/v2/events/${normalizedToken}`,
  );
  return normalizePublicEvent(token, response.data);
};

type EventPhotosPageParams = {
  limit?: number;
  cursor?: string | null;
  signal?: AbortSignal;
};

export const getEventPhotosPage = async (
  token: string,
  params: EventPhotosPageParams = {},
): Promise<EventPhotosPage> => {
  const { limit = 60, cursor, signal } = params;
  const normalizedToken = encodeURIComponent(token);
  const response = await axiosInstanceWithoutToken.get<
    EventPhotoResponse[] | EventPhotosPageResponse
  >(`/photos/event/${normalizedToken}`, {
    signal,
    params: {
      limit,
      ...(cursor ? { cursor } : {}),
    },
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



export const getEventPhrases = async (
  token: string,
  signal?: AbortSignal,
): Promise<EventPhraseResponse[]> => {
  const normalizedToken = encodeURIComponent(token);
  const response = await axiosInstanceWithoutToken.get<EventPhraseResponse[]>(
    `/events/phrases/${normalizedToken}`,
    { signal },
  );
  return response.data;
};

export const getPublicPhotosByEventToken = async (
  token: string,
  signal?: AbortSignal,
): Promise<EventPhoto[]> => {
  const response = await getEventPhotosPage(token, {
    limit: 100,
    signal,
  });
  return response.items;
};


export const getEventGalleryV2 = async (
  token: string,
): Promise<GalleryResponse> => {
  const normalizedToken = encodeURIComponent(token);

  const response = await axiosInstanceWithoutToken.get<GalleryResponse>(
    `/sessions/gallery/${normalizedToken}`,
  );

  return response.data
};

export const getEventGallerySessionV2 = async (
  token: string,
): Promise<SessionResponse> => {
  const normalizedToken = encodeURIComponent(token);

  const response = await axiosInstanceWithoutToken.get<SessionResponse>(
    `/sessions/${normalizedToken}`,
  );

  return response.data;
};

// Theme travels in its own request, separate from photos (different cache
// lifecycle: theme is stable/long-cache, photos are volatile/polled).
export const getEventTheme = async (
  eventToken: string,
): Promise<EventThemeResponse> => {
  const normalizedToken = encodeURIComponent(eventToken);

  const response = await axiosInstanceWithoutToken.get<EventThemeResponse>(
    `/events/${normalizedToken}/theme`,
  );

  return response.data;
};

