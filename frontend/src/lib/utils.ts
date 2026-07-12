import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO, differenceInDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string | null | undefined, formatStr = "MMM dd, yyyy"): string {
  if (!dateString) return "—";
  try {
    return format(parseISO(dateString), formatStr);
  } catch {
    return "Invalid date";
  }
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    return format(parseISO(dateString), "MMM dd, yyyy HH:mm");
  } catch {
    return "Invalid date";
  }
}

export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
  } catch {
    return "Invalid date";
  }
}

export function formatDistance(km: number | null | undefined): string {
  if (km == null) return "—";
  return `${km.toLocaleString()} km`;
}

export function getDaysUntilExpiry(dateString: string | null | undefined): number | null {
  if (!dateString) return null;
  try {
    const days = differenceInDays(parseISO(dateString), new Date());
    return days;
  } catch {
    return null;
  }
}

export function getExpiryColor(days: number | null): string {
  if (days === null) return "text-muted-foreground";
  if (days < 0) return "text-destructive";
  if (days <= 30) return "text-red-500";
  if (days <= 60) return "text-orange-500";
  if (days <= 90) return "text-yellow-500";
  return "text-green-500";
}

export function truncate(str: string, length = 50): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}
