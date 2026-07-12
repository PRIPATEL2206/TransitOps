import enum
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class TripStatus(str, enum.Enum):
    SCHEDULED = "Scheduled"
    DISPATCHED = "Dispatched"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


class Trip(BaseModel):
    __tablename__ = "trips"

    # Foreign keys
    vehicle_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    driver_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("drivers.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    # Trip details
    trip_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    origin: Mapped[str] = mapped_column(String(255), nullable=False)
    destination: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Cargo
    cargo_description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    cargo_weight_kg: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)

    # Status and lifecycle
    status: Mapped[TripStatus] = mapped_column(
        Enum(TripStatus, name="trip_status_enum"),
        nullable=False,
        default=TripStatus.SCHEDULED,
        index=True,
    )

    # Scheduled times
    scheduled_departure: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    scheduled_arrival: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Actual times (set on dispatch / completion)
    actual_departure: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    actual_arrival: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Odometer readings
    odometer_start_km: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    odometer_end_km: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)

    # Cancellation
    cancellation_reason: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Relationships
    vehicle: Mapped["Vehicle"] = relationship("Vehicle", back_populates="trips", lazy="selectin")
    driver: Mapped["Driver"] = relationship("Driver", back_populates="trips", lazy="selectin")
    expenses: Mapped[list["Expense"]] = relationship("Expense", back_populates="trip", lazy="select")

    @property
    def distance_km(self) -> Optional[Decimal]:
        if self.odometer_start_km is not None and self.odometer_end_km is not None:
            return self.odometer_end_km - self.odometer_start_km
        return None

    def __repr__(self) -> str:
        return f"<Trip {self.trip_number} ({self.status})>"
