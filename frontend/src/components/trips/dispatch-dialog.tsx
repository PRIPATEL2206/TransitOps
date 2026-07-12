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
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useDispatchTrip } from "@/hooks/use-trips";
import { useToast } from "@/hooks/use-toast";
import { Trip } from "@/types";

interface DispatchDialogProps {
  trip: Trip;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DispatchDialog({ trip, open, onOpenChange }: DispatchDialogProps) {
  const dispatchTrip = useDispatchTrip();
  const { toast } = useToast();

  async function handleDispatch() {
    try {
      await dispatchTrip.mutateAsync(trip.id);
      toast({ title: "Trip dispatched successfully" });
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to dispatch trip";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Dispatch Trip #{trip.trip_number}</DialogTitle>
          <DialogDescription>
            Review the trip details before dispatching. Dispatching will lock the vehicle and driver.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="rounded-lg border p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Route</span>
              <span className="font-medium">
                {trip.origin} → {trip.destination}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vehicle</span>
              <span className="font-mono font-medium">
                {trip.vehicle_details?.registration_number ?? "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Driver</span>
              <span className="font-medium">
                {trip.driver_details?.full_name ?? "—"}
              </span>
            </div>
            {trip.cargo_weight != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cargo</span>
                <span>{trip.cargo_weight} kg</span>
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Once dispatched, the assigned vehicle and driver will be marked as unavailable
              until this trip is completed or cancelled.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={dispatchTrip.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleDispatch} disabled={dispatchTrip.isPending}>
            {dispatchTrip.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Dispatch Trip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
