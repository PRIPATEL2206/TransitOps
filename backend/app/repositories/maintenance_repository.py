import uuid
from typing import List, Optional, Tuple

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.maintenance import MaintenanceLog, MaintenanceStatus
from app.repositories.base import BaseRepository


class MaintenanceRepository(BaseRepository[MaintenanceLog]):
    def __init__(self, session: AsyncSession):
        super().__init__(MaintenanceLog, session)

    async def get_active_for_vehicle(self, vehicle_id: uuid.UUID) -> List[MaintenanceLog]:
        """Returns all open/in-progress maintenance records for a vehicle."""
        stmt = select(MaintenanceLog).where(
            MaintenanceLog.vehicle_id == vehicle_id,
            MaintenanceLog.status.in_(
                [MaintenanceStatus.OPEN, MaintenanceStatus.IN_PROGRESS]
            ),
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def has_active_maintenance(self, vehicle_id: uuid.UUID) -> bool:
        """Returns True if the vehicle has any open/in-progress maintenance."""
        stmt = select(func.count()).select_from(MaintenanceLog).where(
            MaintenanceLog.vehicle_id == vehicle_id,
            MaintenanceLog.status.in_(
                [MaintenanceStatus.OPEN, MaintenanceStatus.IN_PROGRESS]
            ),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one() > 0

    async def get_all_with_filters(
        self,
        *,
        vehicle_id: Optional[uuid.UUID] = None,
        status: Optional[MaintenanceStatus] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[MaintenanceLog], int]:
        query = select(MaintenanceLog)
        count_query = select(func.count()).select_from(MaintenanceLog)

        if vehicle_id:
            query = query.where(MaintenanceLog.vehicle_id == vehicle_id)
            count_query = count_query.where(MaintenanceLog.vehicle_id == vehicle_id)

        if status:
            query = query.where(MaintenanceLog.status == status)
            count_query = count_query.where(MaintenanceLog.status == status)

        count_result = await self.session.execute(count_query)
        total = count_result.scalar_one()

        query = query.order_by(MaintenanceLog.created_at.desc()).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all()), total

    async def get_total_cost_for_vehicle(self, vehicle_id: uuid.UUID) -> float:
        """Returns the total actual maintenance cost for a vehicle."""
        stmt = select(func.coalesce(func.sum(MaintenanceLog.actual_cost), 0)).where(
            MaintenanceLog.vehicle_id == vehicle_id,
            MaintenanceLog.status == MaintenanceStatus.CLOSED,
        )
        result = await self.session.execute(stmt)
        return float(result.scalar_one())
