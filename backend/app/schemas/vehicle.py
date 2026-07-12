import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, field_validator

from app.models.vehicle import VehicleStatus, FuelType


class VehicleCreate(BaseModel):
    registration_number: str
    make: str
    model: str
    year: int
    color: Optional[str] = None
    vin: Optional[str] = None
    fuel_type: FuelType = FuelType.DIESEL
    max_capacity_kg: Decimal = Decimal("0.00")
    odometer_km: Decimal = Decimal("0.00")
    fuel_efficiency_kmpl: Optional[Decimal] = None
    notes: Optional[str] = None

    @field_validator("registration_number")
    @classmethod
    def registration_uppercase(cls, v: str) -> str:
        return v.upper().strip()

    @field_validator("year")
    @classmethod
    def year_valid(cls, v: int) -> int:
        if v < 1900 or v > datetime.now().year + 2:
            raise ValueError(f"Year {v} is not valid")
        return v

    @field_validator("max_capacity_kg")
    @classmethod
    def capacity_positive(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("max_capacity_kg must be non-negative")
        return v

    @field_validator("odometer_km")
    @classmethod
    def odometer_non_negative(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("odometer_km must be non-negative")
        return v


class VehicleUpdate(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    color: Optional[str] = None
    vin: Optional[str] = None
    fuel_type: Optional[FuelType] = None
    status: Optional[VehicleStatus] = None
    max_capacity_kg: Optional[Decimal] = None
    fuel_efficiency_kmpl: Optional[Decimal] = None
    notes: Optional[str] = None

    @field_validator("year")
    @classmethod
    def year_valid(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 1900 or v > datetime.now().year + 2):
            raise ValueError(f"Year {v} is not valid")
        return v


class VehicleResponse(BaseModel):
    id: uuid.UUID
    registration_number: str
    make: str
    model: str
    year: int
    color: Optional[str] = None
    vin: Optional[str] = None
    fuel_type: FuelType
    status: VehicleStatus
    max_capacity_kg: Decimal
    odometer_km: Decimal
    fuel_efficiency_kmpl: Optional[Decimal] = None
    notes: Optional[str] = None
    version: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class VehicleListResponse(BaseModel):
    id: uuid.UUID
    registration_number: str
    make: str
    model: str
    year: int
    fuel_type: FuelType
    status: VehicleStatus
    max_capacity_kg: Decimal
    odometer_km: Decimal

    model_config = {"from_attributes": True}
