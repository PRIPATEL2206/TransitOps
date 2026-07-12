import uuid
from datetime import datetime
from typing import Dict, List, Optional, Tuple

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.expense import Expense, ExpenseCategory, ExpenseStatus
from app.repositories.expense_repository import ExpenseRepository
from app.schemas.expense import ExpenseCreate, ExpenseSummaryResponse, ExpenseUpdate


class ExpenseService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = ExpenseRepository(session)

    async def get_by_id(self, expense_id: uuid.UUID) -> Expense:
        expense = await self.repo.get_by_id(expense_id)
        if not expense:
            raise NotFoundError("Expense", str(expense_id))
        return expense

    async def get_all(
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
        return await self.repo.get_all_with_filters(
            vehicle_id=vehicle_id,
            driver_id=driver_id,
            trip_id=trip_id,
            category=category,
            status=status,
            date_from=date_from,
            date_to=date_to,
            skip=skip,
            limit=limit,
        )

    async def create(self, expense_in: ExpenseCreate) -> Expense:
        expense_data = expense_in.model_dump()
        return await self.repo.create(expense_data)

    async def update(self, expense_id: uuid.UUID, expense_in: ExpenseUpdate) -> Expense:
        expense = await self.get_by_id(expense_id)
        update_data = {k: v for k, v in expense_in.model_dump().items() if v is not None}
        if update_data:
            return await self.repo.update(expense, update_data)
        return expense

    async def approve(self, expense_id: uuid.UUID) -> Expense:
        expense = await self.get_by_id(expense_id)
        expense.status = ExpenseStatus.APPROVED
        self.session.add(expense)
        await self.session.flush()
        await self.session.refresh(expense)
        return expense

    async def reject(self, expense_id: uuid.UUID) -> Expense:
        expense = await self.get_by_id(expense_id)
        expense.status = ExpenseStatus.REJECTED
        self.session.add(expense)
        await self.session.flush()
        await self.session.refresh(expense)
        return expense

    async def delete(self, expense_id: uuid.UUID) -> None:
        expense = await self.get_by_id(expense_id)
        await self.repo.delete(expense)

    async def get_summary(
        self,
        *,
        vehicle_id: Optional[uuid.UUID] = None,
        trip_id: Optional[uuid.UUID] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> ExpenseSummaryResponse:
        summary = await self.repo.get_summary(
            vehicle_id=vehicle_id,
            trip_id=trip_id,
            date_from=date_from,
            date_to=date_to,
        )
        return ExpenseSummaryResponse(
            total_amount=summary["total_amount"],
            total_count=summary["total_count"],
            by_category=summary["by_category"],
            by_currency=summary["by_currency"],
            period_start=date_from,
            period_end=date_to,
        )
