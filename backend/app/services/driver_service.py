import uuid
from typing import List, Optional, Tuple

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.models.driver import Driver, DriverStatus
from app.repositories.driver_repository import DriverRepository
from app.rules.driver_rules import DriverRules
from app.schemas.driver import DriverCreate, DriverUpdate


class DriverService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = DriverRepository(session)

    async def get_by_id(self, driver_id: uuid.UUID) -> Driver:
        driver = await self.repo.get_by_id(driver_id)
        if not driver:
            raise NotFoundError("Driver", str(driver_id))
        return driver

    async def get_all(
        self,
        *,
        status: Optional[DriverStatus] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[Driver], int]:
        return await self.repo.get_all_with_filters(
            status=status, search=search, skip=skip, limit=limit
        )

    async def get_available(self) -> List[Driver]:
        return await self.repo.get_available()

    async def get_expiring_licenses(self, within_days: int = 30) -> List[Driver]:
        return await self.repo.get_expiring_licenses(within_days)

    async def create(self, driver_in: DriverCreate) -> Driver:
        # Check license uniqueness
        existing = await self.repo.get_by_license_number(driver_in.license_number)
        if existing:
            raise ConflictError(
                f"Driver with license number '{driver_in.license_number}' already exists"
            )

        # Check email uniqueness
        if driver_in.email:
            existing_email = await self.repo.get_by_email(driver_in.email)
            if existing_email:
                raise ConflictError(
                    f"Driver with email '{driver_in.email}' already exists"
                )

        driver_data = driver_in.model_dump()
        driver_data["license_number"] = driver_data["license_number"].upper()
        return await self.repo.create(driver_data)

    async def update(self, driver_id: uuid.UUID, driver_in: DriverUpdate) -> Driver:
        driver = await self.get_by_id(driver_id)

        if driver_in.status is not None:
            DriverRules.validate_manual_status_change(driver, driver_in.status)

        update_data = {k: v for k, v in driver_in.model_dump().items() if v is not None}
        if update_data:
            return await self.repo.update(driver, update_data)
        return driver

    async def delete(self, driver_id: uuid.UUID) -> None:
        driver = await self.get_by_id(driver_id)
        DriverRules.validate_can_be_deleted(driver)
        await self.repo.delete(driver)

    async def suspend(self, driver_id: uuid.UUID) -> Driver:
        driver = await self.get_by_id(driver_id)
        DriverRules.validate_can_be_suspended(driver)
        return await self.repo.update(driver, {"status": DriverStatus.SUSPENDED})

    async def reinstate(self, driver_id: uuid.UUID) -> Driver:
        driver = await self.get_by_id(driver_id)
        DriverRules.validate_can_be_reinstated(driver)
        return await self.repo.update(driver, {"status": DriverStatus.AVAILABLE})
