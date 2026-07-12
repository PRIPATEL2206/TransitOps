import uuid
from typing import List, Optional, Tuple

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.models.vehicle import Vehicle, VehicleStatus
from app.repositories.vehicle_repository import VehicleRepository
from app.rules.vehicle_rules import VehicleRules
from app.schemas.vehicle import VehicleCreate, VehicleUpdate


class VehicleService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = VehicleRepository(session)

    async def get_by_id(self, vehicle_id: uuid.UUID) -> Vehicle:
        vehicle = await self.repo.get_by_id(vehicle_id)
        if not vehicle:
            raise NotFoundError("Vehicle", str(vehicle_id))
        return vehicle

    async def get_all(
        self,
        *,
        status: Optional[VehicleStatus] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[Vehicle], int]:
        return await self.repo.get_all_with_filters(
            status=status, search=search, skip=skip, limit=limit
        )

    async def get_available(self) -> List[Vehicle]:
        return await self.repo.get_available()

    async def create(self, vehicle_in: VehicleCreate) -> Vehicle:
        # Check registration uniqueness
        existing = await self.repo.get_by_registration(vehicle_in.registration_number)
        if existing:
            raise ConflictError(
                f"Vehicle with registration '{vehicle_in.registration_number}' already exists"
            )

        vehicle_data = vehicle_in.model_dump()
        vehicle_data["registration_number"] = vehicle_data["registration_number"].upper()
        return await self.repo.create(vehicle_data)

    async def update(self, vehicle_id: uuid.UUID, vehicle_in: VehicleUpdate) -> Vehicle:
        vehicle = await self.get_by_id(vehicle_id)

        # Apply business rules before status change
        if vehicle_in.status is not None:
            VehicleRules.validate_manual_status_change(vehicle, vehicle_in.status)

        update_data = {k: v for k, v in vehicle_in.model_dump().items() if v is not None}
        if update_data:
            return await self.repo.update(vehicle, update_data)
        return vehicle

    async def delete(self, vehicle_id: uuid.UUID) -> None:
        vehicle = await self.get_by_id(vehicle_id)
        VehicleRules.validate_can_be_deleted(vehicle)
        await self.repo.delete(vehicle)

    async def retire(self, vehicle_id: uuid.UUID) -> Vehicle:
        vehicle = await self.get_by_id(vehicle_id)
        VehicleRules.validate_can_be_retired(vehicle)
        return await self.repo.update(vehicle, {"status": VehicleStatus.RETIRED})
