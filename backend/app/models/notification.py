import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class NotificationType(str, enum.Enum):
    LICENSE_EXPIRY = "License Expiry"
    MAINTENANCE_DUE = "Maintenance Due"
    TRIP_DISPATCHED = "Trip Dispatched"
    TRIP_COMPLETED = "Trip Completed"
    TRIP_CANCELLED = "Trip Cancelled"
    VEHICLE_IN_SHOP = "Vehicle In Shop"
    VEHICLE_AVAILABLE = "Vehicle Available"
    SYSTEM_ALERT = "System Alert"


class NotificationSeverity(str, enum.Enum):
    INFO = "Info"
    WARNING = "Warning"
    CRITICAL = "Critical"


class Notification(BaseModel):
    __tablename__ = "notifications"

    # Target user (optional - can be broadcast)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    # Notification content
    notification_type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, name="notification_type_enum"),
        nullable=False,
        index=True,
    )
    severity: Mapped[NotificationSeverity] = mapped_column(
        Enum(NotificationSeverity, name="notification_severity_enum"),
        nullable=False,
        default=NotificationSeverity.INFO,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    # Reference entity
    entity_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    entity_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Status
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", lazy="select")

    def __repr__(self) -> str:
        return f"<Notification {self.notification_type} user={self.user_id} read={self.is_read}>"
