"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCancelTrip } from "@/hooks/use-trips";
import { useToast } from "@/hooks/use-toast";
import { Trip } from "@/types";

function makeCancelSchema(requireReason: boolean) {
  return z.object({
    reason: requireReason
      ? z.string().min(10, "Please provide a reason (at least 10 characters)")
      : z.string().optional(),
  });
}

type CancelFormData = { reason?: string };

interface CancelDialogProps {
  trip: Trip;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelDialog({ trip, open, onOpenChange }: CancelDialogProps) {
  const cancelTrip = useCancelTrip();
  const { toast } = useToast();

  const requireReason =
    trip.status === "dispatched" || trip.status === "in_progress";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CancelFormData>({
    resolver: zodResolver(makeCancelSchema(requireReason)),
  });

  async function onSubmit(data: CancelFormData) {
    try {
      await cancelTrip.mutateAsync({ id: trip.id, reason: data.reason });
      toast({ title: "Trip cancelled" });
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to cancel trip";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  }

  const isPending = isSubmitting || cancelTrip.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel Trip #{trip.trip_number}</DialogTitle>
          <DialogDescription>
            {requireReason
              ? "This trip is active. Please provide a reason for cancellation."
              : "Are you sure you want to cancel this trip?"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="reason">
              Reason{requireReason && <span className="text-red-500"> *</span>}
            </Label>
            <Textarea
              id="reason"
              placeholder="e.g. Vehicle breakdown, Route change..."
              rows={3}
              {...register("reason")}
            />
            {errors.reason && (
              <p className="text-xs text-red-500">{errors.reason.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Go Back
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel Trip
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
