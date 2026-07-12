"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { FuelLog, Vehicle, Driver } from "@/types";
import { PaginatedResponse } from "@/types/api";
import { mapVehicle } from "./use-vehicles";
import { mapDriver } from "./use-drivers";

export interface FuelLogCreate {
  vehicle: number;
  driver?: number;
  date: string;
  fuel_type: string;
  quantity: number;
  unit_price: number;
  total_cost?: number;
  odometer_reading: number;
  fuel_station?: string;
  notes?: string;
}

export interface FuelLogUpdate extends Partial<FuelLogCreate> {}

export interface FuelLogQueryParams {
  page?: number;
  page_size?: number;
  vehicle?: number;
  driver?: number;
  fuel_type?: string;
  search?: string;
  ordering?: string;
  date_from?: string;
  date_to?: string;
}

export function mapFuelLog(backendLog: any): FuelLog {
  if (!backendLog) return {} as FuelLog;
  return {
    id: backendLog.id,
    vehicle: backendLog.vehicle_id,
    vehicle_details: backendLog.vehicle ? mapVehicle(backendLog.vehicle) : {} as Vehicle,
    driver: backendLog.driver_id || null,
    driver_details: backendLog.driver ? mapDriver(backendLog.driver) : null,
    date: backendLog.filled_at,
    fuel_type: backendLog.fuel_type || "diesel",
    quantity: Number(backendLog.quantity_liters || 0),
    unit_price: Number(backendLog.price_per_liter || 0),
    total_cost: Number(backendLog.total_cost || 0),
    odometer_reading: Number(backendLog.odometer_km || 0),
    fuel_station: backendLog.location || "",
    notes: backendLog.notes || "",
    created_at: backendLog.created_at || "",
    updated_at: backendLog.updated_at || "",
  };
}

export function mapFuelLogForBackend(frontendLog: any): any {
  if (!frontendLog) return {};
  return {
    vehicle_id: frontendLog.vehicle,
    driver_id: frontendLog.driver || undefined,
    filled_at: frontendLog.date,
    fuel_type: frontendLog.fuel_type || "Diesel",
    quantity_liters: frontendLog.quantity,
    price_per_liter: frontendLog.unit_price,
    total_cost: frontendLog.total_cost || Number((frontendLog.quantity * frontendLog.unit_price).toFixed(2)),
    odometer_km: frontendLog.odometer_reading,
    location: frontendLog.fuel_station || "",
    notes: frontendLog.notes || "",
  };
}

export function useFuelLogs(params?: FuelLogQueryParams) {
  return useQuery({
    queryKey: ["fuel-logs", params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<any>>(
        "/fuel-logs",
        { params }
      );
      return {
        ...data,
        items: (data.items || []).map(mapFuelLog),
      } as PaginatedResponse<FuelLog>;
    },
  });
}

export function useFuelLog(id: string | number) {
  return useQuery({
    queryKey: ["fuel-logs", String(id)],
    queryFn: async () => {
      const { data } = await apiClient.get<any>(
        `/fuel-logs/${id}`
      );
      return mapFuelLog(data);
    },
    enabled: !!id,
  });
}

export function useCreateFuelLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log: FuelLogCreate) => {
      const { data } = await apiClient.post<any>(
        "/fuel-logs",
        mapFuelLogForBackend(log)
      );
      return mapFuelLog(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel-logs"] });
    },
  });
}

export function useUpdateFuelLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...update
    }: FuelLogUpdate & { id: string | number }) => {
      const { data } = await apiClient.put<any>(
        `/fuel-logs/${id}`,
        mapFuelLogForBackend(update)
      );
      return mapFuelLog(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel-logs"] });
    },
  });
}

export function useDeleteFuelLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      await apiClient.delete(`/fuel-logs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel-logs"] });
    },
  });
}
