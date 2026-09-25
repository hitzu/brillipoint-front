import { EventThemes } from "./eventThemes";

export interface GetEventServiceTypesResponse {
  id: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  name: string;
  description: string;
  rank: number;
}

// v2 read model: schedule/venue/status resolve server-side from the
// event's booking (bridge: booking -> contract -> event). null/"finished"
// when there is no booking. Writes stay on v1 and never send these fields.
export interface EventV2 {
  id: number;
  key: string;
  token: string;
  contractId: number;
  eventTypeId?: number | null;
  honoreesNames?: string | null;
  albumPhrase?: string | null;
  venueName?: string | null;
  mapsUrl?: string | null;
  serviceStartsAt?: string | null;
  serviceEndsAt?: string | null;
  bookingId: number | null;
  status: "active" | "finished";
  delegateName?: string | null;
  photoCount: number;
  eventThemeId?: number | null;
  createdAt: string;
  updatedAt: string;
  eventTheme?: EventThemes;
}

export interface CreateEventPayload {
  contractId: number;
  key: string;
  eventTypeId: number;
  eventThemeId?: number;
  honoreesNames: string;
  albumPhrase: string;
  delegateName?: string;
  photoCount?: number;
}

export interface UpdateEventPayload {
  key?: string;
  eventTypeId?: number;
  eventThemeId?: number;
  honoreesNames?: string;
  albumPhrase?: string;
  delegateName?: string;
  photoCount?: number;
}

export type EventPhraseResponse = {
  id: number;
  content: string;
};
