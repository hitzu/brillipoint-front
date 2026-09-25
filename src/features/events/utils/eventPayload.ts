import { CreateEventPayload, UpdateEventPayload } from "../../../interfaces";

export interface CreateEventFormValues {
  contractId: string;
  key: string;
  eventType: string;
  eventThemeId: string;
  honoreesNames: string;
  albumPhrase: string;
  delegateName: string;
  photoCount: string;
}

export interface UpdateEventFormValues {
  key: string;
  eventType: string;
  eventThemeId: string;
  honoreesNames: string;
  albumPhrase: string;
  delegateName: string;
  photoCount: string;
}

export const buildCreateEventPayload = (
  values: CreateEventFormValues,
): CreateEventPayload => ({
  contractId: Number(values.contractId),
  key: values.key,
  eventTypeId: Number(values.eventType),
  ...(values.eventThemeId ? { eventThemeId: Number(values.eventThemeId) } : {}),
  honoreesNames: values.honoreesNames,
  albumPhrase: values.albumPhrase,
  ...(values.delegateName.trim() ? { delegateName: values.delegateName } : {}),
  ...(values.photoCount ? { photoCount: Number(values.photoCount) } : {}),
});

export const buildUpdateEventPayload = (
  values: UpdateEventFormValues,
): UpdateEventPayload => ({
  key: values.key,
  eventTypeId: Number(values.eventType),
  ...(values.eventThemeId ? { eventThemeId: Number(values.eventThemeId) } : {}),
  honoreesNames: values.honoreesNames,
  albumPhrase: values.albumPhrase,
  ...(values.delegateName.trim() ? { delegateName: values.delegateName } : {}),
  ...(values.photoCount ? { photoCount: Number(values.photoCount) } : {}),
});
