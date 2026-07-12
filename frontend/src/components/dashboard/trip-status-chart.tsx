"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardKPIs } from "@/hooks/use-analytics";

const STATUS_COLORS: Record<string, string> = {
  Completed: "#10b981",
  Active: "#8b5cf6",
  Pending: "#f59e0b",
  Cancelled: "#ef4444",
};

export function TripStatusChart() {
  const { data, isLoading } = useDashboardKPIs();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trips by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    { status: "Completed", count: data?.completed_trips_today ?? 0 },
    { status: "Active", count: data?.active_trips ?? 0 },
    { status: "Pending", count: data?.pending_trips ?? 0 },
    { status: "Cancelled", count: 0 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trips by Status</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={256}>
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
            barSize={48}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="status"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--card-foreground))",
              }}
              cursor={{ fill: "hsl(var(--muted))" }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.status}
                  fill={STATUS_COLORS[entry.status] ?? "#6b7280"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
