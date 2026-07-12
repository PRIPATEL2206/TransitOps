import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface Trend {
  /** Numeric change value (e.g. 4.5 for 4.5%) */
  value: number;
  /** True = value went up (good); false = value went down */
  isPositive: boolean;
  /** Optional label suffix, e.g. "vs last month" */
  label?: string;
}

interface StatCardProps {
  /** Lucide icon component */
  icon: LucideIcon;
  /** Card label / metric name */
  label: string;
  /** Primary value to display */
  value: string | number;
  /** Optional trend indicator */
  trend?: Trend;
  /** Extra Tailwind classes applied to the card root */
  className?: string;
  /** Extra Tailwind classes applied to the icon wrapper */
  iconClassName?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  className,
  iconClassName,
}: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          {/* Icon */}
          <div
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0",
              iconClassName
            )}
          >
            <Icon className="w-5 h-5 text-primary" />
          </div>

          {/* Trend chip */}
          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full shrink-0",
                trend.isPositive
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
              )}
            >
              {trend.isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>
                {trend.isPositive ? "+" : ""}
                {trend.value.toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {/* Value + label */}
        <div className="mt-3 space-y-0.5">
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {trend?.label && (
            <p className="text-xs text-muted-foreground">{trend.label}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
