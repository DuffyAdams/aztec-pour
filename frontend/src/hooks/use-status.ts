import { useCallback, useEffect, useRef, useState } from "react";

import { fetchStatus } from "@/lib/api";
import { POLL_STATUS_MS } from "@/lib/constants";
import type { SystemStatus } from "@/types/api";

const INITIAL_STATUS: SystemStatus = {
  server_online: false,
  esp_online: false,
  esp_status: {
    state: "offline",
    glass_present: false,
    uptime: 0,
    last_pour_ml: 0,
  },
  timestamp: 0,
  is_pouring: false,
};

/**
 * Polls GET /api/status at a fixed interval.
 * Returns the latest status and a manual refresh callback.
 */
export function useStatus() {
  const [status, setStatus] = useState<SystemStatus>(INITIAL_STATUS);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchStatus();
      setStatus(data);
    } catch {
      setStatus((prev) => ({
        ...prev,
        esp_online: false,
        esp_status: { ...prev.esp_status, state: "offline" },
      }));
    } finally {
      setLastUpdated(new Date());
    }
  }, []);

  useEffect(() => {
    queueMicrotask(refresh);
    intervalRef.current = setInterval(refresh, POLL_STATUS_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh]);

  return { status, lastUpdated, refresh } as const;
}
