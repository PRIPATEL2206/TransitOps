"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/shared/data-table";
import { LicenseExpiryIndicator } from "@/components/drivers/license-expiry-indicator";
import { useDrivers } from "@/hooks/use-drivers";
import { Driver } from "@/types";
import { cn } from "@/lib/utils";

const DRIVER_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  inactive: {
    label: "Inactive",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
  on_leave: {
    label: "On Leave",
    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  suspended: {
    label: "Suspended",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

function SafetyScore({ score }: { score?: number }) {
  const value = score ?? 85;
  const color =
    value >= 80
      ? "text-green-600"
      : value >= 60
      ? "text-amber-600"
      : "text-red-600";

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full",
            value >= 80 ? "bg-green-500" : value >= 60 ? "bg-amber-500" : "bg-red-500"
          )}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={cn("text-xs font-medium tabular-nums", color)}>{value}</span>
    </div>
  );
}

export function DriverTable() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useDrivers({ page, page_size: 25 });

  const columns = [
    {
      key: "name",
      header: "Name",
      cell: (row: Driver) => (
        <Link
          href={`/drivers/${row.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.full_name}
        </Link>
      ),
    },
    {
      key: "license_number",
      header: "License #",
      cell: (row: Driver) => (
        <span className="font-mono text-sm">{row.license_number}</span>
      ),
    },
    {
      key: "license_type",
      header: "Class",
      cell: (row: Driver) => (
        <Badge variant="outline" className="font-mono text-xs">
          {row.license_type}
        </Badge>
      ),
    },
    {
      key: "license_expiry",
      header: "Expiry",
      cell: (row: Driver) => (
        <LicenseExpiryIndicator expiryDate={row.license_expiry} />
      ),
    },
    {
      key: "safety_score",
      header: "Safety Score",
      cell: () => <SafetyScore />,
    },
    {
      key: "status",
      header: "Status",
      cell: (row: Driver) => {
        const config = DRIVER_STATUS_CONFIG[row.status] ?? DRIVER_STATUS_CONFIG.inactive;
        return (
          <Badge variant="outline" className={config.className}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "",
      cell: (row: Driver) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/drivers/${row.id}/edit`} className="flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data?.items ?? []}
      isLoading={isLoading}
      totalCount={data?.count ?? 0}
      page={page}
      pageSize={25}
      onPageChange={setPage}
    />
  );
}
