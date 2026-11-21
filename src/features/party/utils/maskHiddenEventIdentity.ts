import type { SessionEventData } from "../../../interfaces/eventGallery";

/**
 * A dot in the honorees name is the staff's signal to hide the honoree name
 * and the event date from the guest-facing pages.
 */
export const hasHiddenIdentityMarker = (honoreesNames?: string | null) =>
  Boolean(honoreesNames?.includes("."));

/** Drops `honoreesNames` and `date` when the name carries the hide marker. */
export const maskHiddenEventIdentity = <T extends Partial<SessionEventData>>(
  event: T | null | undefined,
): T | null => {
  if (!event) return null;
  if (!hasHiddenIdentityMarker(event.honoreesNames)) return event;
  return { ...event, honoreesNames: "", date: "" };
};
