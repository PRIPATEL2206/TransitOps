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

export function useDrivers(params?: DriverQueryParams) {
  return useQuery({
    queryKey: ["drivers", params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Driver>>(
        "/drivers",
        { params }
      );
      return data;
    },
  });
}

export function useDriver(id: string | number) {
  return useQuery({
    queryKey: ["drivers", String(id)],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Driver }>(`/drivers/${id}`);
      return data.data as Driver;
    },
    enabled: !!id,
  });
}

export function useAvailableDrivers() {
  return useQuery({
    queryKey: ["drivers", "available"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Driver[] }>(
        "/drivers/available"
      );
      return data.data as Driver[];
    },
  });
}

export function useCreateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (driver: DriverCreate) => {
      const { data } = await apiClient.post<{ data: Driver }>(
        "/drivers",
        driver
      );
      return data.data;
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
      const { data } = await apiClient.put<{ data: Driver }>(
        `/drivers/${id}`,
        update
      );
      return data.data;
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
