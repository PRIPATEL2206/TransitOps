import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Tuple

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.fuel_log import FuelLog
from app.repositories.base import BaseRepository


class FuelRepository(BaseRepository[FuelLog]):
    def __init__(self, session: AsyncSession):
        super().__init__(FuelLog, session)

    async def get_for_vehicle(
        self, vehicle_id: uuid.UUID, *, skip: int = 0, limit: int = 100
    ) -> Tuple[List[FuelLog], int]:
        count_stmt = select(func.count()).select_from(FuelLog).where(
            FuelLog.vehicle_id == vehicle_id
        )
        count_result = await self.session.execute(count_stmt)
        total = count_result.scalar_one()

        stmt = (
            select(FuelLog)
            .where(FuelLog.vehicle_id == vehicle_id)
            .order_by(FuelLog.filled_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total

    async def get_last_for_vehicle(self, vehicle_id: uuid.UUID) -> Optional[FuelLog]:
        """Get the most recent fuel log for a vehicle (for odometer validation)."""
        stmt = (
            select(FuelLog)
            .where(FuelLog.vehicle_id == vehicle_id)
            .order_by(FuelLog.filled_at.desc(), FuelLog.odometer_km.desc())
            .limit(1)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_total_cost_for_vehicle(self, vehicle_id: uuid.UUID) -> Decimal:
        stmt = select(func.coalesce(func.sum(FuelLog.total_cost), 0)).where(
            FuelLog.vehicle_id == vehicle_id
        )
        result = await self.session.execute(stmt)
        return Decimal(str(result.scalar_one()))

    async def get_total_liters_for_vehicle(self, vehicle_id: uuid.UUID) -> Decimal:
        stmt = select(func.coalesce(func.sum(FuelLog.quantity_liters), 0)).where(
            FuelLog.vehicle_id == vehicle_id
        )
        result = await self.session.execute(stmt)
        return Decimal(str(result.scalar_one()))

    async def get_monthly_totals(
        self,
        vehicle_id: Optional[uuid.UUID] = None,
        year: Optional[int] = None,
        month: Optional[int] = None,
    ) -> dict:
        from sqlalchemy import extract

        query = select(
            func.sum(FuelLog.total_cost).label("total_cost"),
            func.sum(FuelLog.quantity_liters).label("total_liters"),
            func.count(FuelLog.id).label("fill_count"),
        )

        if vehicle_id:
            query = query.where(FuelLog.vehicle_id == vehicle_id)

        if year:
            query = query.where(extract("year", FuelLog.filled_at) == year)

        if month:
            query = query.where(extract("month", FuelLog.filled_at) == month)

        result = await self.session.execute(query)
        row = result.one()
        return {
            "total_cost": Decimal(str(row.total_cost or 0)),
            "total_liters": Decimal(str(row.total_liters or 0)),
            "fill_count": row.fill_count or 0,
        }

    async def get_all_with_filters(
        self,
        *,
        vehicle_id: Optional[uuid.UUID] = None,
        trip_id: Optional[uuid.UUID] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[FuelLog], int]:
        query = select(FuelLog)
        count_query = select(func.count()).select_from(FuelLog)

        if vehicle_id:
            query = query.where(FuelLog.vehicle_id == vehicle_id)
            count_query = count_query.where(FuelLog.vehicle_id == vehicle_id)

        if trip_id:
            query = query.where(FuelLog.trip_id == trip_id)
            count_query = count_query.where(FuelLog.trip_id == trip_id)

        count_result = await self.session.execute(count_query)
        total = count_result.scalar_one()

        query = query.order_by(FuelLog.filled_at.desc()).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all()), total
