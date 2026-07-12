import enum
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, GUID


class ExpenseCategory(str, enum.Enum):
    FUEL = "Fuel"
    MAINTENANCE = "Maintenance"
    TOLL = "Toll"
    PARKING = "Parking"
    ACCOMMODATION = "Accommodation"
    MEALS = "Meals"
    INSURANCE = "Insurance"
    REGISTRATION = "Registration"
    FINES = "Fines"
    MISCELLANEOUS = "Miscellaneous"


class ExpenseStatus(str, enum.Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    REIMBURSED = "Reimbursed"


class Expense(BaseModel):
    __tablename__ = "expenses"

    # Foreign keys
    vehicle_id: Mapped[Optional[str]] = mapped_column(
        GUID(), ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True, index=True
    )
    driver_id: Mapped[Optional[str]] = mapped_column(
        GUID(), ForeignKey("drivers.id", ondelete="SET NULL"), nullable=True
    )
    trip_id: Mapped[Optional[str]] = mapped_column(
        GUID(), ForeignKey("trips.id", ondelete="SET NULL"), nullable=True
    )

    # Expense details
    category: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        index=True,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    receipt_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Status
    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default=ExpenseStatus.PENDING.value,
        index=True,
    )

    # Timing
    incurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    vehicle: Mapped[Optional["Vehicle"]] = relationship("Vehicle", lazy="select")
    driver: Mapped[Optional["Driver"]] = relationship("Driver", lazy="select")
    trip: Mapped[Optional["Trip"]] = relationship("Trip", back_populates="expenses", lazy="select")

    def __repr__(self) -> str:
        return f"<Expense {self.id} {self.category} amount={self.amount}>"
