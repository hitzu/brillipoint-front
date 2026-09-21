import { useCallback, useEffect, useRef, useState } from "react";
import { getAgendaRange } from "../services/bookingAgendaService";
import type { AgendaEntry, YMD } from "../types";
import { normalizeAgendaDays } from "../utils/normalizeAgenda";

export type AgendaRangeStatus = "loading" | "success" | "error";
export interface AgendaRangeResult {
  entries: Record<YMD, AgendaEntry[]>;
  status: AgendaRangeStatus;
  error: unknown;
  isRefreshing: boolean;
  refetch: () => void;
}

export const useAgendaRange = (from: YMD, to: YMD): AgendaRangeResult => {
  const [entries, setEntries] = useState<Record<YMD, AgendaEntry[]>>({});
  const [status, setStatus] = useState<AgendaRangeStatus>("loading");
  const [error, setError] = useState<unknown>(null);
  const [refresh, setRefresh] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasData = useRef(false);
  const refetch = useCallback(() => setRefresh((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    if (hasData.current) setIsRefreshing(true);
    else setStatus("loading");
    getAgendaRange(from, to, controller.signal)
      .then((days) => {
        if (controller.signal.aborted) return;
        setEntries(normalizeAgendaDays(days));
        setStatus("success");
        hasData.current = true;
      })
      .catch((reason) => {
        if (controller.signal.aborted) return;
        setError(reason);
        setStatus(hasData.current ? "success" : "error");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsRefreshing(false);
      });
    return () => controller.abort();
  }, [from, to, refresh]);

  return { entries, status, error, isRefreshing, refetch };
};
