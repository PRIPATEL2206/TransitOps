"use client";

import { useState } from "react";
import Link from "next/link";
import { Navigation, CheckCircle, XCircle, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/shared/data-table";
import { TripStatusBadge } from "@/components/trips/trip-status-badge";
import { DispatchDialog } from "@/components/trips/dispatch-dialog";
import { CompleteDialog } from "@/components/trips/complete-dialog";
import { CancelDialog } from "@/components/trips/cancel-dialog";
import { useTrips } from "@/hooks/use-trips";
import { Trip } from "@/types";
import { format } from "date-fns";

interface TripTableProps {
  statusFilter?: string;
}

export function TripTable({ statusFilter }: TripTableProps) {
  const [page, setPage] = useState(1);
  const [dispatchTrip, setDispatchTrip] = useState<Trip | null>(null);
  const [completeTrip, setCompleteTrip] = useState<Trip | null>(null);
  const [cancelTrip, setCancelTrip] = useState<Trip | null>(null);

  const { data, isLoading } = useTrips({
    page,
    page_size: 25,
    ...(statusFilter && statusFilter !== "all" ? { status: statusFilter } : {}),
  });

  const columns = [
    {
      key: "trip_number",
      header: "Trip #",
      cell: (row: Trip) => (
        <Link
          href={`/trips/${row.id}`}
          className="font-mono text-sm text-primary hover:underline"
        >
          {row.trip_number}
        </Link>
      ),
    },
    {
      key: "route",
      header: "Route",
      cell: (row: Trip) => (
        <div className="text-sm">
          <span className="font-medium">{row.origin}</span>
          <span className="text-muted-foreground mx-1">→</span>
          <span className="font-medium">{row.destination}</span>
        </div>
      ),
    },
    {
      key: "vehicle",
      header: "Vehicle",
      cell: (row: Trip) => (
        <span className="text-sm font-mono">
          {row.vehicle_details?.registration_number ?? "—"}
        </span>
      ),
    },
    {
      key: "driver",
      header: "Driver",
      cell: (row: Trip) => (
        <span className="text-sm">{row.driver_details?.full_name ?? "—"}</span>
      ),
    },
    {
      key: "cargo_weight",
      header: "Cargo",
      cell: (row: Trip) => (
        <span className="text-sm text-muted-foreground">
          {row.cargo_weight != null ? `${row.cargo_weight} kg` : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row: Trip) => <TripStatusBadge status={row.status} />,
    },
    {
      key: "scheduled_departure",
      header: "Departure",
      cell: (row: Trip) => (
        <span className="text-sm text-muted-foreground">
          {row.scheduled_departure
            ? format(new Date(row.scheduled_departure), "dd MMM, HH:mm")
            : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (row: Trip) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/trips/${row.id}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {(row.status === "pending" || row.status === "dispatched") && (
              <DropdownMenuItem onClick={() => setDispatchTrip(row)}>
                <Navigation className="h-4 w-4 mr-2 text-blue-500" />
                Dispatch
              </DropdownMenuItem>
            )}
            {(row.status === "dispatched" || row.status === "in_progress") && (
              <DropdownMenuItem onClick={() => setCompleteTrip(row)}>
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                Complete
              </DropdownMenuItem>
            )}
            {row.status !== "completed" && row.status !== "cancelled" && (
              <DropdownMenuItem
                onClick={() => setCancelTrip(row)}
                className="text-red-600 focus:text-red-600"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

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

      {dispatchTrip && (
        <DispatchDialog
          trip={dispatchTrip}
          open={!!dispatchTrip}
          onOpenChange={(open) => !open && setDispatchTrip(null)}
        />
      )}
      {completeTrip && (
        <CompleteDialog
          trip={completeTrip}
          open={!!completeTrip}
          onOpenChange={(open) => !open && setCompleteTrip(null)}
        />
      )}
      {cancelTrip && (
        <CancelDialog
          trip={cancelTrip}
          open={!!cancelTrip}
          onOpenChange={(open) => !open && setCancelTrip(null)}
        />
      )}
    </>
  );
}
