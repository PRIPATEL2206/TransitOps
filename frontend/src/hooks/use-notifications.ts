import { useState, useEffect } from "react";
import { useVehicles } from "./use-vehicles";
import { useDrivers } from "./use-drivers";
import { useTrips } from "./use-trips";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "license_expiry" | "vehicle_in_shop" | "trip_dispatched";
  severity: "info" | "warning" | "critical";
  created_at: string;
}

export function useNotifications() {
  const { data: vehicles } = useVehicles({ page_size: 100 });
  const { data: drivers } = useDrivers({ page_size: 100 });
  const { data: trips } = useTrips({ page_size: 100 });
  
  const [readIds, setReadIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Load read notifications from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("transitops_read_notifications");
    if (stored) {
      try {
        setReadIds(JSON.parse(stored));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    const list: NotificationItem[] = [];

    // 1. License expiries (Critical/Warning)
    if (drivers?.items) {
      drivers.items.forEach((d) => {
        if (!d.license_expiry) return;
        const expiry = new Date(d.license_expiry);
        const today = new Date();
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 30) {
          const isCritical = diffDays <= 7;
          list.push({
            id: `license-expiry-${d.id}-${d.license_expiry}`,
            title: isCritical ? "Critical: License Expiring" : "License Expiry Warning",
            message: `Driver ${d.full_name}'s license expires in ${diffDays} days (${new Date(d.license_expiry).toLocaleDateString()}).`,
            type: "license_expiry",
            severity: isCritical ? "critical" : "warning",
            created_at: d.created_at || new Date().toISOString(),
          });
        }
      });
    }

    // 2. Vehicles in shop (Warning)
    if (vehicles?.items) {
      vehicles.items.forEach((v) => {
        if (v.status === "maintenance") {
          list.push({
            id: `vehicle-shop-${v.id}`,
            title: "Vehicle In Shop",
            message: `Vehicle ${v.registration_number} (${v.make} ${v.model}) is currently in maintenance.`,
            type: "vehicle_in_shop",
            severity: "warning",
            created_at: v.updated_at || new Date().toISOString(),
          });
        }
      });
    }

    // 3. Active trips (Info)
    if (trips?.items) {
      trips.items.forEach((t) => {
        if (t.status === "in_progress" || t.status === "dispatched") {
          list.push({
            id: `trip-dispatch-${t.id}`,
            title: "Trip Dispatched",
            message: `Trip ${t.trip_number} is active en route to ${t.destination}.`,
            type: "trip_dispatched",
            severity: "info",
            created_at: t.updated_at || new Date().toISOString(),
          });
        }
      });
    }

    // Sort by creation date descending
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setNotifications(list);
  }, [vehicles, drivers, trips]);

  const activeNotifications = notifications.filter((n) => !readIds.includes(n.id));

  const markAsRead = (id: string) => {
    const updated = [...readIds, id];
    setReadIds(updated);
    localStorage.setItem("transitops_read_notifications", JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    localStorage.setItem("transitops_read_notifications", JSON.stringify(allIds));
  };

  return {
    notifications: activeNotifications,
    totalCount: activeNotifications.length,
    markAsRead,
    markAllAsRead,
  };
}
