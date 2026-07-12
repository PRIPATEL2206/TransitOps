"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExpenseSummary } from "@/hooks/use-expenses";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444"];
const FALLBACK_DATA = [
  { name: "Fuel", value: 45 },
  { name: "Maintenance", value: 25 },
  { name: "Insurance", value: 15 },
  { name: "Tolls", value: 10 },
  { name: "Other", value: 5 },
];

export function ExpenseBreakdownChart() {
  const { data, isLoading } = useExpenseSummary();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData =
    data && data.length > 0
      ? data.map((item: { category: string; total: number }) => ({
          name: item.category,
          value: item.total,
        }))
      : FALLBACK_DATA;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={256}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={64}
              outerRadius={96}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((_: unknown, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--card-foreground))",
              }}
              formatter={(value: number) => [`${value}%`, "Share"]}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
