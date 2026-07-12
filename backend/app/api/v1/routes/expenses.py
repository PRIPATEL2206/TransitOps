from datetime import datetime
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db, require_role
from app.models.expense import ExpenseCategory, ExpenseStatus
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseResponse,
    ExpenseSummaryResponse,
    ExpenseUpdate,
)
from app.services.expense_service import ExpenseService

router = APIRouter()


@router.get(
    "",
    response_model=PaginatedResponse[ExpenseResponse],
    summary="List all expenses with optional filters",
)
async def list_expenses(
    vehicle_id: Optional[uuid.UUID] = Query(None),
    driver_id: Optional[uuid.UUID] = Query(None),
    trip_id: Optional[uuid.UUID] = Query(None),
    category: Optional[ExpenseCategory] = Query(None),
    expense_status: Optional[ExpenseStatus] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = ExpenseService(db)
    skip = (page - 1) * page_size
    items, total = await service.get_all(
        vehicle_id=vehicle_id,
        driver_id=driver_id,
        trip_id=trip_id,
        category=category,
        status=expense_status,
        date_from=date_from,
        date_to=date_to,
        skip=skip,
        limit=page_size,
    )
    return PaginatedResponse.create(
        items=[ExpenseResponse.model_validate(e) for e in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/summary",
    response_model=ExpenseSummaryResponse,
    summary="Get expense summary/aggregation",
)
async def get_expense_summary(
    vehicle_id: Optional[uuid.UUID] = Query(None),
    trip_id: Optional[uuid.UUID] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = ExpenseService(db)
    return await service.get_summary(
        vehicle_id=vehicle_id, trip_id=trip_id, date_from=date_from, date_to=date_to
    )


@router.get("/{expense_id}", response_model=ExpenseResponse, summary="Get expense by ID")
async def get_expense(
    expense_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = ExpenseService(db)
    return await service.get_by_id(expense_id)


@router.post(
    "",
    response_model=ExpenseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new expense record",
)
async def create_expense(
    expense_in: ExpenseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "dispatcher")),
):
    service = ExpenseService(db)
    return await service.create(expense_in)


@router.put("/{expense_id}", response_model=ExpenseResponse, summary="Update an expense")
async def update_expense(
    expense_id: uuid.UUID,
    expense_in: ExpenseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    service = ExpenseService(db)
    return await service.update(expense_id, expense_in)


@router.post(
    "/{expense_id}/approve",
    response_model=ExpenseResponse,
    summary="Approve an expense",
)
async def approve_expense(
    expense_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    service = ExpenseService(db)
    return await service.approve(expense_id)


@router.post(
    "/{expense_id}/reject",
    response_model=ExpenseResponse,
    summary="Reject an expense",
)
async def reject_expense(
    expense_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    service = ExpenseService(db)
    return await service.reject(expense_id)


@router.delete(
    "/{expense_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an expense",
)
async def delete_expense(
    expense_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    service = ExpenseService(db)
    await service.delete(expense_id)
