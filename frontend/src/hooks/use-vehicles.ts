"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { Vehicle } from "@/types";
import { PaginatedResponse } from "@/types/api";

export interface VehicleCreate {
  registration_number: string;
  make: string;
  model: string;
  year: number;
  vehicle_type: string;
  status?: "available" | "in_use" | "maintenance" | "retired";
  capacity: number;
  mileage?: number;
  fuel_type: string;
  color?: string;
  chassis_number?: string;
  engine_number?: string;
  insurance_expiry?: string;
  road_tax_expiry?: string;
  notes?: string;
}

export interface VehicleUpdate extends Partial<VehicleCreate> {}

export interface VehicleQueryParams {
  page?: number;
  page_size?: number;
  status?: string;
  vehicle_type?: string;
  search?: string;
  ordering?: string;
}

export function mapVehicle(backendVehicle: any): Vehicle {
  if (!backendVehicle) return {} as Vehicle;
  return {
    id: backendVehicle.id,
    registration_number: backendVehicle.registration_number,
    make: backendVehicle.make,
    model: backendVehicle.model,
    year: backendVehicle.year,
    vehicle_type: backendVehicle.vehicle_type || (backendVehicle.max_capacity_kg > 3000 ? "truck" : "van"),
    status: backendVehicle.status?.toLowerCase() === "on trip" 
      ? "in_use" 
      : backendVehicle.status?.toLowerCase() === "in shop" 
      ? "maintenance" 
      : backendVehicle.status?.toLowerCase() || "available",
    capacity: Number(backendVehicle.max_capacity_kg || 0),
    mileage: Number(backendVehicle.odometer_km || 0),
    fuel_type: backendVehicle.fuel_type || "diesel",
    color: backendVehicle.color || "",
    chassis_number: backendVehicle.vin || "",
    engine_number: backendVehicle.engine_number || "",
    insurance_expiry: backendVehicle.insurance_expiry || "",
    road_tax_expiry: backendVehicle.road_tax_expiry || "",
    last_service_date: backendVehicle.last_service_date || null,
    next_service_date: backendVehicle.next_service_date || null,
    notes: backendVehicle.notes || "",
    created_at: backendVehicle.created_at || "",
    updated_at: backendVehicle.updated_at || "",
  };
}

export function mapVehicleForBackend(frontendVehicle: any): any {
  if (!frontendVehicle) return {};
  return {
    registration_number: frontendVehicle.registration_number,
    make: frontendVehicle.make,
    model: frontendVehicle.model,
    year: frontendVehicle.year,
    color: frontendVehicle.color,
    vin: frontendVehicle.chassis_number || frontendVehicle.vin,
    fuel_type: frontendVehicle.fuel_type || "Diesel",
    status: frontendVehicle.status === "in_use" 
      ? "On Trip" 
      : frontendVehicle.status === "maintenance" 
      ? "In Shop" 
      : frontendVehicle.status === "available" 
      ? "Available" 
      : frontendVehicle.status === "retired" 
      ? "Retired" 
      : "Available",
    max_capacity_kg: frontendVehicle.capacity,
    odometer_km: frontendVehicle.mileage,
    notes: frontendVehicle.notes,
  };
}

export function useVehicles(params?: VehicleQueryParams) {
  return useQuery({
    queryKey: ["vehicles", params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<any>>(
        "/vehicles",
        { params }
      );
      return {
        ...data,
        items: (data.items || []).map(mapVehicle),
      } as PaginatedResponse<Vehicle>;
    },
  });
}

export function useVehicle(id: string | number) {
  return useQuery({
    queryKey: ["vehicles", String(id)],
    queryFn: async () => {
      const { data } = await apiClient.get<any>(
        `/vehicles/${id}`
      );
      return mapVehicle(data);
    },
    enabled: !!id,
  });
}

export function useAvailableVehicles() {
  return useQuery({
    queryKey: ["vehicles", "available"],
    queryFn: async () => {
      const { data } = await apiClient.get<any[]>(
        "/vehicles/available"
      );
      return data.map(mapVehicle);
    },
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vehicle: VehicleCreate) => {
      const { data } = await apiClient.post<any>(
        "/vehicles",
        mapVehicleForBackend(vehicle)
      );
      return mapVehicle(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...update
    }: VehicleUpdate & { id: string | number }) => {
      const { data } = await apiClient.put<any>(
        `/vehicles/${id}`,
        mapVehicleForBackend(update)
      );
      return mapVehicle(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      await apiClient.delete(`/vehicles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}
