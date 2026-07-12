"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateVehicle, useUpdateVehicle } from "@/hooks/use-vehicles";
import { useToast } from "@/hooks/use-toast";
import { VEHICLE_TYPES, FUEL_TYPES } from "@/lib/constants";
import { Vehicle } from "@/types";

const vehicleSchema = z.object({
  registration_number: z
    .string()
    .min(1, "Registration number is required")
    .regex(/^[A-Z0-9-]{3,15}$/i, "Invalid registration format (e.g. AB-1234)"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z
    .number({ invalid_type_error: "Year must be a number" })
    .int()
    .min(1990, "Year must be 1990 or later")
    .max(new Date().getFullYear() + 1, "Invalid year"),
  vehicle_type: z.string().min(1, "Vehicle type is required"),
  fuel_type: z.string().min(1, "Fuel type is required"),
  capacity: z
    .number({ invalid_type_error: "Capacity must be a number" })
    .positive("Capacity must be positive"),
  mileage: z.number().min(0, "Odometer must be >= 0").optional().or(z.literal(0)),
  color: z.string().optional(),
  chassis_number: z.string().optional(),
  engine_number: z.string().optional(),
  insurance_expiry: z.string().optional(),
  road_tax_expiry: z.string().optional(),
  notes: z.string().optional(),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

interface VehicleFormProps {
  vehicle?: Vehicle;
}

export function VehicleForm({ vehicle }: VehicleFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();

  const isEditing = !!vehicle;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: vehicle
      ? {
          registration_number: vehicle.registration_number,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          vehicle_type: vehicle.vehicle_type,
          fuel_type: vehicle.fuel_type,
          capacity: vehicle.capacity,
          mileage: vehicle.mileage ?? 0,
          color: vehicle.color,
          chassis_number: vehicle.chassis_number,
          engine_number: vehicle.engine_number,
          insurance_expiry: vehicle.insurance_expiry,
          road_tax_expiry: vehicle.road_tax_expiry,
          notes: vehicle.notes,
        }
      : { mileage: 0, year: new Date().getFullYear() },
  });

  const watchedType = watch("vehicle_type");
  const watchedFuel = watch("fuel_type");

  async function onSubmit(data: VehicleFormData) {
    try {
      if (isEditing && vehicle) {
        await updateVehicle.mutateAsync({ id: vehicle.id, ...data });
        toast({ title: "Vehicle updated successfully" });
        router.push(`/vehicles/${vehicle.id}`);
      } else {
        const created = await createVehicle.mutateAsync(data);
        toast({ title: "Vehicle created successfully" });
        router.push(`/vehicles/${created.id}`);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An error occurred";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  }

  const isPending = isSubmitting || createVehicle.isPending || updateVehicle.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="registration_number">
              Registration Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="registration_number"
              placeholder="e.g. KCA-123A"
              {...register("registration_number")}
            />
            {errors.registration_number && (
              <p className="text-xs text-red-500">{errors.registration_number.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vehicle_type">
              Vehicle Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watchedType}
              onValueChange={(v) => setValue("vehicle_type", v, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.vehicle_type && (
              <p className="text-xs text-red-500">{errors.vehicle_type.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="make">
              Make <span className="text-red-500">*</span>
            </Label>
            <Input id="make" placeholder="e.g. Toyota" {...register("make")} />
            {errors.make && (
              <p className="text-xs text-red-500">{errors.make.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="model">
              Model <span className="text-red-500">*</span>
            </Label>
            <Input id="model" placeholder="e.g. Hilux" {...register("model")} />
            {errors.model && (
              <p className="text-xs text-red-500">{errors.model.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="year">
              Year <span className="text-red-500">*</span>
            </Label>
            <Input
              id="year"
              type="number"
              placeholder="e.g. 2022"
              {...register("year", { valueAsNumber: true })}
            />
            {errors.year && (
              <p className="text-xs text-red-500">{errors.year.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="color">Color</Label>
            <Input id="color" placeholder="e.g. White" {...register("color")} />
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Technical Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="fuel_type">
              Fuel Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watchedFuel}
              onValueChange={(v) => setValue("fuel_type", v, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select fuel type" />
              </SelectTrigger>
              <SelectContent>
                {FUEL_TYPES.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.fuel_type && (
              <p className="text-xs text-red-500">{errors.fuel_type.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="capacity">
              Load Capacity (kg) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="capacity"
              type="number"
              placeholder="e.g. 1000"
              {...register("capacity", { valueAsNumber: true })}
            />
            {errors.capacity && (
              <p className="text-xs text-red-500">{errors.capacity.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mileage">Current Odometer (km)</Label>
            <Input
              id="mileage"
              type="number"
              placeholder="e.g. 45000"
              {...register("mileage", { valueAsNumber: true })}
            />
            {errors.mileage && (
              <p className="text-xs text-red-500">{errors.mileage.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="chassis_number">Chassis Number</Label>
            <Input id="chassis_number" placeholder="VIN / Chassis #" {...register("chassis_number")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="engine_number">Engine Number</Label>
            <Input id="engine_number" {...register("engine_number")} />
          </div>
        </CardContent>
      </Card>

      {/* Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compliance & Documentation</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="insurance_expiry">Insurance Expiry</Label>
            <Input
              id="insurance_expiry"
              type="date"
              {...register("insurance_expiry")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="road_tax_expiry">Road Tax Expiry</Label>
            <Input
              id="road_tax_expiry"
              type="date"
              {...register("road_tax_expiry")}
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" placeholder="Additional notes..." {...register("notes")} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Update Vehicle" : "Create Vehicle"}
        </Button>
      </div>
    </form>
  );
}
