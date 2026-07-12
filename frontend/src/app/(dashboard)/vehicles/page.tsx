"use client";

import { useState } from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { VehicleTable } from "@/components/vehicles/vehicle-table";

const TABS = [
  { value: "all", label: "All" },
  { value: "available", label: "Available" },
  { value: "in_use", label: "On Trip" },
  { value: "maintenance", label: "In Shop" },
  { value: "retired", label: "Retired" },
];

export default function VehiclesPage() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicles"
        description="Manage your fleet"
        action={
          <Button asChild>
            <Link href="/vehicles/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Vehicle
            </Link>
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <VehicleTable statusFilter={activeTab} />
    </div>
  );
}
