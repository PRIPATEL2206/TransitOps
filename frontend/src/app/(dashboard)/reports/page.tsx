"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { PageHeader } from "@/components/shared/page-header";
import { useFleetUtilization, useFuelEfficiency, useVehicleROI } from "@/hooks/use-analytics";
import { useExpenseSummary } from "@/hooks/use-expenses";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#6b7280"];

function generateMockUtilizationData() {
  const today = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (29 - i));
    return {
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      utilization: Math.round(55 + Math.random() * 30),
    };
  });
}

const MOCK_FUEL_EFFICIENCY = [
  { vehicle: "KCA-001", efficiency: 12.4 },
  { vehicle: "KCA-002", efficiency: 9.8 },
  { vehicle: "KCA-003", efficiency: 14.2 },
  { vehicle: "KCA-004", efficiency: 10.5 },
  { vehicle: "KCA-005", efficiency: 11.9 },
];

export default function ReportsPage() {
  const { data: utilizationData, isLoading: utilizationLoading } = useFleetUtilization();
  const { data: fuelEffData, isLoading: fuelLoading } = useFuelEfficiency();
  const { data: roiData, isLoading: roiLoading } = useVehicleROI();
  const { data: expenseSummary } = useExpenseSummary();

  const chartUtilization = utilizationData ?? generateMockUtilizationData();
  const chartFuelEff =
    fuelEffData && fuelEffData.length > 0 ? fuelEffData : MOCK_FUEL_EFFICIENCY;

  const pieData =
    expenseSummary && expenseSummary.length > 0
      ? expenseSummary.map((item: { category: string; total: number }) => ({
          name: item.category.replace("_", " "),
          value: item.total,
        }))
      : [
          { name: "Fuel", value: 45 },
          { name: "Maintenance", value: 25 },
          { name: "Insurance", value: 15 },
          { name: "Tolls", value: 10 },
          { name: "Other", value: 5 },
        ];

  function handleExportCSV() {
    const csvContent = [
      "Category,Total",
      ...pieData.map((d: { name: string; value: number }) => `${d.name},${d.value}`),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expense_report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Analytics and performance insights"
        action={
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      {/* Fleet Utilization */}
      <Card>
        <CardHeader>
          <CardTitle>Fleet Utilization (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {utilizationLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={288}>
              <AreaChart data={chartUtilization} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="reportUtilGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--card-foreground))" }}
                  formatter={(value: number) => [`${value}%`, "Utilization"]}
                />
                <Area type="monotone" dataKey="utilization" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#reportUtilGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fuel Efficiency */}
        <Card>
          <CardHeader>
            <CardTitle>Fuel Efficiency by Vehicle (km/L)</CardTitle>
          </CardHeader>
          <CardContent>
            {fuelLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={256}>
                <BarChart data={chartFuelEff} margin={{ top: 4, right: 16, left: 0, bottom: 0 }} barSize={32} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                  <YAxis dataKey="vehicle" type="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={70} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--card-foreground))" }}
                    formatter={(v: number) => [`${v} km/L`, "Efficiency"]}
                  />
                  <Bar dataKey="efficiency" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={256}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={64} outerRadius={96} paddingAngle={3} dataKey="value">
                  {pieData.map((_: unknown, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--card-foreground))" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ROI Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle ROI Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          {roiLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : roiData && roiData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Vehicle</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Acquisition Cost</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Total Expenses</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Revenue</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">ROI %</th>
                  </tr>
                </thead>
                <tbody>
                  {roiData.map((row: { vehicle: string; acquisition_cost: number; total_expenses: number; revenue: number; roi: number }, idx: number) => (
                    <tr key={idx} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 px-3 font-mono">{row.vehicle}</td>
                      <td className="py-2 px-3 text-right">${row.acquisition_cost?.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right">${row.total_expenses?.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right">${row.revenue?.toLocaleString()}</td>
                      <td className={`py-2 px-3 text-right font-semibold ${row.roi >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {row.roi?.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No ROI data available. Add acquisition costs to vehicles to enable this analysis.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
