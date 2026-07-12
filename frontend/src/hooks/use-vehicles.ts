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

export function useVehicles(params?: VehicleQueryParams) {
  return useQuery({
    queryKey: ["vehicles", params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Vehicle>>(
        "/vehicles",
        { params }
      );
      return data;
    },
  });
}

export function useVehicle(id: string | number) {
  return useQuery({
    queryKey: ["vehicles", String(id)],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Vehicle }>(
        `/vehicles/${id}`
      );
      return data.data as Vehicle;
    },
    enabled: !!id,
  });
}

export function useAvailableVehicles() {
  return useQuery({
    queryKey: ["vehicles", "available"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Vehicle[] }>(
        "/vehicles/available"
      );
      return data.data as Vehicle[];
    },
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vehicle: VehicleCreate) => {
      const { data } = await apiClient.post<{ data: Vehicle }>(
        "/vehicles",
        vehicle
      );
      return data.data;
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
      const { data } = await apiClient.put<{ data: Vehicle }>(
        `/vehicles/${id}`,
        update
      );
      return data.data;
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
