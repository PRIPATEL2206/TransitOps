"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { MaintenanceRecord } from "@/types";
import { PaginatedResponse } from "@/types/api";

export interface MaintenanceCreate {
  vehicle: number;
  maintenance_type: string;
  description: string;
  scheduled_date: string;
  cost?: number;
  vendor?: string;
  odometer_reading?: number;
  next_maintenance_date?: string;
  notes?: string;
}

export interface MaintenanceUpdate extends Partial<MaintenanceCreate> {
  status?: "scheduled" | "in_progress" | "completed" | "cancelled";
  completed_date?: string;
}

export interface MaintenanceQueryParams {
  page?: number;
  page_size?: number;
  status?: string;
  vehicle?: number;
  maintenance_type?: string;
  search?: string;
  ordering?: string;
  date_from?: string;
  date_to?: string;
}

export function useMaintenance(params?: MaintenanceQueryParams) {
  return useQuery({
    queryKey: ["maintenance", params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<MaintenanceRecord>>(
        "/maintenance",
        { params }
      );
      return data;
    },
  });
}

export function useMaintenanceRecord(id: string | number) {
  return useQuery({
    queryKey: ["maintenance", String(id)],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: MaintenanceRecord }>(
        `/maintenance/${id}`
      );
      return data.data as MaintenanceRecord;
    },
    enabled: !!id,
  });
}

export function useCreateMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (record: MaintenanceCreate) => {
      const { data } = await apiClient.post<{ data: MaintenanceRecord }>(
        "/maintenance",
        record
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
    },
  });
}

export function useUpdateMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...update
    }: MaintenanceUpdate & { id: string | number }) => {
      const { data } = await apiClient.put<{ data: MaintenanceRecord }>(
        `/maintenance/${id}`,
        update
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
    },
  });
}

export function useCloseMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      completed_date,
      cost,
      notes,
    }: {
      id: string | number;
      completed_date?: string;
      cost?: number;
      notes?: string;
    }) => {
      const { data } = await apiClient.post<{ data: MaintenanceRecord }>(
        `/maintenance/${id}/close`,
        { completed_date, cost, notes }
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
    },
  });
}

export function useDeleteMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      await apiClient.delete(`/maintenance/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
    },
  });
}
