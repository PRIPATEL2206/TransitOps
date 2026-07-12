from decimal import Decimal
from typing import Dict, List, Optional
from pydantic import BaseModel


class FleetStatusBreakdown(BaseModel):
    available: int
    on_trip: int
    in_shop: int
    retired: int
    total: int


class TripStatusBreakdown(BaseModel):
    scheduled: int
    dispatched: int
    in_progress: int
    completed: int
    cancelled: int
    total: int


class DashboardKPIs(BaseModel):
    # Fleet
    total_vehicles: int
    available_vehicles: int
    vehicles_on_trip: int
    vehicles_in_shop: int
    fleet_utilization_pct: float

    # Drivers
    total_drivers: int
    available_drivers: int
    drivers_on_trip: int
    suspended_drivers: int
    expiring_licenses_30_days: int

    # Trips (this month)
    trips_this_month: int
    completed_trips_this_month: int
    cancelled_trips_this_month: int
    trip_completion_rate_pct: float

    # Costs (this month)
    total_fuel_cost_this_month: Decimal
    total_maintenance_cost_this_month: Decimal
    total_expense_this_month: Decimal

    # Operational
    total_distance_km_this_month: Decimal

    fleet_breakdown: FleetStatusBreakdown
    trip_breakdown: TripStatusBreakdown


class FleetUtilization(BaseModel):
    vehicle_id: str
    registration_number: str
    make: str
    model: str
    status: str
    total_trips: int
    completed_trips: int
    total_distance_km: Decimal
    total_fuel_cost: Decimal
    total_maintenance_cost: Decimal
    utilization_days: int
    idle_days: int
    utilization_pct: float


class VehicleROI(BaseModel):
    vehicle_id: str
    registration_number: str
    make: str
    model: str
    year: int
    total_trips: int
    total_distance_km: Decimal
    total_fuel_cost: Decimal
    total_maintenance_cost: Decimal
    total_other_expenses: Decimal
    total_cost: Decimal
    cost_per_km: Optional[Decimal] = None
    avg_fuel_efficiency_kmpl: Optional[Decimal] = None


class DriverPerformance(BaseModel):
    driver_id: str
    full_name: str
    license_number: str
    status: str
    total_trips: int
    completed_trips: int
    cancelled_trips: int
    total_distance_km: Decimal
    completion_rate_pct: float
    avg_trip_distance_km: Optional[Decimal] = None


class FuelEfficiencyReport(BaseModel):
    vehicle_id: str
    registration_number: str
    total_fuel_liters: Decimal
    total_cost: Decimal
    total_distance_km: Decimal
    avg_cost_per_liter: Optional[Decimal] = None
    actual_efficiency_kmpl: Optional[Decimal] = None
    expected_efficiency_kmpl: Optional[Decimal] = None
    efficiency_variance_pct: Optional[float] = None
