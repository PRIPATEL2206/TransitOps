import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel

from app.models.maintenance import MaintenanceType, MaintenanceStatus


class MaintenanceCreate(BaseModel):
    vehicle_id: uuid.UUID
    maintenance_type: MaintenanceType = MaintenanceType.PREVENTIVE
    description: str
    performed_by: Optional[str] = None
    workshop_name: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    estimated_cost: Optional[Decimal] = None
    odometer_at_service_km: Optional[Decimal] = None


class MaintenanceUpdate(BaseModel):
    maintenance_type: Optional[MaintenanceType] = None
    description: Optional[str] = None
    performed_by: Optional[str] = None
    workshop_name: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    estimated_cost: Optional[Decimal] = None
    odometer_at_service_km: Optional[Decimal] = None


class MaintenanceClose(BaseModel):
    """Used to close a maintenance log."""
    actual_cost: Optional[Decimal] = None
    resolution_notes: str
    restore_vehicle_to_available: bool = True


class MaintenanceResponse(BaseModel):
    id: uuid.UUID
    vehicle_id: uuid.UUID
    maintenance_type: MaintenanceType
    status: MaintenanceStatus
    description: str
    performed_by: Optional[str] = None
    workshop_name: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    estimated_cost: Optional[Decimal] = None
    actual_cost: Optional[Decimal] = None
    odometer_at_service_km: Optional[Decimal] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
