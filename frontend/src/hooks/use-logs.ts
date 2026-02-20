import { useCallback, useEffect, useState } from "react";

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

    let timeoutId: ReturnType<typeof setTimeout>;

    async function poll() {
      await refresh();
      timeoutId = setTimeout(poll, POLL_LOGS_MS);
    }

    // Start initial poll
    poll();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [refresh, enabled]);

  return { logs, refresh } as const;
}
