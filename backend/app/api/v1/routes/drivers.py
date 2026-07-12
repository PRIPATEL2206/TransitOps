from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db, require_role
from app.models.driver import DriverStatus
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.driver import (
    DriverCreate,
    DriverListResponse,
    DriverPerformanceResponse,
    DriverResponse,
    DriverUpdate,
)
from app.services.driver_service import DriverService

router = APIRouter()


@router.get(
    "",
    response_model=PaginatedResponse[DriverListResponse],
    summary="List all drivers with optional filters",
)
async def list_drivers(
    status: Optional[DriverStatus] = Query(None),
    search: Optional[str] = Query(None, description="Search by name, license number, or email"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = DriverService(db)
    skip = (page - 1) * page_size
    items, total = await service.get_all(status=status, search=search, skip=skip, limit=page_size)
    return PaginatedResponse.create(
        items=[DriverListResponse.model_validate(d) for d in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/available",
    response_model=List[DriverListResponse],
    summary="Get all available drivers with valid licenses",
)
async def get_available_drivers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = DriverService(db)
    drivers = await service.get_available()
    return [DriverListResponse.model_validate(d) for d in drivers]


@router.get(
    "/expiring-licenses",
    response_model=List[DriverListResponse],
    summary="Get drivers with licenses expiring within N days",
)
async def get_expiring_licenses(
    within_days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = DriverService(db)
    drivers = await service.get_expiring_licenses(within_days)
    return [DriverListResponse.model_validate(d) for d in drivers]


@router.get("/{driver_id}", response_model=DriverResponse, summary="Get driver by ID")
async def get_driver(
    driver_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = DriverService(db)
    return await service.get_by_id(driver_id)


@router.post(
    "",
    response_model=DriverResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new driver",
)
async def create_driver(
    driver_in: DriverCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    service = DriverService(db)
    return await service.create(driver_in)


@router.put("/{driver_id}", response_model=DriverResponse, summary="Update driver")
async def update_driver(
    driver_id: uuid.UUID,
    driver_in: DriverUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    service = DriverService(db)
    return await service.update(driver_id, driver_in)


@router.delete(
    "/{driver_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a driver",
)
async def delete_driver(
    driver_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    service = DriverService(db)
    await service.delete(driver_id)


@router.post(
    "/{driver_id}/suspend",
    response_model=DriverResponse,
    summary="Suspend a driver",
)
async def suspend_driver(
    driver_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    service = DriverService(db)
    return await service.suspend(driver_id)


@router.post(
    "/{driver_id}/reinstate",
    response_model=DriverResponse,
    summary="Reinstate a suspended driver",
)
async def reinstate_driver(
    driver_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    service = DriverService(db)
    return await service.reinstate(driver_id)
