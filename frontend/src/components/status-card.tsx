import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusIndicator } from "@/components/status-indicator";
import type { SystemStatus } from "@/types/api";

interface StatusCardProps {
  status: SystemStatus;
  lastUpdated: Date | null;
}

function formatTime(date: Date | null): string {
  if (!date) return "--:--:--";
  return date.toLocaleTimeString();
}

function StatusRow({
  label,
  value,
  indicator,
}: {
  label: string;
  value: string;
  indicator?: "online" | "offline" | "busy";
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-foreground">{label}</span>
      <span className="flex items-center gap-2 text-sm text-muted-foreground tabular-nums">
        {indicator && <StatusIndicator status={indicator} />}
        {value}
      </span>
    </div>
  );
}

export function StatusCard({ status, lastUpdated }: StatusCardProps) {
  const espState = status.esp_status.state;
  const isPouring = espState === "pouring" || status.is_pouring;

  const machineStateLabel = espState.toUpperCase();
  const machineIndicator = isPouring ? "busy" : espState === "idle" ? "online" : undefined;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          System Status
        </CardTitle>
        <span className="text-[0.7rem] text-muted-foreground tabular-nums">
          {formatTime(lastUpdated)}
        </span>
      </CardHeader>

      <CardContent className="space-y-0 rounded-lg bg-muted/30 px-4">
        <StatusRow
          label="Connectivity"
          value={status.esp_online ? "Online" : "Offline"}
          indicator={status.esp_online ? "online" : "offline"}
        />
        <Separator className="opacity-10" />
        <StatusRow
          label="Glass Sensor"
          value={status.esp_status.glass_present ? "Detected" : "Empty"}
          indicator={status.esp_status.glass_present ? "online" : "offline"}
        />
        <Separator className="opacity-10" />
        <StatusRow
          label="Machine State"
          value={machineStateLabel}
          indicator={machineIndicator}
        />
      </CardContent>
    </Card>
  );
}
