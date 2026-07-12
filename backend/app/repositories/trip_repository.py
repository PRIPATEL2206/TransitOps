import uuid
from typing import List, Optional, Tuple

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.trip import Trip, TripStatus
from app.repositories.base import BaseRepository


class TripRepository(BaseRepository[Trip]):
    def __init__(self, session: AsyncSession):
        super().__init__(Trip, session)

    async def get_by_trip_number(self, trip_number: str) -> Optional[Trip]:
        stmt = (
            select(Trip)
            .where(Trip.trip_number == trip_number)
            .options(selectinload(Trip.vehicle), selectinload(Trip.driver))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_with_relations(self, trip_id: uuid.UUID) -> Optional[Trip]:
        stmt = (
            select(Trip)
            .where(Trip.id == trip_id)
            .options(selectinload(Trip.vehicle), selectinload(Trip.driver))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_active_for_vehicle(self, vehicle_id: uuid.UUID) -> Optional[Trip]:
        """Returns any active (dispatched/in-progress) trip for a vehicle."""
        stmt = select(Trip).where(
            Trip.vehicle_id == vehicle_id,
            Trip.status.in_([TripStatus.DISPATCHED, TripStatus.IN_PROGRESS]),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_active_for_driver(self, driver_id: uuid.UUID) -> Optional[Trip]:
        """Returns any active trip for a driver."""
        stmt = select(Trip).where(
            Trip.driver_id == driver_id,
            Trip.status.in_([TripStatus.DISPATCHED, TripStatus.IN_PROGRESS]),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all_with_filters(
        self,
        *,
        status: Optional[TripStatus] = None,
        vehicle_id: Optional[uuid.UUID] = None,
        driver_id: Optional[uuid.UUID] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[Trip], int]:
        query = select(Trip).options(selectinload(Trip.vehicle), selectinload(Trip.driver))
        count_query = select(func.count()).select_from(Trip)

        if status:
            query = query.where(Trip.status == status)
            count_query = count_query.where(Trip.status == status)

        if vehicle_id:
            query = query.where(Trip.vehicle_id == vehicle_id)
            count_query = count_query.where(Trip.vehicle_id == vehicle_id)

        if driver_id:
            query = query.where(Trip.driver_id == driver_id)
            count_query = count_query.where(Trip.driver_id == driver_id)

        count_result = await self.session.execute(count_query)
        total = count_result.scalar_one()

        query = query.order_by(Trip.created_at.desc()).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all()), total

    async def count_by_status_this_month(self) -> dict:
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        stmt = (
            select(Trip.status, func.count(Trip.id).label("count"))
            .where(Trip.created_at >= month_start)
            .group_by(Trip.status)
        )
        result = await self.session.execute(stmt)
        return {row.status: row.count for row in result.all()}

    async def generate_trip_number(self) -> str:
        """Generate a sequential trip number like TRIP-0001."""
        stmt = select(func.count(Trip.id))
        result = await self.session.execute(stmt)
        count = result.scalar_one()
        return f"TRIP-{(count + 1):06d}"
