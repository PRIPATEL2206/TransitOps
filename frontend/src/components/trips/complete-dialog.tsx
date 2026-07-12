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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCompleteTrip } from "@/hooks/use-trips";
import { useToast } from "@/hooks/use-toast";
import { Trip } from "@/types";

const completeSchema = z.object({
  end_odometer: z
    .number({ invalid_type_error: "Odometer reading is required" })
    .min(0, "Must be >= 0"),
  fuel_consumed: z
    .number({ invalid_type_error: "Fuel consumed is required" })
    .min(0, "Must be >= 0"),
  actual_distance: z
    .number()
    .min(0)
    .optional()
    .or(z.literal(0)),
});

type CompleteFormData = z.infer<typeof completeSchema>;

interface CompleteDialogProps {
  trip: Trip;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompleteDialog({ trip, open, onOpenChange }: CompleteDialogProps) {
  const completeTrip = useCompleteTrip();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompleteFormData>({
    resolver: zodResolver(completeSchema),
    defaultValues: {
      end_odometer: trip.start_odometer ?? undefined,
      fuel_consumed: 0,
    },
  });

  async function onSubmit(data: CompleteFormData) {
    try {
      await completeTrip.mutateAsync({ id: trip.id, ...data });
      toast({ title: "Trip completed successfully" });
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to complete trip";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  }

  const isPending = isSubmitting || completeTrip.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Trip #{trip.trip_number}</DialogTitle>
          <DialogDescription>
            Enter the final readings to complete this trip.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="end_odometer">
              Final Odometer (km) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="end_odometer"
              type="number"
              step="0.1"
              {...register("end_odometer", { valueAsNumber: true })}
            />
            {errors.end_odometer && (
              <p className="text-xs text-red-500">{errors.end_odometer.message}</p>
            )}
            {trip.start_odometer != null && (
              <p className="text-xs text-muted-foreground">
                Trip started at: {trip.start_odometer.toLocaleString()} km
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fuel_consumed">
              Fuel Consumed (litres) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fuel_consumed"
              type="number"
              step="0.1"
              min="0"
              {...register("fuel_consumed", { valueAsNumber: true })}
            />
            {errors.fuel_consumed && (
              <p className="text-xs text-red-500">{errors.fuel_consumed.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="actual_distance">Actual Distance (km)</Label>
            <Input
              id="actual_distance"
              type="number"
              step="0.1"
              min="0"
              {...register("actual_distance", { valueAsNumber: true })}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-green-600 hover:bg-green-700">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Trip
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
