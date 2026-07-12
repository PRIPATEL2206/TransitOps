import enum
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class MaintenanceType(str, enum.Enum):
    PREVENTIVE = "Preventive"
    CORRECTIVE = "Corrective"
    EMERGENCY = "Emergency"
    INSPECTION = "Inspection"
    RECALL = "Recall"


class MaintenanceStatus(str, enum.Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    CLOSED = "Closed"


class MaintenanceLog(BaseModel):
    __tablename__ = "maintenance_logs"

    # Foreign key
    vehicle_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    # Maintenance details
    maintenance_type: Mapped[MaintenanceType] = mapped_column(
        Enum(MaintenanceType, name="maintenance_type_enum"),
        nullable=False,
        default=MaintenanceType.PREVENTIVE,
    )
    status: Mapped[MaintenanceStatus] = mapped_column(
        Enum(MaintenanceStatus, name="maintenance_status_enum"),
        nullable=False,
        default=MaintenanceStatus.OPEN,
        index=True,
    )

    description: Mapped[str] = mapped_column(Text, nullable=False)
    performed_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    workshop_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Dates
    scheduled_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Cost
    estimated_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    actual_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)

    # Odometer at maintenance
    odometer_at_service_km: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)

    # Closing notes
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    vehicle: Mapped["Vehicle"] = relationship("Vehicle", back_populates="maintenance_logs", lazy="selectin")

    def __repr__(self) -> str:
        return f"<MaintenanceLog {self.id} vehicle={self.vehicle_id} status={self.status}>"
