"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { MaintenanceRecord, Vehicle } from "@/types";
import { PaginatedResponse } from "@/types/api";
import { mapVehicle } from "./use-vehicles";

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

export function mapMaintenance(backendMaintenance: any): MaintenanceRecord {
  if (!backendMaintenance) return {} as MaintenanceRecord;
  return {
    id: backendMaintenance.id,
    vehicle: backendMaintenance.vehicle_id,
    vehicle_details: backendMaintenance.vehicle ? mapVehicle(backendMaintenance.vehicle) : {} as Vehicle,
    maintenance_type: backendMaintenance.maintenance_type || "scheduled",
    description: backendMaintenance.description || "",
    status: backendMaintenance.status === "Scheduled" 
      ? "scheduled" 
      : backendMaintenance.status === "In Progress" 
      ? "in_progress" 
      : backendMaintenance.status === "Closed" 
      ? "completed" 
      : "cancelled",
    cost: Number(backendMaintenance.actual_cost || backendMaintenance.estimated_cost || 0),
    scheduled_date: backendMaintenance.scheduled_date,
    completed_date: backendMaintenance.completed_at || null,
    vendor: backendMaintenance.performed_by || "",
    odometer_reading: Number(backendMaintenance.odometer_at_service_km || 0),
    next_maintenance_date: null,
    notes: backendMaintenance.resolution_notes || "",
    created_at: backendMaintenance.created_at || "",
    updated_at: backendMaintenance.updated_at || "",
  };
}

export function mapMaintenanceForBackend(frontendMaintenance: any): any {
  if (!frontendMaintenance) return {};
  return {
    vehicle_id: frontendMaintenance.vehicle,
    maintenance_type: frontendMaintenance.maintenance_type,
    description: frontendMaintenance.description || "",
    status: frontendMaintenance.status === "scheduled" 
      ? "Scheduled" 
      : frontendMaintenance.status === "in_progress" 
      ? "In Progress" 
      : frontendMaintenance.status === "completed" 
      ? "Closed" 
      : "Cancelled",
    estimated_cost: frontendMaintenance.cost,
    actual_cost: frontendMaintenance.status === "completed" ? frontendMaintenance.cost : undefined,
    scheduled_date: frontendMaintenance.scheduled_date,
    completed_at: frontendMaintenance.completed_date || undefined,
    resolution_notes: frontendMaintenance.notes || "",
  };
}

export function useMaintenance(params?: MaintenanceQueryParams) {
  return useQuery({
    queryKey: ["maintenance", params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<any>>(
        "/maintenance",
        { params }
      );
      return {
        ...data,
        items: (data.items || []).map(mapMaintenance),
      } as PaginatedResponse<MaintenanceRecord>;
    },
  });
}

export function useMaintenanceRecord(id: string | number) {
  return useQuery({
    queryKey: ["maintenance", String(id)],
    queryFn: async () => {
      const { data } = await apiClient.get<any>(
        `/maintenance/${id}`
      );
      return mapMaintenance(data);
    },
    enabled: !!id,
  });
}

export function useCreateMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (record: MaintenanceCreate) => {
      const { data } = await apiClient.post<any>(
        "/maintenance",
        mapMaintenanceForBackend(record)
      );
      return mapMaintenance(data);
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
      const { data } = await apiClient.put<any>(
        `/maintenance/${id}`,
        mapMaintenanceForBackend(update)
      );
      return mapMaintenance(data);
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
      const { data } = await apiClient.post<any>(
        `/maintenance/${id}/close`,
        { completed_date, cost, notes }
      );
      return mapMaintenance(data);
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
