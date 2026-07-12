import enum
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, GUID


class FuelType(str, enum.Enum):
    PETROL = "Petrol"
    DIESEL = "Diesel"
    ELECTRIC = "Electric"  # kWh unit
    CNG = "CNG"


class FuelLog(BaseModel):
    __tablename__ = "fuel_logs"

    # Foreign key
    vehicle_id: Mapped[str] = mapped_column(
        GUID(), ForeignKey("vehicles.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    trip_id: Mapped[Optional[str]] = mapped_column(
        GUID(), ForeignKey("trips.id", ondelete="SET NULL"), nullable=True
    )

    # Fuel details
    fuel_type: Mapped[str] = mapped_column(String(20), nullable=False)
    quantity_liters: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    price_per_unit: Mapped[Decimal] = mapped_column(Numeric(10, 4), nullable=False)
    total_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    # Odometer at fill-up
    odometer_km: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    # Station details
    station_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Fill date
    filled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    vehicle: Mapped["Vehicle"] = relationship("Vehicle", back_populates="fuel_logs", lazy="selectin")
    trip: Mapped[Optional["Trip"]] = relationship("Trip", lazy="select")

    def __repr__(self) -> str:
        return f"<FuelLog {self.id} vehicle={self.vehicle_id} qty={self.quantity_liters}L>"
