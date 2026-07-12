"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Phone, Mail, MapPin, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { LicenseExpiryIndicator } from "@/components/drivers/license-expiry-indicator";
import { useDriver } from "@/hooks/use-drivers";
import { useTrips } from "@/hooks/use-trips";
import { format } from "date-fns";
import { TripStatusBadge } from "@/components/trips/trip-status-badge";

const DRIVER_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  inactive: { label: "Inactive", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  on_leave: { label: "On Leave", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  suspended: { label: "Suspended", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

function LabelValue({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value ?? "—"}</p>
    </div>
  );
}

export default function DriverDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: driver, isLoading } = useDriver(id);
  const { data: tripsData } = useTrips({ driver: id, page: 1, page_size: 10 });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Driver not found.{" "}
        <Link href="/drivers" className="text-primary hover:underline">
          Back to drivers
        </Link>
      </div>
    );
  }

  const trips = tripsData?.items ?? [];
  const statusConfig = DRIVER_STATUS_CONFIG[driver.status] ?? DRIVER_STATUS_CONFIG.inactive;

  return (
    <div className="space-y-6">
      <PageHeader
        title={driver.full_name}
        description={`Employee ID: ${driver.employee_id}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/drivers">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/drivers/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Profile</CardTitle>
              <Badge variant="outline" className={statusConfig.className}>
                {statusConfig.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <span className="text-2xl font-bold text-primary">
                {driver.first_name[0]}
                {driver.last_name[0]}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate">{driver.email}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                <span>{driver.phone}</span>
              </div>
              {driver.address && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="text-xs">{driver.address}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* License & Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">License & Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <LabelValue label="License Number" value={driver.license_number} />
            <LabelValue label="License Class" value={driver.license_type} />
            <div>
              <p className="text-xs text-muted-foreground">License Expiry</p>
              <LicenseExpiryIndicator expiryDate={driver.license_expiry} />
            </div>
            <LabelValue
              label="Date of Birth"
              value={
                driver.date_of_birth
                  ? format(new Date(driver.date_of_birth), "dd MMM yyyy")
                  : undefined
              }
            />
            <LabelValue
              label="Date Joined"
              value={
                driver.date_joined
                  ? format(new Date(driver.date_joined), "dd MMM yyyy")
                  : undefined
              }
            />
            <div>
              <p className="text-xs text-muted-foreground">Safety Score</p>
              <div className="flex items-center gap-2 mt-1">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">85 / 100</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trip History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Trips</CardTitle>
        </CardHeader>
        <CardContent>
          {trips.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">
              No trip history found.
            </p>
          ) : (
            <div className="space-y-1">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className="flex items-center justify-between py-2.5 border-b last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {trip.origin} → {trip.destination}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {trip.trip_number} •{" "}
                      {format(new Date(trip.scheduled_departure), "dd MMM yyyy")}
                    </p>
                  </div>
                  <TripStatusBadge status={trip.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
