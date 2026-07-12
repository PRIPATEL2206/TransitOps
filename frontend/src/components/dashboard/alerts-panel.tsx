"use client";

import Link from "next/link";
import { AlertTriangle, AlertCircle, Info, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardKPIs } from "@/hooks/use-analytics";
import { Alert } from "@/types";
import { cn } from "@/lib/utils";

const SEVERITY_CONFIG = {
  critical: {
    icon: AlertCircle,
    className: "text-red-500",
    badgeVariant: "destructive" as const,
  },
  high: {
    icon: AlertTriangle,
    className: "text-orange-500",
    badgeVariant: "destructive" as const,
  },
  medium: {
    icon: AlertTriangle,
    className: "text-amber-500",
    badgeVariant: "secondary" as const,
  },
  low: {
    icon: Info,
    className: "text-blue-500",
    badgeVariant: "secondary" as const,
  },
};

function AlertItem({ alert }: { alert: Alert }) {
  const config = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.low;
  const Icon = config.icon;

  const href =
    alert.entity_type === "vehicle"
      ? `/vehicles/${alert.entity_id}`
      : alert.entity_type === "driver"
      ? `/drivers/${alert.entity_id}`
      : "#";

  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", config.className)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug">{alert.message}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Due: {new Date(alert.due_date).toLocaleDateString()}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={config.badgeVariant} className="text-xs capitalize">
          {alert.severity}
        </Badge>
        <Link href={href}>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
        </Link>
      </div>
    </div>
  );
}

export function AlertsPanel() {
  const { data, isLoading } = useDashboardKPIs();

  const alerts: Alert[] = data?.alerts ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>Alerts</span>
          {alerts.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {alerts.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            No active alerts
          </div>
        ) : (
          <div>
            {alerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
