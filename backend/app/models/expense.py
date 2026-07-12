import enum
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


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
    vehicle_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True, index=True
    )
    driver_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("drivers.id", ondelete="SET NULL"), nullable=True
    )
    trip_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("trips.id", ondelete="SET NULL"), nullable=True
    )

    # Expense details
    category: Mapped[ExpenseCategory] = mapped_column(
        Enum(ExpenseCategory, name="expense_category_enum"),
        nullable=False,
        index=True,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    receipt_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Status
    status: Mapped[ExpenseStatus] = mapped_column(
        Enum(ExpenseStatus, name="expense_status_enum"),
        nullable=False,
        default=ExpenseStatus.PENDING,
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
