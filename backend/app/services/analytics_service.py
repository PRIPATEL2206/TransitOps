from decimal import Decimal
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.analytics_repository import AnalyticsRepository
from app.schemas.analytics import (
    DashboardKPIs,
    DriverPerformance,
    FleetStatusBreakdown,
    FleetUtilization,
    TripStatusBreakdown,
    VehicleROI,
)


class AnalyticsService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = AnalyticsRepository(session)

    async def get_dashboard_kpis(self) -> DashboardKPIs:
        vehicle_counts = await self.repo.get_vehicle_counts_by_status()
        driver_counts = await self.repo.get_driver_counts_by_status()
        trip_counts = await self.repo.get_trip_counts_this_month()
        fuel_cost = await self.repo.get_fuel_cost_this_month()
        maintenance_cost = await self.repo.get_maintenance_cost_this_month()
        expense_total = await self.repo.get_expense_total_this_month()
        total_distance = await self.repo.get_total_distance_this_month()
        expiring_licenses = await self.repo.get_expiring_license_count(30)

        total_vehicles = sum(vehicle_counts.values())
        available_vehicles = vehicle_counts.get("Available", 0)
        vehicles_on_trip = vehicle_counts.get("On Trip", 0)
        vehicles_in_shop = vehicle_counts.get("In Shop", 0)
        fleet_util_pct = (
            (vehicles_on_trip / total_vehicles * 100) if total_vehicles > 0 else 0.0
        )

        total_drivers = sum(driver_counts.values())
        available_drivers = driver_counts.get("Available", 0)
        drivers_on_trip = driver_counts.get("On Trip", 0)
        suspended_drivers = driver_counts.get("Suspended", 0)

        total_trips = sum(trip_counts.values())
        completed_trips = trip_counts.get("Completed", 0)
        cancelled_trips = trip_counts.get("Cancelled", 0)
        completion_rate = (
            (completed_trips / total_trips * 100) if total_trips > 0 else 0.0
        )

        fleet_breakdown = FleetStatusBreakdown(
            available=available_vehicles,
            on_trip=vehicles_on_trip,
            in_shop=vehicles_in_shop,
            retired=vehicle_counts.get("Retired", 0),
            total=total_vehicles,
        )

        trip_breakdown = TripStatusBreakdown(
            scheduled=trip_counts.get("Scheduled", 0),
            dispatched=trip_counts.get("Dispatched", 0),
            in_progress=trip_counts.get("In Progress", 0),
            completed=completed_trips,
            cancelled=cancelled_trips,
            total=total_trips,
        )

        return DashboardKPIs(
            total_vehicles=total_vehicles,
            available_vehicles=available_vehicles,
            vehicles_on_trip=vehicles_on_trip,
            vehicles_in_shop=vehicles_in_shop,
            fleet_utilization_pct=round(fleet_util_pct, 2),
            total_drivers=total_drivers,
            available_drivers=available_drivers,
            drivers_on_trip=drivers_on_trip,
            suspended_drivers=suspended_drivers,
            expiring_licenses_30_days=expiring_licenses,
            trips_this_month=total_trips,
            completed_trips_this_month=completed_trips,
            cancelled_trips_this_month=cancelled_trips,
            trip_completion_rate_pct=round(completion_rate, 2),
            total_fuel_cost_this_month=fuel_cost,
            total_maintenance_cost_this_month=maintenance_cost,
            total_expense_this_month=expense_total,
            total_distance_km_this_month=total_distance,
            fleet_breakdown=fleet_breakdown,
            trip_breakdown=trip_breakdown,
        )

    async def get_fleet_utilization(self) -> List[FleetUtilization]:
        rows = await self.repo.get_fleet_utilization()
        result = []
        for row in rows:
            total = row["total_trips"]
            completed = row["completed_trips"]
            util_pct = (completed / total * 100) if total > 0 else 0.0

            result.append(
                FleetUtilization(
                    vehicle_id=row["vehicle_id"],
                    registration_number=row["registration_number"],
                    make=row["make"],
                    model=row["model"],
                    status=row["status"],
                    total_trips=total,
                    completed_trips=completed,
                    total_distance_km=row["total_distance_km"],
                    total_fuel_cost=row["total_fuel_cost"],
                    total_maintenance_cost=Decimal("0"),
                    utilization_days=0,
                    idle_days=0,
                    utilization_pct=round(util_pct, 2),
                )
            )
        return result

    async def get_vehicle_roi(self) -> List[VehicleROI]:
        rows = await self.repo.get_fleet_utilization()
        result = []
        for row in rows:
            total_fuel = row["total_fuel_cost"]
            total_maintenance = Decimal("0")
            total_cost = total_fuel + total_maintenance
            distance = row["total_distance_km"]
            cost_per_km = (total_cost / distance) if distance > 0 else None

            result.append(
                VehicleROI(
                    vehicle_id=row["vehicle_id"],
                    registration_number=row["registration_number"],
                    make=row["make"],
                    model=row["model"],
                    year=0,  # Not in aggregate query - would need join
                    total_trips=row["total_trips"],
                    total_distance_km=distance,
                    total_fuel_cost=total_fuel,
                    total_maintenance_cost=total_maintenance,
                    total_other_expenses=Decimal("0"),
                    total_cost=total_cost,
                    cost_per_km=cost_per_km,
                )
            )
        return result

    async def get_driver_performance(self) -> List[DriverPerformance]:
        rows = await self.repo.get_driver_performance()
        result = []
        for row in rows:
            total = row["total_trips"]
            completed = row["completed_trips"]
            completion_rate = (completed / total * 100) if total > 0 else 0.0
            distance = row["total_distance_km"]
            avg_distance = (distance / completed) if completed > 0 else None

            result.append(
                DriverPerformance(
                    driver_id=row["driver_id"],
                    full_name=row["full_name"],
                    license_number=row["license_number"],
                    status=row["status"],
                    total_trips=total,
                    completed_trips=completed,
                    cancelled_trips=row["cancelled_trips"],
                    total_distance_km=distance,
                    completion_rate_pct=round(completion_rate, 2),
                    avg_trip_distance_km=avg_distance,
                )
            )
        return result
