import { useCallback } from "react";
import { Toaster, toast } from "sonner";

import { StatusCard } from "@/components/status-card";
import { DispenseControl } from "@/components/dispense-control";
import { ActivityLog } from "@/components/activity-log";
import { useStatus } from "@/hooks/use-status";
import { useLogs } from "@/hooks/use-logs";
import { useDispense } from "@/hooks/use-dispense";

export default function App() {
  const { status, lastUpdated, refresh: refreshStatus } = useStatus();
  const { logs, refresh: refreshLogs } = useLogs();

  const handleSuccess = useCallback(() => {
    toast.success("Dispense started");
    // Refresh data after a short delay to let the backend process
    setTimeout(() => {
      refreshStatus();
      refreshLogs();
    }, 1000);
  }, [refreshStatus, refreshLogs]);

  const handleError = useCallback((message: string) => {
    toast.error(message);
  }, []);

  const { dispenseState, errorMessage, dispense } = useDispense({
    onSuccess: handleSuccess,
    onError: handleError,
  });

  return (
    <div className="relative min-h-svh bg-background text-foreground">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[60vh] w-[120vw] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      </div>

      <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-5 py-6 pb-12">
        {/* Header */}
        <header className="text-center">
          <h1 className="text-4xl font-extrabold uppercase tracking-tight text-primary">
            Chuggernog
          </h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Liquid Dispenser
          </p>
        </header>

        {/* Status */}
        <StatusCard status={status} lastUpdated={lastUpdated} />

        {/* Controls */}
        <DispenseControl
          status={status}
          dispenseState={dispenseState}
          errorMessage={errorMessage}
          onDispense={dispense}
        />

        {/* Logs */}
        <ActivityLog logs={logs} />
      </main>

      <Toaster position="top-center" theme="dark" richColors closeButton />
    </div>
  );
}
