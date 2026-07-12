import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type VehicleStatus = "available" | "in_use" | "maintenance" | "retired";

interface VehicleStatusBadgeProps {
  status: VehicleStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  VehicleStatus,
  { label: string; className: string }
> = {
  available: {
    label: "Available",
    className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400",
  },
  in_use: {
    label: "On Trip",
    className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  },
  maintenance: {
    label: "In Shop",
    className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
  },
  retired: {
    label: "Retired",
    className: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400",
  },
};

export function VehicleStatusBadge({ status, className }: VehicleStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.retired;
  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
