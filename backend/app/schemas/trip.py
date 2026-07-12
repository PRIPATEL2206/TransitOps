import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, field_validator

from app.models.trip import TripStatus
from app.schemas.vehicle import VehicleListResponse
from app.schemas.driver import DriverListResponse


class TripCreate(BaseModel):
    vehicle_id: uuid.UUID
    driver_id: uuid.UUID
    origin: str
    destination: str
    description: Optional[str] = None
    cargo_description: Optional[str] = None
    cargo_weight_kg: Optional[Decimal] = None
    scheduled_departure: Optional[datetime] = None
    scheduled_arrival: Optional[datetime] = None

    @field_validator("cargo_weight_kg")
    @classmethod
    def weight_non_negative(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v < 0:
            raise ValueError("cargo_weight_kg must be non-negative")
        return v

    @field_validator("origin", "destination")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field cannot be empty")
        return v.strip()


class TripDispatch(BaseModel):
    """Used to dispatch (activate) an existing trip."""
    odometer_start_km: Optional[Decimal] = None
    actual_departure: Optional[datetime] = None


class TripComplete(BaseModel):
    """Used to mark a trip as completed."""
    odometer_end_km: Decimal
    actual_arrival: Optional[datetime] = None
    notes: Optional[str] = None

    @field_validator("odometer_end_km")
    @classmethod
    def odometer_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("odometer_end_km must be positive")
        return v


class TripCancel(BaseModel):
    """Used to cancel a trip."""
    cancellation_reason: str

    @field_validator("cancellation_reason")
    @classmethod
    def reason_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("cancellation_reason cannot be empty")
        return v.strip()


class TripUpdate(BaseModel):
    origin: Optional[str] = None
    destination: Optional[str] = None
    description: Optional[str] = None
    cargo_description: Optional[str] = None
    cargo_weight_kg: Optional[Decimal] = None
    scheduled_departure: Optional[datetime] = None
    scheduled_arrival: Optional[datetime] = None


class TripResponse(BaseModel):
    id: uuid.UUID
    trip_number: str
    vehicle_id: uuid.UUID
    driver_id: uuid.UUID
    vehicle: VehicleListResponse
    driver: DriverListResponse
    origin: str
    destination: str
    description: Optional[str] = None
    cargo_description: Optional[str] = None
    cargo_weight_kg: Optional[Decimal] = None
    status: TripStatus
    scheduled_departure: Optional[datetime] = None
    scheduled_arrival: Optional[datetime] = None
    actual_departure: Optional[datetime] = None
    actual_arrival: Optional[datetime] = None
    odometer_start_km: Optional[Decimal] = None
    odometer_end_km: Optional[Decimal] = None
    distance_km: Optional[Decimal] = None
    cancellation_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TripListResponse(BaseModel):
    id: uuid.UUID
    trip_number: str
    vehicle_id: uuid.UUID
    driver_id: uuid.UUID
    origin: str
    destination: str
    status: TripStatus
    scheduled_departure: Optional[datetime] = None
    actual_departure: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}
