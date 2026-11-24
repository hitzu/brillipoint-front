import { axiosInstanceWithoutToken, getApiBaseUrl } from "../config/axiosConfig";

export type ReservationEventPayload = {
  action: string;
  sessionId: string;
  surface?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Fire-and-forget: never throws and never blocks the page. `keepalive` uses
 * fetch so the request survives the page being hidden or closed.
 */
export const sendReservationEvent = (
  token: string,
  payload: ReservationEventPayload,
  options: { keepalive: boolean },
): void => {
  const path = `/contracts/public/${encodeURIComponent(token)}/track`;
  try {
    if (options.keepalive && typeof fetch === "function") {
      void fetch(`${getApiBaseUrl()}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => undefined);
      return;
    }
    void axiosInstanceWithoutToken.post(path, payload).catch(() => undefined);
  } catch {
    // tracking must never break the page
  }
};
