import uuid
from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional, Tuple

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.expense import Expense, ExpenseCategory, ExpenseStatus
from app.repositories.base import BaseRepository


class ExpenseRepository(BaseRepository[Expense]):
    def __init__(self, session: AsyncSession):
        super().__init__(Expense, session)

    async def get_all_with_filters(
        self,
        *,
        vehicle_id: Optional[uuid.UUID] = None,
        driver_id: Optional[uuid.UUID] = None,
        trip_id: Optional[uuid.UUID] = None,
        category: Optional[ExpenseCategory] = None,
        status: Optional[ExpenseStatus] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[Expense], int]:
        query = select(Expense)
        count_query = select(func.count()).select_from(Expense)

        filters = []
        if vehicle_id:
            filters.append(Expense.vehicle_id == vehicle_id)
        if driver_id:
            filters.append(Expense.driver_id == driver_id)
        if trip_id:
            filters.append(Expense.trip_id == trip_id)
        if category:
            filters.append(Expense.category == category)
        if status:
            filters.append(Expense.status == status)
        if date_from:
            filters.append(Expense.incurred_at >= date_from)
        if date_to:
            filters.append(Expense.incurred_at <= date_to)

        if filters:
            from sqlalchemy import and_
            query = query.where(and_(*filters))
            count_query = count_query.where(and_(*filters))

        count_result = await self.session.execute(count_query)
        total = count_result.scalar_one()

        query = query.order_by(Expense.incurred_at.desc()).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all()), total

    async def get_summary(
        self,
        *,
        vehicle_id: Optional[uuid.UUID] = None,
        trip_id: Optional[uuid.UUID] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> Dict:
        query = select(
            Expense.category,
            Expense.currency,
            func.sum(Expense.amount).label("total_amount"),
            func.count(Expense.id).label("count"),
        ).group_by(Expense.category, Expense.currency)

        if vehicle_id:
            query = query.where(Expense.vehicle_id == vehicle_id)
        if trip_id:
            query = query.where(Expense.trip_id == trip_id)
        if date_from:
            query = query.where(Expense.incurred_at >= date_from)
        if date_to:
            query = query.where(Expense.incurred_at <= date_to)

        result = await self.session.execute(query)
        rows = result.all()

        by_category: Dict[str, Decimal] = {}
        by_currency: Dict[str, Decimal] = {}
        total_amount = Decimal("0.00")
        total_count = 0

        for row in rows:
            cat = row.category.value if hasattr(row.category, 'value') else str(row.category)
            by_category[cat] = by_category.get(cat, Decimal("0.00")) + Decimal(str(row.total_amount))
            by_currency[row.currency] = by_currency.get(row.currency, Decimal("0.00")) + Decimal(str(row.total_amount))
            total_amount += Decimal(str(row.total_amount))
            total_count += row.count

        return {
            "total_amount": total_amount,
            "total_count": total_count,
            "by_category": by_category,
            "by_currency": by_currency,
        }

    async def get_monthly_total(
        self,
        vehicle_id: Optional[uuid.UUID] = None,
        year: Optional[int] = None,
        month: Optional[int] = None,
    ) -> Decimal:
        from sqlalchemy import extract

        query = select(func.coalesce(func.sum(Expense.amount), 0))

        if vehicle_id:
            query = query.where(Expense.vehicle_id == vehicle_id)
        if year:
            query = query.where(extract("year", Expense.incurred_at) == year)
        if month:
            query = query.where(extract("month", Expense.incurred_at) == month)

        result = await self.session.execute(query)
        return Decimal(str(result.scalar_one()))
