"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, PlusCircle, Fuel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { useFuelLogs, useCreateFuelLog } from "@/hooks/use-fuel-logs";
import { useVehicles } from "@/hooks/use-vehicles";
import { useDrivers } from "@/hooks/use-drivers";
import { useToast } from "@/hooks/use-toast";
import { FuelLog } from "@/types";
import { FUEL_TYPES } from "@/lib/constants";
import { format } from "date-fns";

const fuelLogSchema = z.object({
  vehicle: z.string().min(1, "Vehicle is required"),
  driver: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  fuel_type: z.string().min(1, "Fuel type is required"),
  quantity: z.number({ invalid_type_error: "Quantity required" }).positive("Must be > 0"),
  unit_price: z.number({ invalid_type_error: "Price required" }).positive("Must be > 0"),
  odometer_reading: z.number({ invalid_type_error: "Odometer required" }).min(0),
  fuel_station: z.string().optional(),
  notes: z.string().optional(),
});

type FuelLogFormData = z.infer<typeof fuelLogSchema>;

function FuelLogModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { toast } = useToast();
  const createFuelLog = useCreateFuelLog();
  const { data: vehiclesData } = useVehicles({ page_size: 100 });
  const { data: driversData } = useDrivers({ page_size: 100 });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FuelLogFormData>({
    resolver: zodResolver(fuelLogSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
    },
  });

  const watchedVehicle = watch("vehicle");
  const watchedFuelType = watch("fuel_type");
  const watchedDriver = watch("driver");
  const quantity = watch("quantity");
  const unitPrice = watch("unit_price");
  const totalCost = quantity && unitPrice ? (quantity * unitPrice).toFixed(2) : "—";

  async function onSubmit(data: FuelLogFormData) {
    try {
      await createFuelLog.mutateAsync({
        ...data,
        vehicle: parseInt(data.vehicle),
        driver: data.driver ? parseInt(data.driver) : undefined,
        total_cost: parseFloat(totalCost !== "—" ? totalCost : "0"),
      });
      toast({ title: "Fuel log created" });
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  }

  const isPending = isSubmitting || createFuelLog.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log Fuel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <Label>Vehicle <span className="text-red-500">*</span></Label>
              <Select
                value={watchedVehicle}
                onValueChange={(v) => setValue("vehicle", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {(vehiclesData?.items ?? []).map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.registration_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vehicle && <p className="text-xs text-red-500">{errors.vehicle.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Driver</Label>
              <Select
                value={watchedDriver}
                onValueChange={(v) => setValue("driver", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  {(driversData?.items ?? []).map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Fuel Type <span className="text-red-500">*</span></Label>
              <Select
                value={watchedFuelType}
                onValueChange={(v) => setValue("fuel_type", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {FUEL_TYPES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.fuel_type && <p className="text-xs text-red-500">{errors.fuel_type.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Date <span className="text-red-500">*</span></Label>
              <Input type="date" {...register("date")} />
              {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Quantity (L) <span className="text-red-500">*</span></Label>
              <Input type="number" step="0.1" {...register("quantity", { valueAsNumber: true })} />
              {errors.quantity && <p className="text-xs text-red-500">{errors.quantity.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Unit Price ($/L) <span className="text-red-500">*</span></Label>
              <Input type="number" step="0.01" {...register("unit_price", { valueAsNumber: true })} />
              {errors.unit_price && <p className="text-xs text-red-500">{errors.unit_price.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Total Cost</Label>
              <div className="h-9 px-3 flex items-center rounded-md border bg-muted text-sm font-medium">
                ${totalCost}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Odometer (km) <span className="text-red-500">*</span></Label>
              <Input type="number" {...register("odometer_reading", { valueAsNumber: true })} />
              {errors.odometer_reading && <p className="text-xs text-red-500">{errors.odometer_reading.message}</p>}
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label>Fuel Station</Label>
              <Input placeholder="e.g. Shell Westlands" {...register("fuel_station")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Log
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function FuelLogsPage() {
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const { data, isLoading } = useFuelLogs({ page, page_size: 25 });

  const columns = [
    {
      key: "date",
      header: "Date",
      cell: (row: FuelLog) => (
        <span className="text-sm">{format(new Date(row.date), "dd MMM yyyy")}</span>
      ),
    },
    {
      key: "vehicle",
      header: "Vehicle",
      cell: (row: FuelLog) => (
        <span className="font-mono text-sm">
          {row.vehicle_details?.registration_number ?? "—"}
        </span>
      ),
    },
    {
      key: "driver",
      header: "Driver",
      cell: (row: FuelLog) => (
        <span className="text-sm">{row.driver_details?.full_name ?? "—"}</span>
      ),
    },
    {
      key: "fuel_type",
      header: "Fuel",
      cell: (row: FuelLog) => (
        <span className="text-sm capitalize">{row.fuel_type}</span>
      ),
    },
    {
      key: "quantity",
      header: "Quantity",
      cell: (row: FuelLog) => (
        <span className="text-sm">{row.quantity} L</span>
      ),
    },
    {
      key: "unit_price",
      header: "Unit Price",
      cell: (row: FuelLog) => (
        <span className="text-sm text-muted-foreground">${row.unit_price}/L</span>
      ),
    },
    {
      key: "total_cost",
      header: "Total",
      cell: (row: FuelLog) => (
        <span className="text-sm font-medium">${row.total_cost?.toLocaleString()}</span>
      ),
    },
    {
      key: "odometer_reading",
      header: "Odometer",
      cell: (row: FuelLog) => (
        <span className="text-sm text-muted-foreground">
          {row.odometer_reading?.toLocaleString()} km
        </span>
      ),
    },
    {
      key: "fuel_station",
      header: "Station",
      cell: (row: FuelLog) => (
        <span className="text-sm text-muted-foreground">{row.fuel_station || "—"}</span>
      ),
    },
  ];

  const totalCost = (data?.items ?? []).reduce((sum, log) => sum + (log.total_cost ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fuel Logs"
        description="Track fuel consumption across the fleet"
        action={
          <Button onClick={() => setShowModal(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Log Fuel
          </Button>
        }
      />

      {data && data.items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Fuel className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Fuel Cost (page)</p>
                <p className="text-lg font-bold">${totalCost.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Fuel className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Volume (page)</p>
                <p className="text-lg font-bold">
                  {(data?.items ?? []).reduce((s, l) => s + (l.quantity ?? 0), 0).toFixed(0)} L
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Fuel className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Unit Price</p>
                <p className="text-lg font-bold">
                  $
                  {data.items.length > 0
                    ? (
                        data.items.reduce((s, l) => s + (l.unit_price ?? 0), 0) /
                        data.items.length
                      ).toFixed(2)
                    : "—"}
                  /L
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        totalCount={data?.count ?? 0}
        page={page}
        pageSize={25}
        onPageChange={setPage}
      />

      <FuelLogModal open={showModal} onOpenChange={setShowModal} />
    </div>
  );
}
