"use client";

import { useParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { useVehicle } from "@/hooks/use-vehicles";

export default function EditVehiclePage() {
  const params = useParams();
  const id = params.id as string;
  const { data: vehicle, isLoading } = useVehicle(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Vehicle"
        description={`Editing ${vehicle?.registration_number ?? ""}`}
      />
      <div className="max-w-3xl">
        <VehicleForm vehicle={vehicle} />
      </div>
    </div>
  );
}
