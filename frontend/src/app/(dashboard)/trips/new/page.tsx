import { PageHeader } from "@/components/shared/page-header";
import { TripForm } from "@/components/trips/trip-form";

export default function NewTripPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Trip"
        description="Create and schedule a new trip"
      />
      <div className="max-w-3xl">
        <TripForm />
      </div>
    </div>
  );
}
