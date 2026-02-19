import { useCallback, useEffect, useRef, useState } from "react";

import { fetchStatus } from "@/lib/api";
import { POLL_STATUS_MS, POLL_STATUS_OFFLINE_MS } from "@/lib/constants";
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
 * Polls GET /api/status with adaptive intervals:
 * - 2s when ESP32 is online
 * - 10s when ESP32 is offline
 */
export function useStatus() {
  const [status, setStatus] = useState<SystemStatus>(INITIAL_STATUS);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const onlineRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchStatus();
      onlineRef.current = data.esp_online;
      setStatus(data);
    } catch {
      onlineRef.current = false;
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
    let cancelled = false;

    async function poll() {
      if (cancelled) return;
      await refresh();
      if (!cancelled) {
        const interval = onlineRef.current ? POLL_STATUS_MS : POLL_STATUS_OFFLINE_MS;
        timeoutRef.current = setTimeout(poll, interval);
      }
    }

    poll();

    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [refresh]);

  return { status, lastUpdated, refresh } as const;
}
