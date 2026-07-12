import { cn } from "@/lib/utils";
import { differenceInDays, parseISO } from "date-fns";

interface LicenseExpiryIndicatorProps {
  expiryDate: string;
  showLabel?: boolean;
  className?: string;
}

function getExpiryInfo(expiryDate: string): {
  daysLeft: number;
  label: string;
  className: string;
  dotClassName: string;
} {
  const today = new Date();
  const expiry = parseISO(expiryDate);
  const daysLeft = differenceInDays(expiry, today);

  if (daysLeft < 0) {
    return {
      daysLeft,
      label: `Expired ${Math.abs(daysLeft)}d ago`,
      className: "text-red-700 dark:text-red-400",
      dotClassName: "bg-red-600",
    };
  }
  if (daysLeft <= 7) {
    return {
      daysLeft,
      label: `Expires in ${daysLeft}d`,
      className: "text-red-600 dark:text-red-400",
      dotClassName: "bg-red-500",
    };
  }
  if (daysLeft <= 14) {
    return {
      daysLeft,
      label: `Expires in ${daysLeft}d`,
      className: "text-orange-600 dark:text-orange-400",
      dotClassName: "bg-orange-500",
    };
  }
  if (daysLeft <= 30) {
    return {
      daysLeft,
      label: `Expires in ${daysLeft}d`,
      className: "text-amber-600 dark:text-amber-400",
      dotClassName: "bg-amber-500",
    };
  }
  return {
    daysLeft,
    label: new Date(expiryDate).toLocaleDateString(),
    className: "text-green-600 dark:text-green-400",
    dotClassName: "bg-green-500",
  };
}

export function LicenseExpiryIndicator({
  expiryDate,
  showLabel = true,
  className,
}: LicenseExpiryIndicatorProps) {
  const info = getExpiryInfo(expiryDate);

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className={cn("h-2 w-2 rounded-full shrink-0", info.dotClassName)} />
      {showLabel && (
        <span className={cn("text-sm font-medium", info.className)}>
          {info.label}
        </span>
      )}
    </div>
  );
}
