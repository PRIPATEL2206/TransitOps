import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.maintenance import MaintenanceLog, MaintenanceStatus
from app.models.vehicle import VehicleStatus
from app.repositories.maintenance_repository import MaintenanceRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.rules.maintenance_rules import MaintenanceRules
from app.schemas.maintenance import MaintenanceClose, MaintenanceCreate, MaintenanceUpdate


class MaintenanceService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = MaintenanceRepository(session)
        self.vehicle_repo = VehicleRepository(session)

    async def get_by_id(self, maintenance_id: uuid.UUID) -> MaintenanceLog:
        log = await self.repo.get_by_id(maintenance_id)
        if not log:
            raise NotFoundError("MaintenanceLog", str(maintenance_id))
        return log

    async def get_all(
        self,
        *,
        vehicle_id: Optional[uuid.UUID] = None,
        status: Optional[MaintenanceStatus] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[MaintenanceLog], int]:
        return await self.repo.get_all_with_filters(
            vehicle_id=vehicle_id, status=status, skip=skip, limit=limit
        )

    async def create(self, maint_in: MaintenanceCreate) -> MaintenanceLog:
        """
        Create a maintenance log and automatically set vehicle status to 'In Shop'.
        """
        vehicle = await self.vehicle_repo.get_for_update(maint_in.vehicle_id)
        if not vehicle:
            raise NotFoundError("Vehicle", str(maint_in.vehicle_id))

        MaintenanceRules.validate_vehicle_can_enter_shop(vehicle)

        # Create the maintenance log
        log_data = maint_in.model_dump()
        log_data["status"] = MaintenanceStatus.OPEN
        log_data["started_at"] = datetime.now(timezone.utc)
        log = await self.repo.create(log_data)

        # Auto-set vehicle to In Shop
        vehicle.status = VehicleStatus.IN_SHOP
        vehicle.version += 1
        self.session.add(vehicle)
        await self.session.flush()
        await self.session.refresh(log)
        return log

    async def close(
        self, maintenance_id: uuid.UUID, close_in: MaintenanceClose
    ) -> MaintenanceLog:
        """
        Close a maintenance log.
        Optionally restore vehicle to 'Available' (default True).
        If there are still open maintenance logs for this vehicle, do NOT restore.
        """
        log = await self.get_by_id(maintenance_id)
        MaintenanceRules.validate_can_be_closed(log)

        log.status = MaintenanceStatus.CLOSED
        log.completed_at = datetime.now(timezone.utc)
        log.actual_cost = close_in.actual_cost
        log.resolution_notes = close_in.resolution_notes

        self.session.add(log)
        await self.session.flush()

        # Conditionally restore vehicle to Available
        if close_in.restore_vehicle_to_available:
            # Check if there are remaining open maintenance logs
            remaining_active = await self.repo.get_active_for_vehicle(log.vehicle_id)
            # Filter out the current log (already closed)
            remaining = [r for r in remaining_active if r.id != maintenance_id]

            if not remaining:
                vehicle = await self.vehicle_repo.get_for_update(log.vehicle_id)
                if vehicle and vehicle.status == VehicleStatus.IN_SHOP:
                    vehicle.status = VehicleStatus.AVAILABLE
                    vehicle.version += 1
                    self.session.add(vehicle)
                    await self.session.flush()

        await self.session.refresh(log)
        return log

    async def update(
        self, maintenance_id: uuid.UUID, maint_in: MaintenanceUpdate
    ) -> MaintenanceLog:
        log = await self.get_by_id(maintenance_id)
        MaintenanceRules.validate_can_be_updated(log)

        update_data = {k: v for k, v in maint_in.model_dump().items() if v is not None}
        if update_data:
            return await self.repo.update(log, update_data)
        return log

    async def delete(self, maintenance_id: uuid.UUID) -> None:
        log = await self.get_by_id(maintenance_id)
        MaintenanceRules.validate_can_be_deleted(log)
        await self.repo.delete(log)
