import uuid
from datetime import date
from typing import List, Optional, Tuple

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.driver import Driver, DriverStatus
from app.repositories.base import BaseRepository


class DriverRepository(BaseRepository[Driver]):
    def __init__(self, session: AsyncSession):
        super().__init__(Driver, session)

    async def get_by_license_number(self, license_number: str) -> Optional[Driver]:
        stmt = select(Driver).where(
            Driver.license_number == license_number.upper()
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[Driver]:
        stmt = select(Driver).where(Driver.email == email.lower())
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_available(self) -> List[Driver]:
        """Returns drivers who are available AND have a non-expired license."""
        today = date.today()
        stmt = select(Driver).where(
            Driver.status == DriverStatus.AVAILABLE,
            Driver.license_expiry_date >= today,
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_for_update(self, driver_id: uuid.UUID) -> Optional[Driver]:
        """Acquire a row-level lock (SELECT FOR UPDATE)."""
        stmt = (
            select(Driver)
            .where(Driver.id == driver_id)
            .with_for_update()
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_expiring_licenses(self, within_days: int = 30) -> List[Driver]:
        """Returns drivers whose license expires within the given number of days."""
        today = date.today()
        from datetime import timedelta
        cutoff = today + timedelta(days=within_days)
        stmt = select(Driver).where(
            Driver.license_expiry_date <= cutoff,
            Driver.license_expiry_date >= today,
            Driver.status != DriverStatus.INACTIVE,
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_all_with_filters(
        self,
        *,
        status: Optional[DriverStatus] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[Driver], int]:
        query = select(Driver)
        count_query = select(func.count()).select_from(Driver)

        if status:
            query = query.where(Driver.status == status)
            count_query = count_query.where(Driver.status == status)

        if search:
            pattern = f"%{search}%"
            search_filter = (
                Driver.first_name.ilike(pattern)
                | Driver.last_name.ilike(pattern)
                | Driver.license_number.ilike(pattern)
                | Driver.email.ilike(pattern)
            )
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)

        count_result = await self.session.execute(count_query)
        total = count_result.scalar_one()

        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all()), total
