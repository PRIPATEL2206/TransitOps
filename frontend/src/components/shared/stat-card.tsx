"use client";

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";

interface StatCardProps {
  /** Lucide icon — can be a component (Truck) or rendered element (<Truck />) */
  icon: LucideIcon | ReactNode;
  /** Card title / metric name */
  title?: string;
  /** Alias for title (backward compat) */
  label?: string;
  /** Primary value to display */
  value: string | number;
  /** Optional description text */
  description?: string;
  /** Optional color variant */
  color?: "blue" | "green" | "amber" | "purple" | "orange" | "indigo" | "emerald" | "red";
  /** Optional trend indicator */
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  /** Extra Tailwind classes applied to the card root */
  className?: string;
  /** Extra Tailwind classes applied to the icon wrapper */
  iconClassName?: string;
}

const colorMap: Record<string, string> = {
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
  green: "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
  purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400",
  orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400",
  indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400",
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
  red: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
};

export function StatCard({
  icon,
  title,
  label,
  value,
  description,
  color = "blue",
  trend,
  className,
  iconClassName,
}: StatCardProps) {
  const displayLabel = title || label || "";

  // Determine how to render the icon
  const renderIcon = () => {
    if (!icon) return null;
    // If it's already a rendered React element (JSX), just display it
    if (typeof icon === "object" && "type" in (icon as any)) {
      return icon as ReactNode;
    }
    // If it's a component reference (LucideIcon), render it
    const IconComponent = icon as LucideIcon;
    return <IconComponent className="w-5 h-5" />;
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          {/* Icon */}
          <div
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg shrink-0",
              colorMap[color] || colorMap.blue,
              iconClassName
            )}
          >
            {renderIcon()}
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
          <p className="text-sm text-muted-foreground">{displayLabel}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend?.label && (
            <p className="text-xs text-muted-foreground">{trend.label}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
