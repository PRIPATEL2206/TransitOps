"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { Trip, Vehicle, Driver } from "@/types";
import { PaginatedResponse } from "@/types/api";
import { mapVehicle } from "./use-vehicles";
import { mapDriver } from "./use-drivers";

export interface TripCreate {
  vehicle: number;
  driver: number;
  origin: string;
  destination: string;
  scheduled_departure: string;
  scheduled_arrival?: string;
  purpose?: string;
  passengers?: number;
  cargo_weight?: number;
  notes?: string;
  start_odometer?: number;
}

export interface TripUpdate extends Partial<TripCreate> {}

export interface TripQueryParams {
  page?: number;
  page_size?: number;
  status?: string;
  search?: string;
  ordering?: string;
  date_from?: string;
  date_to?: string;
  vehicle?: number;
  driver?: number;
}

export function mapTrip(backendTrip: any): Trip {
  if (!backendTrip) return {} as Trip;
  return {
    id: backendTrip.id,
    trip_number: backendTrip.trip_number,
    vehicle: backendTrip.vehicle_id,
    vehicle_details: backendTrip.vehicle ? mapVehicle(backendTrip.vehicle) : {} as Vehicle,
    driver: backendTrip.driver_id,
    driver_details: backendTrip.driver ? mapDriver(backendTrip.driver) : {} as Driver,
    origin: backendTrip.origin,
    destination: backendTrip.destination,
    scheduled_departure: backendTrip.scheduled_departure,
    actual_departure: backendTrip.actual_departure || null,
    scheduled_arrival: backendTrip.scheduled_arrival || null,
    actual_arrival: backendTrip.actual_arrival || null,
    status: backendTrip.status === "Scheduled" 
      ? "pending" 
      : backendTrip.status === "Dispatched" 
      ? "dispatched" 
      : backendTrip.status === "In Progress" 
      ? "in_progress" 
      : backendTrip.status === "Completed" 
      ? "completed" 
      : "cancelled",
    purpose: backendTrip.description || "",
    passengers: 0,
    cargo_weight: Number(backendTrip.cargo_weight_kg || 0),
    notes: backendTrip.description || "",
    start_odometer: Number(backendTrip.odometer_start_km || 0),
    end_odometer: Number(backendTrip.odometer_end_km || 0),
    distance_covered: Number(backendTrip.distance_km || 0),
    created_at: backendTrip.created_at || "",
    updated_at: backendTrip.updated_at || "",
  };
}

export function mapTripForBackend(frontendTrip: any): any {
  if (!frontendTrip) return {};
  return {
    vehicle_id: frontendTrip.vehicle,
    driver_id: frontendTrip.driver,
    trip_number: frontendTrip.trip_number || `TRIP-${Date.now()}`,
    origin: frontendTrip.origin,
    destination: frontendTrip.destination,
    scheduled_departure: frontendTrip.scheduled_departure,
    scheduled_arrival: frontendTrip.scheduled_arrival,
    description: frontendTrip.purpose || frontendTrip.notes || "",
    cargo_description: frontendTrip.purpose || "",
    cargo_weight_kg: frontendTrip.cargo_weight,
    status: frontendTrip.status === "pending" 
      ? "Scheduled" 
      : frontendTrip.status === "dispatched" 
      ? "Dispatched" 
      : frontendTrip.status === "in_progress" 
      ? "In Progress" 
      : frontendTrip.status === "completed" 
      ? "Completed" 
      : "Cancelled",
  };
}

export function useTrips(params?: TripQueryParams) {
  return useQuery({
    queryKey: ["trips", params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<any>>("/trips", {
        params,
      });
      return {
        ...data,
        items: (data.items || []).map(mapTrip),
      } as PaginatedResponse<Trip>;
    },
  });
}

export function useTrip(id: string | number) {
  return useQuery({
    queryKey: ["trips", String(id)],
    queryFn: async () => {
      const { data } = await apiClient.get<any>(`/trips/${id}`);
      return mapTrip(data);
    },
    enabled: !!id,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (trip: TripCreate) => {
      const { data } = await apiClient.post<any>("/trips", mapTripForBackend(trip));
      return mapTrip(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useUpdateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...update
    }: TripUpdate & { id: string | number }) => {
      const { data } = await apiClient.put<any>(
        `/trips/${id}`,
        mapTripForBackend(update)
      );
      return mapTrip(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useDispatchTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      const { data } = await apiClient.post<any>(
        `/trips/${id}/dispatch`
      );
      return mapTrip(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useCompleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      end_odometer,
      actual_arrival,
    }: {
      id: string | number;
      end_odometer?: number;
      actual_arrival?: string;
    }) => {
      const { data } = await apiClient.post<any>(
        `/trips/${id}/complete`,
        { end_odometer, actual_arrival }
      );
      return mapTrip(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useCancelTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      reason,
    }: {
      id: string | number;
      reason?: string;
    }) => {
      const { data } = await apiClient.post<any>(
        `/trips/${id}/cancel`,
        { reason }
      );
      return mapTrip(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}
