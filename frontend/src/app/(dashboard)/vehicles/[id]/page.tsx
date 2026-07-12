"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Pencil,
  Trash2,
  Wrench,
  Fuel,
  History,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { VehicleStatusBadge } from "@/components/vehicles/vehicle-status-badge";
import { useVehicle, useDeleteVehicle, useUpdateVehicle } from "@/hooks/use-vehicles";
import { useMaintenance } from "@/hooks/use-maintenance";
import { useFuelLogs } from "@/hooks/use-fuel-logs";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { format } from "date-fns";

function LabelValue({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value ?? "—"}</p>
    </div>
  );
}

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [showDelete, setShowDelete] = useState(false);
  const { data: vehicle, isLoading } = useVehicle(id);
  const { data: maintenanceData } = useMaintenance({ vehicle: id });
  const { data: fuelData } = useFuelLogs({ vehicle: id });
  const deleteVehicle = useDeleteVehicle();
  const updateVehicle = useUpdateVehicle();

  async function handleDelete() {
    try {
      await deleteVehicle.mutateAsync(id);
      toast({ title: "Vehicle deleted" });
      router.push("/vehicles");
    } catch {
      toast({ title: "Failed to delete vehicle", variant: "destructive" });
    }
  }

  async function handleRetire() {
    if (!vehicle) return;
    try {
      await updateVehicle.mutateAsync({ id: vehicle.id, status: "retired" });
      toast({ title: "Vehicle retired" });
    } catch {
      toast({ title: "Failed to retire vehicle", variant: "destructive" });
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Vehicle not found.{" "}
        <Link href="/vehicles" className="text-primary hover:underline">
          Back to vehicles
        </Link>
      </div>
    );
  }

  const maintenanceRecords = maintenanceData?.items ?? [];
  const fuelLogs = fuelData?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${vehicle.make} ${vehicle.model} (${vehicle.registration_number})`}
        description={`${vehicle.vehicle_type} • ${vehicle.year}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/vehicles">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/vehicles/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            {vehicle.status !== "retired" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetire}
                disabled={updateVehicle.isPending}
              >
                {updateVehicle.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Retire
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDelete(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        }
      />

      {/* Info Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Vehicle Information</CardTitle>
          <VehicleStatusBadge status={vehicle.status} />
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <LabelValue label="Registration #" value={vehicle.registration_number} />
          <LabelValue label="Make & Model" value={`${vehicle.make} ${vehicle.model}`} />
          <LabelValue label="Year" value={vehicle.year} />
          <LabelValue label="Type" value={vehicle.vehicle_type} />
          <LabelValue label="Fuel Type" value={vehicle.fuel_type} />
          <LabelValue label="Capacity" value={`${vehicle.capacity} kg`} />
          <LabelValue
            label="Odometer"
            value={vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : undefined}
          />
          <LabelValue label="Color" value={vehicle.color} />
          <LabelValue label="Chassis #" value={vehicle.chassis_number} />
          <LabelValue label="Engine #" value={vehicle.engine_number} />
          <LabelValue
            label="Insurance Expiry"
            value={
              vehicle.insurance_expiry
                ? format(new Date(vehicle.insurance_expiry), "dd MMM yyyy")
                : undefined
            }
          />
          <LabelValue
            label="Road Tax Expiry"
            value={
              vehicle.road_tax_expiry
                ? format(new Date(vehicle.road_tax_expiry), "dd MMM yyyy")
                : undefined
            }
          />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="maintenance">
        <TabsList>
          <TabsTrigger value="maintenance" className="gap-2">
            <Wrench className="h-4 w-4" />
            Maintenance ({maintenanceRecords.length})
          </TabsTrigger>
          <TabsTrigger value="fuel" className="gap-2">
            <Fuel className="h-4 w-4" />
            Fuel Logs ({fuelLogs.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="maintenance" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {maintenanceRecords.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">
                  No maintenance records found.
                </p>
              ) : (
                <div className="space-y-2">
                  {maintenanceRecords.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{r.maintenance_type}</p>
                        <p className="text-xs text-muted-foreground">{r.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">${r.cost?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(r.scheduled_date), "dd MMM yyyy")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fuel" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {fuelLogs.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">
                  No fuel logs found.
                </p>
              ) : (
                <div className="space-y-2">
                  {fuelLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {log.quantity}L @ ${log.unit_price}/L
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.fuel_station}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">${log.total_cost}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(log.date), "dd MMM yyyy")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">
                {vehicle.notes || "No notes recorded."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete Vehicle"
        description={`Permanently delete ${vehicle.registration_number}? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteVehicle.isPending}
      />
    </div>
  );
}
