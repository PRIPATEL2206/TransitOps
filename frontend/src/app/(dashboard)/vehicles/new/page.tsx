import { PageHeader } from "@/components/shared/page-header";
import { VehicleForm } from "@/components/vehicles/vehicle-form";

export default function NewVehiclePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Vehicle"
        description="Register a new vehicle in the fleet"
      />
      <div className="max-w-3xl">
        <VehicleForm />
      </div>
    </div>
  );
}
