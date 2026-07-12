from typing import Optional
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db, require_role
from app.models.maintenance import MaintenanceStatus
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.maintenance import (
    MaintenanceClose,
    MaintenanceCreate,
    MaintenanceResponse,
    MaintenanceUpdate,
)
from app.services.maintenance_service import MaintenanceService

router = APIRouter()


@router.get(
    "",
    response_model=PaginatedResponse[MaintenanceResponse],
    summary="List all maintenance logs",
)
async def list_maintenance(
    vehicle_id: Optional[uuid.UUID] = Query(None),
    status: Optional[MaintenanceStatus] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = MaintenanceService(db)
    skip = (page - 1) * page_size
    items, total = await service.get_all(
        vehicle_id=vehicle_id, status=status, skip=skip, limit=page_size
    )
    return PaginatedResponse.create(
        items=[MaintenanceResponse.model_validate(m) for m in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{maintenance_id}",
    response_model=MaintenanceResponse,
    summary="Get maintenance log by ID",
)
async def get_maintenance(
    maintenance_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = MaintenanceService(db)
    return await service.get_by_id(maintenance_id)


@router.post(
    "",
    response_model=MaintenanceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create maintenance log (auto sets vehicle to In Shop)",
)
async def create_maintenance(
    maint_in: MaintenanceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    service = MaintenanceService(db)
    return await service.create(maint_in)


@router.put(
    "/{maintenance_id}",
    response_model=MaintenanceResponse,
    summary="Update maintenance log (Open/In Progress only)",
)
async def update_maintenance(
    maintenance_id: uuid.UUID,
    maint_in: MaintenanceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    service = MaintenanceService(db)
    return await service.update(maintenance_id, maint_in)


@router.post(
    "/{maintenance_id}/close",
    response_model=MaintenanceResponse,
    summary="Close a maintenance log (conditionally restores vehicle to Available)",
)
async def close_maintenance(
    maintenance_id: uuid.UUID,
    close_in: MaintenanceClose,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    service = MaintenanceService(db)
    return await service.close(maintenance_id, close_in)


@router.delete(
    "/{maintenance_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a maintenance log (Open only)",
)
async def delete_maintenance(
    maintenance_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    service = MaintenanceService(db)
    await service.delete(maintenance_id)
