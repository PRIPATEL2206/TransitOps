"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { DashboardStats } from "@/types";

export interface FleetUtilizationData {
  date: string;
  utilization_rate: number;
  active_vehicles: number;
  total_vehicles: number;
}

export interface FuelEfficiencyData {
  vehicle_id: number;
  registration_number: string;
  make: string;
  model: string;
  avg_fuel_efficiency: number;
  total_distance: number;
  total_fuel_consumed: number;
  total_fuel_cost: number;
}

export interface VehicleROIData {
  vehicle_id: number;
  registration_number: string;
  make: string;
  model: string;
  total_trips: number;
  total_distance: number;
  total_maintenance_cost: number;
  total_fuel_cost: number;
  total_cost: number;
  cost_per_km: number;
}

export interface DashboardKPIParams {
  date_from?: string;
  date_to?: string;
}

export interface FleetUtilizationParams {
  period?: "daily" | "weekly" | "monthly";
  days?: number;
}

export interface FuelEfficiencyParams {
  date_from?: string;
  date_to?: string;
  vehicle?: number;
}

export interface VehicleROIParams {
  date_from?: string;
  date_to?: string;
}

export function useDashboardKPIs(params?: DashboardKPIParams) {
  return useQuery({
    queryKey: ["analytics", "dashboard", params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: DashboardStats }>(
        "/analytics/dashboard",
        { params }
      );
      return data.data as DashboardStats;
    },
    staleTime: 30_000, // 30 seconds — dashboard data refreshes frequently
    refetchInterval: 60_000, // auto-refresh every 60 seconds
  });
}

export function useFleetUtilization(params?: FleetUtilizationParams) {
  return useQuery({
    queryKey: ["analytics", "fleet-utilization", params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: FleetUtilizationData[] }>(
        "/analytics/fleet-utilization",
        { params }
      );
      return data.data as FleetUtilizationData[];
    },
    staleTime: 60_000,
  });
}

export function useFuelEfficiency(params?: FuelEfficiencyParams) {
  return useQuery({
    queryKey: ["analytics", "fuel-efficiency", params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: FuelEfficiencyData[] }>(
        "/analytics/fuel-efficiency",
        { params }
      );
      return data.data as FuelEfficiencyData[];
    },
    staleTime: 60_000,
  });
}

export function useVehicleROI(params?: VehicleROIParams) {
  return useQuery({
    queryKey: ["analytics", "vehicle-roi", params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: VehicleROIData[] }>(
        "/analytics/vehicle-roi",
        { params }
      );
      return data.data as VehicleROIData[];
    },
    staleTime: 60_000,
  });
}
