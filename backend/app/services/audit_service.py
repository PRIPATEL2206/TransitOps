import uuid
from typing import Any, Dict, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


class AuditService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def log(
        self,
        *,
        action: str,
        entity_type: str,
        entity_id: Optional[str] = None,
        user_id: Optional[uuid.UUID] = None,
        user_email: Optional[str] = None,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        description: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> AuditLog:
        log_entry = AuditLog(
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            user_id=user_id,
            user_email=user_email,
            old_values=old_values,
            new_values=new_values,
            description=description,
            ip_address=ip_address,
            user_agent=user_agent,
            request_id=request_id,
        )
        self.session.add(log_entry)
        await self.session.flush()
        return log_entry

    async def log_create(
        self,
        entity_type: str,
        entity_id: str,
        new_values: Dict[str, Any],
        user_id: Optional[uuid.UUID] = None,
        user_email: Optional[str] = None,
    ) -> AuditLog:
        return await self.log(
            action="CREATE",
            entity_type=entity_type,
            entity_id=entity_id,
            new_values=new_values,
            user_id=user_id,
            user_email=user_email,
        )

    async def log_update(
        self,
        entity_type: str,
        entity_id: str,
        old_values: Dict[str, Any],
        new_values: Dict[str, Any],
        user_id: Optional[uuid.UUID] = None,
        user_email: Optional[str] = None,
    ) -> AuditLog:
        return await self.log(
            action="UPDATE",
            entity_type=entity_type,
            entity_id=entity_id,
            old_values=old_values,
            new_values=new_values,
            user_id=user_id,
            user_email=user_email,
        )

    async def log_delete(
        self,
        entity_type: str,
        entity_id: str,
        old_values: Dict[str, Any],
        user_id: Optional[uuid.UUID] = None,
        user_email: Optional[str] = None,
    ) -> AuditLog:
        return await self.log(
            action="DELETE",
            entity_type=entity_type,
            entity_id=entity_id,
            old_values=old_values,
            user_id=user_id,
            user_email=user_email,
        )

    async def log_dispatch(
        self,
        trip_id: str,
        vehicle_id: str,
        driver_id: str,
        user_id: Optional[uuid.UUID] = None,
        user_email: Optional[str] = None,
    ) -> AuditLog:
        return await self.log(
            action="TRIP_DISPATCH",
            entity_type="Trip",
            entity_id=trip_id,
            new_values={"vehicle_id": vehicle_id, "driver_id": driver_id},
            description=f"Trip dispatched with vehicle {vehicle_id} and driver {driver_id}",
            user_id=user_id,
            user_email=user_email,
        )

    async def log_trip_complete(
        self,
        trip_id: str,
        odometer_end_km: float,
        user_id: Optional[uuid.UUID] = None,
        user_email: Optional[str] = None,
    ) -> AuditLog:
        return await self.log(
            action="TRIP_COMPLETE",
            entity_type="Trip",
            entity_id=trip_id,
            new_values={"odometer_end_km": odometer_end_km},
            description=f"Trip completed at odometer {odometer_end_km} km",
            user_id=user_id,
            user_email=user_email,
        )
