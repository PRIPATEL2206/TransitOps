"use client";

import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { DriverForm } from "@/components/drivers/driver-form";
import { useDriver } from "@/hooks/use-drivers";

export default function EditDriverPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: driver, isLoading } = useDriver(id);

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
        title="Edit Driver"
        description={`Editing ${driver?.full_name ?? ""}`}
      />
      <div className="max-w-3xl">
        <DriverForm driver={driver} />
      </div>
    </div>
  );
}
