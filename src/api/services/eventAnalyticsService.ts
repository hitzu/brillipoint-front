import { AnalyticsAction } from "../../interfaces";
import { hasBrillipointSession } from "../../lib/brillipointSession";
import { axiosInstanceWithoutToken } from "../config/axiosConfig";

type TrackEventOptions = {
  sessionId?: string | null;
  source?: string | null;
  surface?: string | null;
  metadata?: Record<string, unknown>;
};

const readStringField = (
  metadata: Record<string, unknown> | undefined,
  key: string,
): string | null =>
  typeof metadata?.[key] === "string" ? (metadata[key] as string) : null;

export const trackEvent = async (
  action: AnalyticsAction,
  eventToken: string,
  options: TrackEventOptions = {},
): Promise<void> => {
  // Devices with a Brillipoint session never record analytics.
  if (hasBrillipointSession()) return;

  const source = options.source ?? readStringField(options.metadata, "source");
  const surface =
    options.surface ?? readStringField(options.metadata, "surface");

  // surface and source are first-class fields, never nested in metadata
  const metadata = { ...(options.metadata ?? {}) };
  delete metadata.surface;
  delete metadata.source;
  const hasMetadata = Object.keys(metadata).length > 0;

  try {
    await axiosInstanceWithoutToken.post("/event-analytics/track", {
      action,
      eventToken,
      sessionId: options.sessionId ?? null,
      ...(source ? { source } : {}),
      ...(surface ? { surface } : {}),
      ...(hasMetadata ? { metadata } : {}),
    });
  } catch {
    // fire-and-forget — never block the UI
  }
};
