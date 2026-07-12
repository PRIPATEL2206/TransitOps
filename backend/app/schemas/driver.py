import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator

from app.models.driver import DriverStatus, LicenseClass


class DriverCreate(BaseModel):
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    national_id: Optional[str] = None
    license_number: str
    license_class: LicenseClass = LicenseClass.CLASS_B
    license_expiry_date: date
    notes: Optional[str] = None

    @field_validator("license_number")
    @classmethod
    def license_uppercase(cls, v: str) -> str:
        return v.upper().strip()

    @field_validator("first_name", "last_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()


class DriverUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    national_id: Optional[str] = None
    license_class: Optional[LicenseClass] = None
    license_expiry_date: Optional[date] = None
    status: Optional[DriverStatus] = None
    notes: Optional[str] = None


class DriverResponse(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    national_id: Optional[str] = None
    license_number: str
    license_class: LicenseClass
    license_expiry_date: date
    status: DriverStatus
    is_license_expired: bool
    notes: Optional[str] = None
    version: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DriverListResponse(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    full_name: str
    license_number: str
    license_class: LicenseClass
    license_expiry_date: date
    status: DriverStatus
    is_license_expired: bool

    model_config = {"from_attributes": True}


class DriverPerformanceResponse(BaseModel):
    driver_id: uuid.UUID
    full_name: str
    total_trips: int
    completed_trips: int
    cancelled_trips: int
    total_distance_km: float
    total_fuel_cost: float
    completion_rate: float
