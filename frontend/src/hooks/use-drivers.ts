"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { Driver } from "@/types";
import { PaginatedResponse } from "@/types/api";

export interface DriverCreate {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  license_number: string;
  license_type: string;
  license_expiry: string;
  status?: "active" | "inactive" | "on_leave" | "suspended";
  date_of_birth?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  date_joined?: string;
  notes?: string;
}

export interface DriverUpdate extends Partial<DriverCreate> {}

export interface DriverQueryParams {
  page?: number;
  page_size?: number;
  status?: string;
  search?: string;
  ordering?: string;
}

export function mapDriver(backendDriver: any): Driver {
  if (!backendDriver) return {} as Driver;
  return {
    id: backendDriver.id,
    employee_id: backendDriver.employee_id || backendDriver.id,
    first_name: backendDriver.first_name,
    last_name: backendDriver.last_name,
    full_name: `${backendDriver.first_name} ${backendDriver.last_name}`,
    email: backendDriver.email || "",
    phone: backendDriver.phone || "",
    license_number: backendDriver.license_number,
    license_type: backendDriver.license_class || "Class B",
    license_expiry: backendDriver.license_expiry_date || "",
    status: backendDriver.status === "Available" || backendDriver.status === "On Trip" 
      ? "active" 
      : backendDriver.status === "Suspended" 
      ? "suspended" 
      : "inactive",
    date_of_birth: backendDriver.date_of_birth || "",
    address: backendDriver.address || "",
    emergency_contact_name: backendDriver.emergency_contact_name || "",
    emergency_contact_phone: backendDriver.emergency_contact_phone || "",
    date_joined: backendDriver.created_at || "",
    notes: backendDriver.notes || "",
    created_at: backendDriver.created_at || "",
    updated_at: backendDriver.updated_at || "",
  };
}

export function mapDriverForBackend(frontendDriver: any): any {
  if (!frontendDriver) return {};
  return {
    first_name: frontendDriver.first_name,
    last_name: frontendDriver.last_name,
    email: frontendDriver.email,
    phone: frontendDriver.phone,
    license_number: frontendDriver.license_number,
    license_class: frontendDriver.license_type || "Class B",
    license_expiry_date: frontendDriver.license_expiry,
    status: frontendDriver.status === "active" 
      ? "Available" 
      : frontendDriver.status === "suspended" 
      ? "Suspended" 
      : "Inactive",
    notes: frontendDriver.notes,
  };
}

export function useDrivers(params?: DriverQueryParams) {
  return useQuery({
    queryKey: ["drivers", params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<any>>(
        "/drivers",
        { params }
      );
      return {
        ...data,
        items: (data.items || []).map(mapDriver),
      } as PaginatedResponse<Driver>;
    },
  });
}

export function useDriver(id: string | number) {
  return useQuery({
    queryKey: ["drivers", String(id)],
    queryFn: async () => {
      const { data } = await apiClient.get<any>(`/drivers/${id}`);
      return mapDriver(data);
    },
    enabled: !!id,
  });
}

export function useAvailableDrivers() {
  return useQuery({
    queryKey: ["drivers", "available"],
    queryFn: async () => {
      const { data } = await apiClient.get<any[]>(
        "/drivers/available"
      );
      return data.map(mapDriver);
    },
  });
}

export function useCreateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (driver: DriverCreate) => {
      const { data } = await apiClient.post<any>(
        "/drivers",
        mapDriverForBackend(driver)
      );
      return mapDriver(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
}

export function useUpdateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...update
    }: DriverUpdate & { id: string | number }) => {
      const { data } = await apiClient.put<any>(
        `/drivers/${id}`,
        mapDriverForBackend(update)
      );
      return mapDriver(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
}

export function useDeleteDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      await apiClient.delete(`/drivers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
}
