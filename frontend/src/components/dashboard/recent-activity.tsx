"use client";

import { Truck, User, MapPin, Wrench, Fuel } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrips } from "@/hooks/use-trips";
import { cn } from "@/lib/utils";

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  trip: MapPin,
  vehicle: Truck,
  driver: User,
  maintenance: Wrench,
  fuel: Fuel,
};

export function RecentActivity() {
  const { data, isLoading } = useTrips({ page: 1, page_size: 8, ordering: "-created_at" });

  const trips = data?.results ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground text-sm">No recent activity</p>
        ) : (
          <div className="space-y-1">
            {trips.map((trip) => {
              const Icon = ACTIVITY_ICONS.trip;
              const statusColor =
                trip.status === "completed"
                  ? "text-green-500"
                  : trip.status === "in_progress"
                  ? "text-blue-500"
                  : trip.status === "cancelled"
                  ? "text-red-500"
                  : "text-amber-500";

              return (
                <div
                  key={trip.id}
                  className="flex items-center gap-3 py-2.5 border-b last:border-0"
                >
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      Trip #{trip.trip_number}: {trip.origin} → {trip.destination}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {trip.vehicle_details?.registration_number} •{" "}
                      {trip.driver_details?.full_name}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium capitalize shrink-0",
                      statusColor
                    )}
                  >
                    {trip.status.replace("_", " ")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
