"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { FuelLog } from "@/types";
import { PaginatedResponse } from "@/types/api";

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

export function useFuelLogs(params?: FuelLogQueryParams) {
  return useQuery({
    queryKey: ["fuel-logs", params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<FuelLog>>(
        "/fuel-logs",
        { params }
      );
      return data;
    },
  });
}

export function useFuelLog(id: string | number) {
  return useQuery({
    queryKey: ["fuel-logs", String(id)],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: FuelLog }>(
        `/fuel-logs/${id}`
      );
      return data.data as FuelLog;
    },
    enabled: !!id,
  });
}

export function useCreateFuelLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log: FuelLogCreate) => {
      // Auto-calculate total_cost if not provided
      const payload: FuelLogCreate = {
        ...log,
        total_cost:
          log.total_cost ?? parseFloat((log.quantity * log.unit_price).toFixed(2)),
      };
      const { data } = await apiClient.post<{ data: FuelLog }>(
        "/fuel-logs",
        payload
      );
      return data.data;
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
      const { data } = await apiClient.put<{ data: FuelLog }>(
        `/fuel-logs/${id}`,
        update
      );
      return data.data;
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
