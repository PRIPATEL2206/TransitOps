"use client";

import { Truck, CircleCheck, Wrench, Navigation, Clock, UserCheck, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/shared/stat-card";
import { useDashboardKPIs } from "@/hooks/use-analytics";

export function KPICards() {
  const { data, isLoading } = useDashboardKPIs();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const kpis = [
    {
      title: "Active Vehicles",
      value: data?.total_vehicles ?? 0,
      icon: <Truck className="h-5 w-5" />,
      color: "blue" as const,
      description: "Total in fleet",
    },
    {
      title: "Available",
      value: data?.available_vehicles ?? 0,
      icon: <CircleCheck className="h-5 w-5" />,
      color: "green" as const,
      description: "Ready to deploy",
    },
    {
      title: "In Maintenance",
      value: data?.maintenance_vehicles ?? 0,
      icon: <Wrench className="h-5 w-5" />,
      color: "amber" as const,
      description: "Under service",
    },
    {
      title: "Active Trips",
      value: data?.active_trips ?? 0,
      icon: <Navigation className="h-5 w-5" />,
      color: "purple" as const,
      description: "Currently en route",
    },
    {
      title: "Pending Trips",
      value: data?.pending_trips ?? 0,
      icon: <Clock className="h-5 w-5" />,
      color: "orange" as const,
      description: "Awaiting dispatch",
    },
    {
      title: "Drivers On Duty",
      value: data?.drivers_on_duty ?? 0,
      icon: <UserCheck className="h-5 w-5" />,
      color: "indigo" as const,
      description: "Currently active",
    },
    {
      title: "Utilization",
      value: `${data?.fleet_utilization ?? 0}%`,
      icon: <Activity className="h-5 w-5" />,
      color: "emerald" as const,
      description: "Fleet efficiency",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      {kpis.map((kpi) => (
        <StatCard
          key={kpi.title}
          title={kpi.title}
          value={kpi.value}
          icon={kpi.icon}
          color={kpi.color}
          description={kpi.description}
        />
      ))}
    </div>
  );
}
