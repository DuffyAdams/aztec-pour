import { useCallback, useEffect, useRef, useState } from "react";

import { fetchLogs } from "@/lib/api";
import { POLL_LOGS_MS } from "@/lib/constants";
import type { LogEntry } from "@/types/api";

/**
 * Polls GET /api/logs at a fixed interval.
 * Polling only runs when `enabled` is true.
 * Returns the log entries and a manual refresh callback.
 */
export function useLogs(enabled = true) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchLogs();
      setLogs(data);
    } catch {
      // Silently fail — stale logs are fine
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    queueMicrotask(refresh);
    intervalRef.current = setInterval(refresh, POLL_LOGS_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh, enabled]);

  return { logs, refresh } as const;
}
