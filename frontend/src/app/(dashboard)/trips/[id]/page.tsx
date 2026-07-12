"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Navigation,
  CheckCircle,
  XCircle,
  Truck,
  User,
  Weight,
  MapPin,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";
import { TripStatusBadge } from "@/components/trips/trip-status-badge";
import { DispatchDialog } from "@/components/trips/dispatch-dialog";
import { CompleteDialog } from "@/components/trips/complete-dialog";
import { CancelDialog } from "@/components/trips/cancel-dialog";
import { useTrip } from "@/hooks/use-trips";
import { format } from "date-fns";

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value ?? "—"}</p>
      </div>
    </div>
  );
}

const STATUS_STEPS = ["pending", "dispatched", "in_progress", "completed"];

export default function TripDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: trip, isLoading } = useTrip(id);

  const [showDispatch, setShowDispatch] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Trip not found.{" "}
        <Link href="/trips" className="text-primary hover:underline">
          Back to trips
        </Link>
      </div>
    );
  }

  const currentStepIdx = STATUS_STEPS.indexOf(trip.status);
  const canDispatch = trip.status === "pending" || trip.status === "dispatched";
  const canComplete = trip.status === "dispatched" || trip.status === "in_progress";
  const canCancel = trip.status !== "completed" && trip.status !== "cancelled";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Trip #${trip.trip_number}`}
        description={`${trip.origin} → ${trip.destination}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/trips">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            {canDispatch && (
              <Button size="sm" onClick={() => setShowDispatch(true)}>
                <Navigation className="mr-2 h-4 w-4" />
                Dispatch
              </Button>
            )}
            {canComplete && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setShowComplete(true)}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete
              </Button>
            )}
            {canCancel && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowCancel(true)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        }
      />

      {/* Status Timeline */}
      {trip.status !== "cancelled" && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              {STATUS_STEPS.map((step, idx) => (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                        idx <= currentStepIdx
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-muted border-muted-foreground/30 text-muted-foreground"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">
                      {step.replace("_", " ")}
                    </span>
                  </div>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 mb-5 ${
                        idx < currentStepIdx ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trip Info */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Trip Details</CardTitle>
            <TripStatusBadge status={trip.status} />
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              icon={<MapPin className="h-4 w-4" />}
              label="Route"
              value={`${trip.origin} → ${trip.destination}`}
            />
            <InfoRow
              icon={<Calendar className="h-4 w-4" />}
              label="Scheduled Departure"
              value={format(new Date(trip.scheduled_departure), "dd MMM yyyy, HH:mm")}
            />
            {trip.actual_departure && (
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="Actual Departure"
                value={format(new Date(trip.actual_departure), "dd MMM yyyy, HH:mm")}
              />
            )}
            {trip.actual_arrival && (
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="Actual Arrival"
                value={format(new Date(trip.actual_arrival), "dd MMM yyyy, HH:mm")}
              />
            )}
            <InfoRow
              icon={<Weight className="h-4 w-4" />}
              label="Cargo Weight"
              value={trip.cargo_weight != null ? `${trip.cargo_weight} kg` : undefined}
            />
            {trip.distance_covered && (
              <InfoRow
                icon={<Navigation className="h-4 w-4" />}
                label="Distance Covered"
                value={`${trip.distance_covered} km`}
              />
            )}
            {trip.purpose && (
              <InfoRow
                icon={<MapPin className="h-4 w-4" />}
                label="Purpose"
                value={trip.purpose}
              />
            )}
          </CardContent>
        </Card>

        {/* Vehicle & Driver */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vehicle & Driver</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4 space-y-3">
              <InfoRow
                icon={<Truck className="h-4 w-4" />}
                label="Vehicle"
                value={
                  trip.vehicle_details
                    ? `${trip.vehicle_details.registration_number} — ${trip.vehicle_details.make} ${trip.vehicle_details.model}`
                    : undefined
                }
              />
              {trip.start_odometer != null && (
                <InfoRow
                  icon={<Navigation className="h-4 w-4" />}
                  label="Start Odometer"
                  value={`${trip.start_odometer.toLocaleString()} km`}
                />
              )}
              {trip.end_odometer != null && (
                <InfoRow
                  icon={<Navigation className="h-4 w-4" />}
                  label="End Odometer"
                  value={`${trip.end_odometer.toLocaleString()} km`}
                />
              )}
            </div>
            <Separator />
            <div className="rounded-lg bg-muted/50 p-4">
              <InfoRow
                icon={<User className="h-4 w-4" />}
                label="Driver"
                value={trip.driver_details?.full_name}
              />
              {trip.driver_details && (
                <p className="text-xs text-muted-foreground mt-2 ml-11">
                  License: {trip.driver_details.license_number} ({trip.driver_details.license_type})
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {showDispatch && (
        <DispatchDialog
          trip={trip}
          open={showDispatch}
          onOpenChange={setShowDispatch}
        />
      )}
      {showComplete && (
        <CompleteDialog
          trip={trip}
          open={showComplete}
          onOpenChange={setShowComplete}
        />
      )}
      {showCancel && (
        <CancelDialog
          trip={trip}
          open={showCancel}
          onOpenChange={setShowCancel}
        />
      )}
    </div>
  );
}
