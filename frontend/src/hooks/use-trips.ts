"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { Trip } from "@/types";
import { PaginatedResponse } from "@/types/api";

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

export function useTrips(params?: TripQueryParams) {
  return useQuery({
    queryKey: ["trips", params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Trip>>("/trips", {
        params,
      });
      return data;
    },
  });
}

export function useTrip(id: string | number) {
  return useQuery({
    queryKey: ["trips", String(id)],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Trip }>(`/trips/${id}`);
      return data.data as Trip;
    },
    enabled: !!id,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (trip: TripCreate) => {
      const { data } = await apiClient.post<{ data: Trip }>("/trips", trip);
      return data.data;
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
      const { data } = await apiClient.put<{ data: Trip }>(
        `/trips/${id}`,
        update
      );
      return data.data;
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
      const { data } = await apiClient.post<{ data: Trip }>(
        `/trips/${id}/dispatch`
      );
      return data.data;
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
      const { data } = await apiClient.post<{ data: Trip }>(
        `/trips/${id}/complete`,
        { end_odometer, actual_arrival }
      );
      return data.data;
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
      const { data } = await apiClient.post<{ data: Trip }>(
        `/trips/${id}/cancel`,
        { reason }
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}
