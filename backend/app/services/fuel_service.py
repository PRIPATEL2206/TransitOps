import uuid
from typing import List, Optional, Tuple

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleViolation, NotFoundError
from app.models.fuel_log import FuelLog
from app.repositories.fuel_repository import FuelRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.schemas.fuel_log import FuelLogCreate, FuelLogUpdate


class FuelService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = FuelRepository(session)
        self.vehicle_repo = VehicleRepository(session)

    async def get_by_id(self, log_id: uuid.UUID) -> FuelLog:
        log = await self.repo.get_by_id(log_id)
        if not log:
            raise NotFoundError("FuelLog", str(log_id))
        return log

    async def get_all(
        self,
        *,
        vehicle_id: Optional[uuid.UUID] = None,
        trip_id: Optional[uuid.UUID] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[FuelLog], int]:
        return await self.repo.get_all_with_filters(
            vehicle_id=vehicle_id, trip_id=trip_id, skip=skip, limit=limit
        )

    async def create(self, log_in: FuelLogCreate) -> FuelLog:
        vehicle = await self.vehicle_repo.get_by_id(log_in.vehicle_id)
        if not vehicle:
            raise NotFoundError("Vehicle", str(log_in.vehicle_id))

        # Validate odometer: must be >= current vehicle odometer
        if log_in.odometer_km < vehicle.odometer_km:
            raise BusinessRuleViolation(
                f"Fuel log odometer ({log_in.odometer_km} km) cannot be less than "
                f"vehicle's current odometer ({vehicle.odometer_km} km)",
                rule_code="ODOMETER_REGRESSION",
            )

        # Validate against last fuel log for this vehicle
        last_log = await self.repo.get_last_for_vehicle(log_in.vehicle_id)
        if last_log and log_in.odometer_km < last_log.odometer_km:
            raise BusinessRuleViolation(
                f"Fuel log odometer ({log_in.odometer_km} km) is less than the previous "
                f"fuel log odometer ({last_log.odometer_km} km)",
                rule_code="ODOMETER_REGRESSION",
            )

        log_data = log_in.model_dump()
        return await self.repo.create(log_data)

    async def update(self, log_id: uuid.UUID, log_in: FuelLogUpdate) -> FuelLog:
        log = await self.get_by_id(log_id)
        update_data = {k: v for k, v in log_in.model_dump().items() if v is not None}
        if update_data:
            return await self.repo.update(log, update_data)
        return log

    async def delete(self, log_id: uuid.UUID) -> None:
        log = await self.get_by_id(log_id)
        await self.repo.delete(log)
