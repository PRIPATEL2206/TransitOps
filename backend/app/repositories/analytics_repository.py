from datetime import datetime, timezone
from decimal import Decimal
from typing import Dict, List

from sqlalchemy import func, select, extract
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.driver import Driver, DriverStatus
from app.models.expense import Expense
from app.models.fuel_log import FuelLog
from app.models.maintenance import MaintenanceLog, MaintenanceStatus
from app.models.trip import Trip, TripStatus
from app.models.vehicle import Vehicle, VehicleStatus


class AnalyticsRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_vehicle_counts_by_status(self) -> Dict[str, int]:
        stmt = select(Vehicle.status, func.count(Vehicle.id).label("count")).group_by(
            Vehicle.status
        )
        result = await self.session.execute(stmt)
        return {row.status.value: row.count for row in result.all()}

    async def get_driver_counts_by_status(self) -> Dict[str, int]:
        stmt = select(Driver.status, func.count(Driver.id).label("count")).group_by(
            Driver.status
        )
        result = await self.session.execute(stmt)
        return {row.status.value: row.count for row in result.all()}

    async def get_trip_counts_this_month(self) -> Dict[str, int]:
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        stmt = (
            select(Trip.status, func.count(Trip.id).label("count"))
            .where(Trip.created_at >= month_start)
            .group_by(Trip.status)
        )
        result = await self.session.execute(stmt)
        return {row.status.value: row.count for row in result.all()}

    async def get_fuel_cost_this_month(self) -> Decimal:
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        stmt = select(func.coalesce(func.sum(FuelLog.total_cost), 0)).where(
            FuelLog.filled_at >= month_start
        )
        result = await self.session.execute(stmt)
        return Decimal(str(result.scalar_one()))

    async def get_maintenance_cost_this_month(self) -> Decimal:
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        stmt = select(func.coalesce(func.sum(MaintenanceLog.actual_cost), 0)).where(
            MaintenanceLog.completed_at >= month_start,
            MaintenanceLog.status == MaintenanceStatus.CLOSED,
        )
        result = await self.session.execute(stmt)
        return Decimal(str(result.scalar_one()))

    async def get_expense_total_this_month(self) -> Decimal:
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        stmt = select(func.coalesce(func.sum(Expense.amount), 0)).where(
            Expense.incurred_at >= month_start
        )
        result = await self.session.execute(stmt)
        return Decimal(str(result.scalar_one()))

    async def get_total_distance_this_month(self) -> Decimal:
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        stmt = select(
            func.coalesce(
                func.sum(Trip.odometer_end_km - Trip.odometer_start_km), 0
            )
        ).where(
            Trip.status == TripStatus.COMPLETED,
            Trip.actual_arrival >= month_start,
            Trip.odometer_start_km.isnot(None),
            Trip.odometer_end_km.isnot(None),
        )
        result = await self.session.execute(stmt)
        return Decimal(str(result.scalar_one()))

    async def get_expiring_license_count(self, within_days: int = 30) -> int:
        from datetime import date, timedelta
        today = date.today()
        cutoff = today + timedelta(days=within_days)
        stmt = select(func.count(Driver.id)).where(
            Driver.license_expiry_date <= cutoff,
            Driver.license_expiry_date >= today,
            Driver.status != DriverStatus.INACTIVE,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def get_fleet_utilization(self) -> List[Dict]:
        """Aggregates trip/cost data per vehicle."""
        stmt = (
            select(
                Vehicle.id,
                Vehicle.registration_number,
                Vehicle.make,
                Vehicle.model,
                Vehicle.status,
                func.count(Trip.id).label("total_trips"),
                func.count(Trip.id).filter(Trip.status == TripStatus.COMPLETED).label("completed_trips"),
                func.coalesce(
                    func.sum(Trip.odometer_end_km - Trip.odometer_start_km).filter(
                        Trip.status == TripStatus.COMPLETED,
                        Trip.odometer_start_km.isnot(None),
                        Trip.odometer_end_km.isnot(None),
                    ), 0
                ).label("total_distance_km"),
                func.coalesce(func.sum(FuelLog.total_cost), 0).label("total_fuel_cost"),
            )
            .outerjoin(Trip, Trip.vehicle_id == Vehicle.id)
            .outerjoin(FuelLog, FuelLog.vehicle_id == Vehicle.id)
            .group_by(Vehicle.id)
        )
        result = await self.session.execute(stmt)
        rows = result.all()

        return [
            {
                "vehicle_id": str(row.id),
                "registration_number": row.registration_number,
                "make": row.make,
                "model": row.model,
                "status": row.status.value if hasattr(row.status, 'value') else str(row.status),
                "total_trips": row.total_trips,
                "completed_trips": row.completed_trips,
                "total_distance_km": Decimal(str(row.total_distance_km)),
                "total_fuel_cost": Decimal(str(row.total_fuel_cost)),
            }
            for row in rows
        ]

    async def get_driver_performance(self) -> List[Dict]:
        stmt = (
            select(
                Driver.id,
                Driver.first_name,
                Driver.last_name,
                Driver.license_number,
                Driver.status,
                func.count(Trip.id).label("total_trips"),
                func.count(Trip.id).filter(Trip.status == TripStatus.COMPLETED).label("completed_trips"),
                func.count(Trip.id).filter(Trip.status == TripStatus.CANCELLED).label("cancelled_trips"),
                func.coalesce(
                    func.sum(Trip.odometer_end_km - Trip.odometer_start_km).filter(
                        Trip.status == TripStatus.COMPLETED,
                        Trip.odometer_start_km.isnot(None),
                        Trip.odometer_end_km.isnot(None),
                    ), 0
                ).label("total_distance_km"),
            )
            .outerjoin(Trip, Trip.driver_id == Driver.id)
            .group_by(Driver.id)
        )
        result = await self.session.execute(stmt)
        rows = result.all()

        return [
            {
                "driver_id": str(row.id),
                "full_name": f"{row.first_name} {row.last_name}",
                "license_number": row.license_number,
                "status": row.status.value if hasattr(row.status, 'value') else str(row.status),
                "total_trips": row.total_trips,
                "completed_trips": row.completed_trips,
                "cancelled_trips": row.cancelled_trips,
                "total_distance_km": Decimal(str(row.total_distance_km)),
            }
            for row in rows
        ]
