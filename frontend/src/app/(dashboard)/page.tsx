import { KPICards } from "@/components/dashboard/kpi-cards";
import { VehicleUtilizationChart } from "@/components/dashboard/vehicle-utilization-chart";
import { FuelTrendChart } from "@/components/dashboard/fuel-trend-chart";
import { ExpenseBreakdownChart } from "@/components/dashboard/expense-breakdown-chart";
import { TripStatusChart } from "@/components/dashboard/trip-status-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { PageHeader } from "@/components/shared/page-header";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Fleet operations overview"
      />

      {/* KPI Cards */}
      <KPICards />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VehicleUtilizationChart />
        <TripStatusChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FuelTrendChart />
        <ExpenseBreakdownChart />
      </div>

      {/* Bottom row: Recent Activity + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <AlertsPanel />
      </div>
    </div>
  );
}
