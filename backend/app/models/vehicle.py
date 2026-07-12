import enum
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class VehicleStatus(str, enum.Enum):
    AVAILABLE = "Available"
    ON_TRIP = "On Trip"
    IN_SHOP = "In Shop"
    RETIRED = "Retired"


class FuelType(str, enum.Enum):
    PETROL = "Petrol"
    DIESEL = "Diesel"
    ELECTRIC = "Electric"
    HYBRID = "Hybrid"
    CNG = "CNG"


class Vehicle(BaseModel):
    __tablename__ = "vehicles"

    # Identification
    registration_number: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, index=True
    )
    make: Mapped[str] = mapped_column(String(100), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    color: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    vin: Mapped[Optional[str]] = mapped_column(String(50), unique=True, nullable=True)

    # Operational — Using String instead of PostgreSQL Enum for SQLite compatibility
    fuel_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default=FuelType.DIESEL.value
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=VehicleStatus.AVAILABLE.value,
        index=True,
    )
    max_capacity_kg: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False, default=Decimal("0.00")
    )
    odometer_km: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0.00")
    )
    fuel_efficiency_kmpl: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(6, 2), nullable=True
    )

    # Notes
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Optimistic locking
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    # Relationships
    trips: Mapped[List["Trip"]] = relationship(
        "Trip", back_populates="vehicle", lazy="select"
    )
    maintenance_logs: Mapped[List["MaintenanceLog"]] = relationship(
        "MaintenanceLog", back_populates="vehicle", lazy="select"
    )
    fuel_logs: Mapped[List["FuelLog"]] = relationship(
        "FuelLog", back_populates="vehicle", lazy="select"
    )

    @property
    def is_dispatchable(self) -> bool:
        return self.status == VehicleStatus.AVAILABLE

    def __repr__(self) -> str:
        return f"<Vehicle {self.registration_number} ({self.status})>"
