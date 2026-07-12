import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { DriverTable } from "@/components/drivers/driver-table";

export default function DriversPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Drivers"
        description="Manage your driver roster"
        action={
          <Button asChild>
            <Link href="/drivers/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Driver
            </Link>
          </Button>
        }
      />
      <DriverTable />
    </div>
  );
}
