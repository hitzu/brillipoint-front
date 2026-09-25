import { EventV2 } from '../interfaces'

export interface PublicEvent {
  id?: number;
  token: string;
  name?: string;
  description?: string;
  coverUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicEventResponse extends EventV2 { }

export type PublicPersonalizedPhotoUploadUrlPayload = {
  fileName: string;
  mime: string;
  storageEnv?: string;
};

export type PublicPersonalizedPhotoUploadUrlResponse = {
  eventId?: number;
  bucket?: string;
  path: string;
  signedUrl: string;
  token?: string;
  publicUrl: string;
};
