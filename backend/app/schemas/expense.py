import uuid
from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional

from pydantic import BaseModel

from app.models.expense import ExpenseCategory, ExpenseStatus


class ExpenseCreate(BaseModel):
    vehicle_id: Optional[uuid.UUID] = None
    driver_id: Optional[uuid.UUID] = None
    trip_id: Optional[uuid.UUID] = None
    category: ExpenseCategory
    amount: Decimal
    currency: str = "USD"
    description: str
    receipt_reference: Optional[str] = None
    incurred_at: datetime
    notes: Optional[str] = None


class ExpenseUpdate(BaseModel):
    category: Optional[ExpenseCategory] = None
    amount: Optional[Decimal] = None
    currency: Optional[str] = None
    description: Optional[str] = None
    receipt_reference: Optional[str] = None
    status: Optional[ExpenseStatus] = None
    incurred_at: Optional[datetime] = None
    notes: Optional[str] = None


class ExpenseResponse(BaseModel):
    id: uuid.UUID
    vehicle_id: Optional[uuid.UUID] = None
    driver_id: Optional[uuid.UUID] = None
    trip_id: Optional[uuid.UUID] = None
    category: ExpenseCategory
    amount: Decimal
    currency: str
    description: str
    receipt_reference: Optional[str] = None
    status: ExpenseStatus
    incurred_at: datetime
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ExpenseSummaryResponse(BaseModel):
    total_amount: Decimal
    total_count: int
    by_category: Dict[str, Decimal]
    by_currency: Dict[str, Decimal]
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
