import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  /** Lucide icon component to display */
  icon?: LucideIcon;
  /** Primary heading */
  title: string;
  /** Descriptive subtitle */
  description?: string;
  /** Optional CTA button label */
  actionLabel?: string;
  /** Called when the action button is clicked */
  onAction?: () => void;
  /** Render a fully custom action node instead of the default button */
  action?: ReactNode;
  /** Additional className for the container */
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center gap-4 py-16 px-4",
        className
      )}
    >
      {Icon && (
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-muted">
          <Icon className="w-7 h-7 text-muted-foreground" />
        </div>
      )}

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {action
        ? action
        : actionLabel && onAction && (
            <Button onClick={onAction} className="mt-2">
              {actionLabel}
            </Button>
          )}
    </div>
  );
}
