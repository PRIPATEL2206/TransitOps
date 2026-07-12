"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { useCreateTrip } from "@/hooks/use-trips";
import { useAvailableVehicles } from "@/hooks/use-vehicles";
import { useAvailableDrivers } from "@/hooks/use-drivers";
import { useToast } from "@/hooks/use-toast";

const tripSchema = z
  .object({
    origin: z.string().min(1, "Source is required"),
    destination: z.string().min(1, "Destination is required"),
    vehicle: z.string().min(1, "Vehicle is required"),
    driver: z.string().min(1, "Driver is required"),
    cargo_weight: z
      .number({ invalid_type_error: "Must be a number" })
      .min(0, "Cargo weight must be >= 0")
      .optional()
      .or(z.literal(0)),
    passengers: z
      .number({ invalid_type_error: "Must be a number" })
      .int()
      .min(0)
      .optional()
      .or(z.literal(0)),
    scheduled_departure: z.string().min(1, "Departure time is required"),
    purpose: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.origin !== data.destination, {
    message: "Destination must differ from source",
    path: ["destination"],
  });

type TripFormData = z.infer<typeof tripSchema>;

export function TripForm() {
  const router = useRouter();
  const { toast } = useToast();
  const createTrip = useCreateTrip();
  const { data: availableVehicles, isLoading: vehiclesLoading } = useAvailableVehicles();
  const { data: availableDrivers, isLoading: driversLoading } = useAvailableDrivers();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: { cargo_weight: 0, passengers: 0 },
  });

  const watchedVehicle = watch("vehicle");
  const watchedCargo = watch("cargo_weight");

  const selectedVehicle = availableVehicles?.find(
    (v) => String(v.id) === watchedVehicle
  );

  const cargoExceeded =
    selectedVehicle &&
    watchedCargo !== undefined &&
    watchedCargo > selectedVehicle.capacity;

  async function onSubmit(data: TripFormData) {
    try {
      const payload = {
        ...data,
        vehicle: parseInt(data.vehicle),
        driver: parseInt(data.driver),
      };
      const created = await createTrip.mutateAsync(payload);
      toast({ title: "Trip created successfully" });
      router.push(`/trips/${created.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  }

  const isPending = isSubmitting || createTrip.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Route Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="origin">
              Source / Origin <span className="text-red-500">*</span>
            </Label>
            <Input id="origin" placeholder="e.g. Nairobi CBD" {...register("origin")} />
            {errors.origin && (
              <p className="text-xs text-red-500">{errors.origin.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="destination">
              Destination <span className="text-red-500">*</span>
            </Label>
            <Input
              id="destination"
              placeholder="e.g. Mombasa Port"
              {...register("destination")}
            />
            {errors.destination && (
              <p className="text-xs text-red-500">{errors.destination.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="scheduled_departure">
              Scheduled Departure <span className="text-red-500">*</span>
            </Label>
            <Input
              id="scheduled_departure"
              type="datetime-local"
              {...register("scheduled_departure")}
            />
            {errors.scheduled_departure && (
              <p className="text-xs text-red-500">{errors.scheduled_departure.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="purpose">Purpose</Label>
            <Input id="purpose" placeholder="e.g. Cargo delivery" {...register("purpose")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vehicle & Driver</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>
              Vehicle <span className="text-red-500">*</span>
            </Label>
            <Select
              onValueChange={(v) => setValue("vehicle", v, { shouldValidate: true })}
              disabled={vehiclesLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={vehiclesLoading ? "Loading vehicles..." : "Select vehicle"}
                />
              </SelectTrigger>
              <SelectContent>
                {(availableVehicles ?? []).map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>
                    {v.registration_number} — {v.make} {v.model} ({v.capacity} kg)
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
              Driver <span className="text-red-500">*</span>
            </Label>
            <Select
              onValueChange={(v) => setValue("driver", v, { shouldValidate: true })}
              disabled={driversLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={driversLoading ? "Loading drivers..." : "Select driver"}
                />
              </SelectTrigger>
              <SelectContent>
                {(availableDrivers ?? []).map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.full_name} — {d.license_type} ({d.license_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.driver && (
              <p className="text-xs text-red-500">{errors.driver.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cargo & Passengers</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="cargo_weight">Cargo Weight (kg)</Label>
            <Input
              id="cargo_weight"
              type="number"
              step="0.1"
              min="0"
              {...register("cargo_weight", { valueAsNumber: true })}
            />
            {selectedVehicle && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      cargoExceeded ? "bg-red-500" : "bg-primary"
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        ((watchedCargo ?? 0) / selectedVehicle.capacity) * 100
                      )}%`,
                    }}
                  />
                </div>
                <Badge
                  variant={cargoExceeded ? "destructive" : "secondary"}
                  className="text-xs whitespace-nowrap"
                >
                  {watchedCargo ?? 0} / {selectedVehicle.capacity} kg
                </Badge>
              </div>
            )}
            {errors.cargo_weight && (
              <p className="text-xs text-red-500">{errors.cargo_weight.message}</p>
            )}
            {cargoExceeded && (
              <p className="text-xs text-red-500">Exceeds vehicle capacity!</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="passengers">Passengers</Label>
            <Input
              id="passengers"
              type="number"
              min="0"
              {...register("passengers", { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" placeholder="Trip notes..." {...register("notes")} />
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
        <Button type="submit" disabled={isPending || !!cargoExceeded}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Trip
        </Button>
      </div>
    </form>
  );
}
