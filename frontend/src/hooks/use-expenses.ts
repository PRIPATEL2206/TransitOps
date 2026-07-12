"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { Expense, Vehicle, Driver, Trip } from "@/types";
import { PaginatedResponse } from "@/types/api";
import { mapVehicle } from "./use-vehicles";
import { mapDriver } from "./use-drivers";
import { mapTrip } from "./use-trips";

export interface ExpenseCreate {
  vehicle?: number;
  driver?: number;
  trip?: number;
  expense_type: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
  receipt_number?: string;
  vendor?: string;
  payment_method?: string;
  approved?: boolean;
  notes?: string;
}

export interface ExpenseUpdate extends Partial<ExpenseCreate> {}

export interface ExpenseQueryParams {
  page?: number;
  page_size?: number;
  vehicle?: number;
  driver?: number;
  trip?: number;
  category?: string;
  expense_type?: string;
  approved?: boolean;
  search?: string;
  ordering?: string;
  date_from?: string;
  date_to?: string;
}

export interface ExpenseSummaryItem {
  category: string;
  total: number;
}
export type ExpenseSummary = ExpenseSummaryItem[];

export function mapExpense(backendExpense: any): Expense {
  if (!backendExpense) return {} as Expense;
  return {
    id: backendExpense.id,
    vehicle: backendExpense.vehicle_id || null,
    vehicle_details: backendExpense.vehicle ? mapVehicle(backendExpense.vehicle) : null,
    driver: backendExpense.driver_id || null,
    driver_details: backendExpense.driver ? mapDriver(backendExpense.driver) : null,
    trip: backendExpense.trip_id || null,
    trip_details: backendExpense.trip ? mapTrip(backendExpense.trip) : null,
    expense_type: backendExpense.category || "other",
    category: backendExpense.category || "other",
    amount: Number(backendExpense.amount || 0),
    date: backendExpense.incurred_at,
    description: backendExpense.description || "",
    receipt_number: backendExpense.receipt_reference || "",
    vendor: backendExpense.vendor || "",
    payment_method: backendExpense.payment_method || "",
    approved: backendExpense.status === "Approved",
    approved_by: backendExpense.approved_by || null,
    notes: backendExpense.notes || "",
    created_at: backendExpense.created_at || "",
    updated_at: backendExpense.updated_at || "",
  };
}

export function mapExpenseForBackend(frontendExpense: any): any {
  if (!frontendExpense) return {};
  return {
    vehicle_id: frontendExpense.vehicle || undefined,
    driver_id: frontendExpense.driver || undefined,
    trip_id: frontendExpense.trip || undefined,
    category: (frontendExpense.category || frontendExpense.expense_type || "OTHER").toUpperCase(),
    amount: frontendExpense.amount,
    currency: "USD",
    description: frontendExpense.description || "",
    receipt_reference: frontendExpense.receipt_number || "",
    status: frontendExpense.approved ? "Approved" : "Pending",
    incurred_at: frontendExpense.date,
    notes: frontendExpense.notes || "",
  };
}

export function useExpenses(params?: ExpenseQueryParams) {
  return useQuery({
    queryKey: ["expenses", params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<any>>(
        "/expenses",
        { params }
      );
      return {
        ...data,
        items: (data.items || []).map(mapExpense),
      } as PaginatedResponse<Expense>;
    },
  });
}

export function useExpense(id: string | number) {
  return useQuery({
    queryKey: ["expenses", String(id)],
    queryFn: async () => {
      const { data } = await apiClient.get<any>(
        `/expenses/${id}`
      );
      return mapExpense(data);
    },
    enabled: !!id,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (expense: ExpenseCreate) => {
      const { data } = await apiClient.post<any>(
        "/expenses",
        mapExpenseForBackend(expense)
      );
      return mapExpense(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...update
    }: ExpenseUpdate & { id: string | number }) => {
      const { data } = await apiClient.put<any>(
        `/expenses/${id}`,
        mapExpenseForBackend(update)
      );
      return mapExpense(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      await apiClient.delete(`/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useExpenseSummary(params?: {
  date_from?: string;
  date_to?: string;
  vehicle?: number;
}) {
  return useQuery({
    queryKey: ["expenses", "summary", params],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        by_category: Record<string, number>;
      }>(
        "/expenses/summary",
        { params }
      );
      if (data && data.by_category) {
        return Object.entries(data.by_category).map(([category, total]) => ({
          category,
          total: Number(total),
        }));
      }
      return [];
    },
  });
}
