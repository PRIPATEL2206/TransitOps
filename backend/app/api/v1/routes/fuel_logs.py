from typing import Optional
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db, require_role
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.fuel_log import FuelLogCreate, FuelLogResponse, FuelLogUpdate
from app.services.fuel_service import FuelService

router = APIRouter()


@router.get(
    "",
    response_model=PaginatedResponse[FuelLogResponse],
    summary="List all fuel logs",
)
async def list_fuel_logs(
    vehicle_id: Optional[uuid.UUID] = Query(None),
    trip_id: Optional[uuid.UUID] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = FuelService(db)
    skip = (page - 1) * page_size
    items, total = await service.get_all(
        vehicle_id=vehicle_id, trip_id=trip_id, skip=skip, limit=page_size
    )
    return PaginatedResponse.create(
        items=[FuelLogResponse.model_validate(f) for f in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{log_id}", response_model=FuelLogResponse, summary="Get fuel log by ID")
async def get_fuel_log(
    log_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = FuelService(db)
    return await service.get_by_id(log_id)


@router.post(
    "",
    response_model=FuelLogResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record a fuel log entry",
)
async def create_fuel_log(
    log_in: FuelLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "dispatcher")),
):
    service = FuelService(db)
    return await service.create(log_in)


@router.put("/{log_id}", response_model=FuelLogResponse, summary="Update fuel log")
async def update_fuel_log(
    log_id: uuid.UUID,
    log_in: FuelLogUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    service = FuelService(db)
    return await service.update(log_id, log_in)


@router.delete(
    "/{log_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a fuel log",
)
async def delete_fuel_log(
    log_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    service = FuelService(db)
    await service.delete(log_id)
