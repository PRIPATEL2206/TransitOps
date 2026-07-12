import enum
from datetime import date
from typing import List, Optional

from sqlalchemy import Date, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class DriverStatus(str, enum.Enum):
    AVAILABLE = "Available"
    ON_TRIP = "On Trip"
    SUSPENDED = "Suspended"
    INACTIVE = "Inactive"


class LicenseClass(str, enum.Enum):
    CLASS_A = "Class A"       # Motorcycles
    CLASS_B = "Class B"       # Light vehicles
    CLASS_C = "Class C"       # Heavy vehicles
    CLASS_D = "Class D"       # Passenger vehicles
    CLASS_E = "Class E"       # Combination vehicles
    COMMERCIAL = "Commercial"


class Driver(BaseModel):
    __tablename__ = "drivers"

    # Personal information
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    national_id: Mapped[Optional[str]] = mapped_column(String(50), unique=True, nullable=True)

    # License information — Using String for SQLite compatibility
    license_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    license_class: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=LicenseClass.CLASS_B.value,
    )
    license_expiry_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Operational status — Using String for SQLite compatibility
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=DriverStatus.AVAILABLE.value,
        index=True,
    )

    # Notes
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Optimistic locking
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    # Relationships
    trips: Mapped[List["Trip"]] = relationship(
        "Trip", back_populates="driver", lazy="select"
    )

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    @property
    def is_license_expired(self) -> bool:
        from datetime import date as date_type
        return self.license_expiry_date < date_type.today()

    @property
    def is_dispatchable(self) -> bool:
        return (
            self.status == DriverStatus.AVAILABLE
            and not self.is_license_expired
        )

    def __repr__(self) -> str:
        return f"<Driver {self.full_name} ({self.status})>"
