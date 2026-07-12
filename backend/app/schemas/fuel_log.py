import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, field_validator


class FuelLogCreate(BaseModel):
    vehicle_id: uuid.UUID
    trip_id: Optional[uuid.UUID] = None
    fuel_type: str
    quantity_liters: Decimal
    price_per_unit: Decimal
    total_cost: Decimal
    odometer_km: Decimal
    station_name: Optional[str] = None
    location: Optional[str] = None
    filled_at: datetime
    notes: Optional[str] = None

    @field_validator("quantity_liters")
    @classmethod
    def quantity_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("quantity_liters must be positive")
        return v

    @field_validator("price_per_unit")
    @classmethod
    def price_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("price_per_unit must be positive")
        return v

    @field_validator("odometer_km")
    @classmethod
    def odometer_non_negative(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("odometer_km must be non-negative")
        return v


class FuelLogUpdate(BaseModel):
    fuel_type: Optional[str] = None
    quantity_liters: Optional[Decimal] = None
    price_per_unit: Optional[Decimal] = None
    total_cost: Optional[Decimal] = None
    odometer_km: Optional[Decimal] = None
    station_name: Optional[str] = None
    location: Optional[str] = None
    filled_at: Optional[datetime] = None
    notes: Optional[str] = None


class FuelLogResponse(BaseModel):
    id: uuid.UUID
    vehicle_id: uuid.UUID
    trip_id: Optional[uuid.UUID] = None
    fuel_type: str
    quantity_liters: Decimal
    price_per_unit: Decimal
    total_cost: Decimal
    odometer_km: Decimal
    station_name: Optional[str] = None
    location: Optional[str] = None
    filled_at: datetime
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
