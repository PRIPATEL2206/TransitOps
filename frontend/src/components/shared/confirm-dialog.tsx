"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Variant = "default" | "destructive";

interface ConfirmDialogProps {
  /** Controls visibility */
  open: boolean;
  /** Called when the dialog should close (cancel, backdrop click, Escape) */
  onClose?: () => void;
  /** Alternative callback for open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Called when the user confirms */
  onConfirm: () => void;
  /** Dialog heading */
  title: string;
  /** Supporting description text */
  description?: string;
  /** Label for the confirm button (default: "Confirm") */
  confirmLabel?: string;
  /** Label for the cancel button (default: "Cancel") */
  cancelLabel?: string;
  /** Styling variant for the confirm button */
  variant?: Variant;
  /** Disables buttons while an async action is in flight */
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  isLoading = false,
}: ConfirmDialogProps) {
  const handleClose = () => {
    onClose?.();
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            type="button"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            disabled={isLoading}
            type="button"
          >
            {isLoading ? "Please wait…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
