from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db, require_role
from app.models.user import User
from app.models.vehicle import VehicleStatus
from app.schemas.common import PaginatedResponse
from app.schemas.vehicle import VehicleCreate, VehicleListResponse, VehicleResponse, VehicleUpdate
from app.services.vehicle_service import VehicleService

router = APIRouter()


@router.get(
    "",
    response_model=PaginatedResponse[VehicleListResponse],
    summary="List all vehicles with optional filters",
)
async def list_vehicles(
    status: Optional[VehicleStatus] = Query(None),
    search: Optional[str] = Query(None, description="Search by registration, make, or model"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = VehicleService(db)
    skip = (page - 1) * page_size
    items, total = await service.get_all(status=status, search=search, skip=skip, limit=page_size)
    return PaginatedResponse.create(
        items=[VehicleListResponse.model_validate(v) for v in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/available",
    response_model=List[VehicleListResponse],
    summary="Get all available vehicles",
)
async def get_available_vehicles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = VehicleService(db)
    vehicles = await service.get_available()
    return [VehicleListResponse.model_validate(v) for v in vehicles]


@router.get("/{vehicle_id}", response_model=VehicleResponse, summary="Get vehicle by ID")
async def get_vehicle(
    vehicle_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = VehicleService(db)
    return await service.get_by_id(vehicle_id)


@router.post(
    "",
    response_model=VehicleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new vehicle",
)
async def create_vehicle(
    vehicle_in: VehicleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    service = VehicleService(db)
    return await service.create(vehicle_in)


@router.put("/{vehicle_id}", response_model=VehicleResponse, summary="Update vehicle")
async def update_vehicle(
    vehicle_id: uuid.UUID,
    vehicle_in: VehicleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    service = VehicleService(db)
    return await service.update(vehicle_id, vehicle_in)


@router.delete(
    "/{vehicle_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a vehicle",
)
async def delete_vehicle(
    vehicle_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    service = VehicleService(db)
    await service.delete(vehicle_id)


@router.post(
    "/{vehicle_id}/retire",
    response_model=VehicleResponse,
    summary="Retire a vehicle",
)
async def retire_vehicle(
    vehicle_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    service = VehicleService(db)
    return await service.retire(vehicle_id)
