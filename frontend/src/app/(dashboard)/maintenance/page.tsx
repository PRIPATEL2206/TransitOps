"use client";

import { useState } from "react";
import Link from "next/link";
import { PlusCircle, MoreHorizontal, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useMaintenance, useCloseMaintenance } from "@/hooks/use-maintenance";
import { useToast } from "@/hooks/use-toast";
import { MaintenanceRecord } from "@/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Scheduled", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  completed: { label: "Completed", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
};

export default function MaintenancePage() {
  const [page, setPage] = useState(1);
  const [closeTarget, setCloseTarget] = useState<MaintenanceRecord | null>(null);
  const { data, isLoading } = useMaintenance({ page, page_size: 25 });
  const closeMaintenance = useCloseMaintenance();
  const { toast } = useToast();

  const columns = [
    {
      key: "vehicle",
      header: "Vehicle",
      cell: (row: MaintenanceRecord) => (
        <Link
          href={`/vehicles/${row.vehicle}`}
          className="text-sm font-mono text-primary hover:underline"
        >
          {row.vehicle_details?.registration_number ?? "—"}
        </Link>
      ),
    },
    {
      key: "maintenance_type",
      header: "Type",
      cell: (row: MaintenanceRecord) => (
        <span className="text-sm capitalize">{row.maintenance_type.replace("_", " ")}</span>
      ),
    },
    {
      key: "description",
      header: "Description",
      cell: (row: MaintenanceRecord) => (
        <span className="text-sm text-muted-foreground line-clamp-1">{row.description}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row: MaintenanceRecord) => {
        const cfg = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.scheduled;
        return (
          <Badge variant="outline" className={cfg.className}>
            {cfg.label}
          </Badge>
        );
      },
    },
    {
      key: "cost",
      header: "Cost",
      cell: (row: MaintenanceRecord) => (
        <span className="text-sm">${row.cost?.toLocaleString() ?? "—"}</span>
      ),
    },
    {
      key: "scheduled_date",
      header: "Scheduled",
      cell: (row: MaintenanceRecord) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.scheduled_date), "dd MMM yyyy")}
        </span>
      ),
    },
    {
      key: "vendor",
      header: "Vendor",
      cell: (row: MaintenanceRecord) => (
        <span className="text-sm text-muted-foreground">{row.vendor || "—"}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (row: MaintenanceRecord) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {row.status !== "completed" && row.status !== "cancelled" && (
              <DropdownMenuItem
                onClick={() => setCloseTarget(row)}
                className="text-green-600"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Complete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  async function handleClose() {
    if (!closeTarget) return;
    try {
      await closeMaintenance.mutateAsync(closeTarget.id);
      toast({ title: "Maintenance record closed" });
    } catch {
      toast({ title: "Failed to close record", variant: "destructive" });
    } finally {
      setCloseTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance"
        description="Track vehicle maintenance and service records"
        action={
          <Button asChild>
            <Link href="/maintenance/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Record
            </Link>
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        totalCount={data?.count ?? 0}
        page={page}
        pageSize={25}
        onPageChange={setPage}
      />

      <ConfirmDialog
        open={!!closeTarget}
        onOpenChange={(open) => !open && setCloseTarget(null)}
        title="Close Maintenance Record"
        description="Mark this maintenance record as completed?"
        confirmLabel="Mark Complete"
        onConfirm={handleClose}
        isLoading={closeMaintenance.isPending}
      />
    </div>
  );
}
