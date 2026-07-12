"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { useCreateMaintenance } from "@/hooks/use-maintenance";
import { useVehicles } from "@/hooks/use-vehicles";
import { useToast } from "@/hooks/use-toast";
import { MAINTENANCE_TYPES } from "@/lib/constants";

const maintenanceSchema = z.object({
  vehicle: z.string().min(1, "Vehicle is required"),
  maintenance_type: z.string().min(1, "Type is required"),
  description: z.string().min(1, "Description is required"),
  scheduled_date: z.string().min(1, "Date is required"),
  cost: z.number({ invalid_type_error: "Cost must be a number" }).min(0).optional().or(z.literal(0)),
  vendor: z.string().optional(),
  odometer_reading: z.number().min(0).optional().or(z.literal(0)),
  notes: z.string().optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

export default function NewMaintenancePage() {
  const router = useRouter();
  const { toast } = useToast();
  const createMaintenance = useCreateMaintenance();

  // Only vehicles not currently on a trip
  const { data: vehiclesData } = useVehicles({ status: "available" });
  const { data: maintenanceVehicles } = useVehicles({ status: "maintenance" });
  const availableVehicles = [
    ...(vehiclesData?.results ?? []),
    ...(maintenanceVehicles?.results ?? []),
  ];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: { cost: 0 },
  });

  const watchedVehicle = watch("vehicle");
  const watchedType = watch("maintenance_type");

  async function onSubmit(data: MaintenanceFormData) {
    try {
      await createMaintenance.mutateAsync({
        ...data,
        vehicle: parseInt(data.vehicle),
      });
      toast({ title: "Maintenance record created" });
      router.push("/maintenance");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  }

  const isPending = isSubmitting || createMaintenance.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Maintenance Record"
        description="Schedule or log a vehicle maintenance"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>
                Vehicle <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watchedVehicle}
                onValueChange={(v) => setValue("vehicle", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {availableVehicles.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.registration_number} — {v.make} {v.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vehicle && (
                <p className="text-xs text-red-500">{errors.vehicle.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>
                Maintenance Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watchedType}
                onValueChange={(v) => setValue("maintenance_type", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {MAINTENANCE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.maintenance_type && (
                <p className="text-xs text-red-500">{errors.maintenance_type.message}</p>
              )}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the maintenance work..."
                rows={3}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-xs text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="scheduled_date">
                Scheduled Date <span className="text-red-500">*</span>
              </Label>
              <Input id="scheduled_date" type="date" {...register("scheduled_date")} />
              {errors.scheduled_date && (
                <p className="text-xs text-red-500">{errors.scheduled_date.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cost">Estimated Cost ($)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                {...register("cost", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vendor">Vendor / Workshop</Label>
              <Input id="vendor" placeholder="e.g. AutoFix Garage" {...register("vendor")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="odometer_reading">Odometer Reading (km)</Label>
              <Input
                id="odometer_reading"
                type="number"
                min="0"
                {...register("odometer_reading", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" placeholder="Additional notes..." {...register("notes")} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Record
          </Button>
        </div>
      </form>
    </div>
  );
}
