import { PageHeader } from "@/components/shared/page-header";
import { DriverForm } from "@/components/drivers/driver-form";

export default function NewDriverPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Driver"
        description="Register a new driver"
      />
      <div className="max-w-3xl">
        <DriverForm />
      </div>
    </div>
  );
}
