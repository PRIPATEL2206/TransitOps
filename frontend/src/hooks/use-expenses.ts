"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { Expense } from "@/types";
import { PaginatedResponse } from "@/types/api";

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

export interface ExpenseSummary {
  total_amount: number;
  by_category: Array<{ category: string; total: number; count: number }>;
  by_vehicle: Array<{ vehicle_id: number; registration: string; total: number }>;
  by_month: Array<{ month: string; total: number }>;
}

export function useExpenses(params?: ExpenseQueryParams) {
  return useQuery({
    queryKey: ["expenses", params],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Expense>>(
        "/expenses",
        { params }
      );
      return data;
    },
  });
}

export function useExpense(id: string | number) {
  return useQuery({
    queryKey: ["expenses", String(id)],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Expense }>(
        `/expenses/${id}`
      );
      return data.data as Expense;
    },
    enabled: !!id,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (expense: ExpenseCreate) => {
      const { data } = await apiClient.post<{ data: Expense }>(
        "/expenses",
        expense
      );
      return data.data;
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
      const { data } = await apiClient.put<{ data: Expense }>(
        `/expenses/${id}`,
        update
      );
      return data.data;
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
      const { data } = await apiClient.get<{ data: ExpenseSummary }>(
        "/expenses/summary",
        { params }
      );
      return data.data as ExpenseSummary;
    },
  });
}
