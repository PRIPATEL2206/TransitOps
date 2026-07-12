"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { VehicleStatusBadge } from "@/components/vehicles/vehicle-status-badge";
import { useVehicles, useDeleteVehicle } from "@/hooks/use-vehicles";
import { useToast } from "@/hooks/use-toast";
import { Vehicle } from "@/types";

interface VehicleTableProps {
  statusFilter?: string;
}

export function VehicleTable({ statusFilter }: VehicleTableProps) {
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const { toast } = useToast();
  const deleteVehicle = useDeleteVehicle();

  const { data, isLoading } = useVehicles({
    page,
    page_size: 25,
    ...(statusFilter && statusFilter !== "all" ? { status: statusFilter } : {}),
  });

  const columns = [
    {
      key: "registration_number",
      header: "Reg. Number",
      cell: (row: Vehicle) => (
        <Link
          href={`/vehicles/${row.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.registration_number}
        </Link>
      ),
    },
    {
      key: "name",
      header: "Vehicle",
      cell: (row: Vehicle) => (
        <span className="text-sm">
          {row.make} {row.model} ({row.year})
        </span>
      ),
    },
    {
      key: "vehicle_type",
      header: "Type",
      cell: (row: Vehicle) => (
        <span className="text-sm capitalize">{row.vehicle_type}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row: Vehicle) => <VehicleStatusBadge status={row.status} />,
    },
    {
      key: "capacity",
      header: "Capacity",
      cell: (row: Vehicle) => (
        <span className="text-sm text-muted-foreground">
          {row.capacity.toLocaleString()} kg
        </span>
      ),
    },
    {
      key: "mileage",
      header: "Odometer",
      cell: (row: Vehicle) => (
        <span className="text-sm text-muted-foreground">
          {row.mileage?.toLocaleString() ?? "—"} km
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (row: Vehicle) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/vehicles/${row.id}/edit`} className="flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => setDeleteTarget(row)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteVehicle.mutateAsync(deleteTarget.id);
      toast({ title: "Vehicle deleted" });
    } catch {
      toast({ title: "Failed to delete vehicle", variant: "destructive" });
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <>
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
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Vehicle"
        description={`Are you sure you want to delete ${deleteTarget?.registration_number}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteVehicle.isPending}
      />
    </>
  );
}
