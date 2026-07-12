"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, PlusCircle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { useExpenses, useCreateExpense, useExpenseSummary } from "@/hooks/use-expenses";
import { useVehicles } from "@/hooks/use-vehicles";
import { useDrivers } from "@/hooks/use-drivers";
import { useToast } from "@/hooks/use-toast";
import { Expense } from "@/types";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/lib/constants";
import { format } from "date-fns";

const expenseSchema = z.object({
  expense_type: z.string().min(1, "Type is required"),
  category: z.string().min(1, "Category is required"),
  amount: z.number({ invalid_type_error: "Amount required" }).positive("Must be > 0"),
  date: z.string().min(1, "Date is required"),
  description: z.string().min(1, "Description is required"),
  vehicle: z.string().optional(),
  driver: z.string().optional(),
  vendor: z.string().optional(),
  receipt_number: z.string().optional(),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const CATEGORY_COLORS: Record<string, string> = {
  fuel: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  maintenance: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  insurance: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  road_tax: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  tolls: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  parking: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  driver_allowance: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  repair: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  other: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

function CreateExpenseModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { toast } = useToast();
  const createExpense = useCreateExpense();
  const { data: vehiclesData } = useVehicles({ page_size: 100 });
  const { data: driversData } = useDrivers({ page_size: 100 });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
    },
  });

  const watchedCategory = watch("category");
  const watchedVehicle = watch("vehicle");
  const watchedDriver = watch("driver");
  const watchedPayment = watch("payment_method");

  async function onSubmit(data: ExpenseFormData) {
    try {
      await createExpense.mutateAsync({
        ...data,
        vehicle: data.vehicle ? parseInt(data.vehicle) : undefined,
        driver: data.driver ? parseInt(data.driver) : undefined,
      });
      toast({ title: "Expense recorded" });
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  }

  const isPending = isSubmitting || createExpense.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category <span className="text-red-500">*</span></Label>
              <Select
                value={watchedCategory}
                onValueChange={(v) => setValue("category", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Expense Type <span className="text-red-500">*</span></Label>
              <Input placeholder="e.g. Monthly premium" {...register("expense_type")} />
              {errors.expense_type && <p className="text-xs text-red-500">{errors.expense_type.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Amount ($) <span className="text-red-500">*</span></Label>
              <Input type="number" step="0.01" {...register("amount", { valueAsNumber: true })} />
              {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Date <span className="text-red-500">*</span></Label>
              <Input type="date" {...register("date")} />
              {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label>Description <span className="text-red-500">*</span></Label>
              <Textarea rows={2} {...register("description")} />
              {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Vehicle</Label>
              <Select
                value={watchedVehicle}
                onValueChange={(v) => setValue("vehicle", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {(vehiclesData?.results ?? []).map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.registration_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Driver</Label>
              <Select
                value={watchedDriver}
                onValueChange={(v) => setValue("driver", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {(driversData?.results ?? []).map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select
                value={watchedPayment}
                onValueChange={(v) => setValue("payment_method", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((pm) => (
                    <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Receipt #</Label>
              <Input {...register("receipt_number")} />
            </div>

            <div className="space-y-1.5">
              <Label>Vendor</Label>
              <Input {...register("vendor")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ExpensesPage() {
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const { data, isLoading } = useExpenses({ page, page_size: 25 });
  const { data: summary } = useExpenseSummary();

  const columns = [
    {
      key: "date",
      header: "Date",
      cell: (row: Expense) => (
        <span className="text-sm">{format(new Date(row.date), "dd MMM yyyy")}</span>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (row: Expense) => (
        <Badge variant="outline" className={CATEGORY_COLORS[row.category] ?? ""}>
          {row.category.replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "expense_type",
      header: "Type",
      cell: (row: Expense) => (
        <span className="text-sm">{row.expense_type}</span>
      ),
    },
    {
      key: "description",
      header: "Description",
      cell: (row: Expense) => (
        <span className="text-sm text-muted-foreground line-clamp-1">{row.description}</span>
      ),
    },
    {
      key: "vehicle",
      header: "Vehicle",
      cell: (row: Expense) => (
        <span className="text-sm font-mono">
          {row.vehicle_details?.registration_number ?? "—"}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row: Expense) => (
        <span className="text-sm font-semibold">${row.amount?.toLocaleString()}</span>
      ),
    },
    {
      key: "payment_method",
      header: "Payment",
      cell: (row: Expense) => (
        <span className="text-sm text-muted-foreground capitalize">
          {row.payment_method?.replace("_", " ") ?? "—"}
        </span>
      ),
    },
    {
      key: "approved",
      header: "Approved",
      cell: (row: Expense) => (
        <Badge variant={row.approved ? "default" : "secondary"} className="text-xs">
          {row.approved ? "Yes" : "Pending"}
        </Badge>
      ),
    },
  ];

  const totalAmount = (data?.results ?? []).reduce((s, e) => s + (e.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Track and manage fleet expenses"
        action={
          <Button onClick={() => setShowModal(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Record Expense
          </Button>
        }
      />

      {/* Summary Cards */}
      {summary && summary.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summary.slice(0, 4).map((item: { category: string; total: number }) => (
            <Card key={item.category}>
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground capitalize">
                    {item.category.replace("_", " ")}
                  </p>
                  <p className="text-sm font-bold">${item.total?.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DataTable
        columns={columns}
        data={data?.results ?? []}
        isLoading={isLoading}
        totalCount={data?.count ?? 0}
        page={page}
        pageSize={25}
        onPageChange={setPage}
      />

      <CreateExpenseModal open={showModal} onOpenChange={setShowModal} />
    </div>
  );
}
