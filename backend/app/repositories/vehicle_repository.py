import uuid
from typing import List, Optional, Tuple

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.vehicle import Vehicle, VehicleStatus
from app.repositories.base import BaseRepository


class VehicleRepository(BaseRepository[Vehicle]):
    def __init__(self, session: AsyncSession):
        super().__init__(Vehicle, session)

    async def get_by_registration(self, registration_number: str) -> Optional[Vehicle]:
        stmt = select(Vehicle).where(
            Vehicle.registration_number == registration_number.upper()
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_available(self) -> List[Vehicle]:
        stmt = select(Vehicle).where(Vehicle.status == VehicleStatus.AVAILABLE)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_status(
        self, status: VehicleStatus, *, skip: int = 0, limit: int = 100
    ) -> Tuple[List[Vehicle], int]:
        count_stmt = select(func.count()).select_from(Vehicle).where(
            Vehicle.status == status
        )
        count_result = await self.session.execute(count_stmt)
        total = count_result.scalar_one()

        stmt = (
            select(Vehicle)
            .where(Vehicle.status == status)
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total

    async def get_for_update(self, vehicle_id: uuid.UUID) -> Optional[Vehicle]:
        """Acquire a row-level lock for optimistic concurrency (SELECT FOR UPDATE)."""
        stmt = (
            select(Vehicle)
            .where(Vehicle.id == vehicle_id)
            .with_for_update()
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all_with_filters(
        self,
        *,
        status: Optional[VehicleStatus] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[Vehicle], int]:
        query = select(Vehicle)
        count_query = select(func.count()).select_from(Vehicle)

        if status:
            query = query.where(Vehicle.status == status)
            count_query = count_query.where(Vehicle.status == status)

        if search:
            pattern = f"%{search}%"
            search_filter = (
                Vehicle.registration_number.ilike(pattern)
                | Vehicle.make.ilike(pattern)
                | Vehicle.model.ilike(pattern)
            )
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)

        count_result = await self.session.execute(count_query)
        total = count_result.scalar_one()

        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all()), total
