from typing import Optional
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db, require_role
from app.models.trip import TripStatus
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.trip import (
    TripCancel,
    TripComplete,
    TripCreate,
    TripDispatch,
    TripListResponse,
    TripResponse,
    TripUpdate,
)
from app.services.trip_service import TripService

router = APIRouter()


@router.get(
    "",
    response_model=PaginatedResponse[TripListResponse],
    summary="List all trips with optional filters",
)
async def list_trips(
    status: Optional[TripStatus] = Query(None),
    vehicle_id: Optional[uuid.UUID] = Query(None),
    driver_id: Optional[uuid.UUID] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = TripService(db)
    skip = (page - 1) * page_size
    items, total = await service.get_all(
        status=status, vehicle_id=vehicle_id, driver_id=driver_id, skip=skip, limit=page_size
    )
    return PaginatedResponse.create(
        items=[TripListResponse.model_validate(t) for t in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{trip_id}", response_model=TripResponse, summary="Get trip by ID")
async def get_trip(
    trip_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = TripService(db)
    return await service.get_by_id(trip_id)


@router.post(
    "",
    response_model=TripResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new trip (Scheduled state)",
)
async def create_trip(
    trip_in: TripCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "dispatcher")),
):
    service = TripService(db)
    return await service.create(trip_in)


@router.put("/{trip_id}", response_model=TripResponse, summary="Update trip details (Scheduled only)")
async def update_trip(
    trip_id: uuid.UUID,
    trip_in: TripUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "dispatcher")),
):
    service = TripService(db)
    return await service.update(trip_id, trip_in)


@router.post(
    "/{trip_id}/dispatch",
    response_model=TripResponse,
    summary="Dispatch a scheduled trip (atomically locks vehicle and driver)",
)
async def dispatch_trip(
    trip_id: uuid.UUID,
    dispatch_in: TripDispatch,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "dispatcher")),
):
    service = TripService(db)
    return await service.dispatch(trip_id, dispatch_in)


@router.post(
    "/{trip_id}/complete",
    response_model=TripResponse,
    summary="Complete an active trip (restores vehicle and driver to Available)",
)
async def complete_trip(
    trip_id: uuid.UUID,
    complete_in: TripComplete,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "dispatcher")),
):
    service = TripService(db)
    return await service.complete(trip_id, complete_in)


@router.post(
    "/{trip_id}/cancel",
    response_model=TripResponse,
    summary="Cancel a trip (restores vehicle/driver if dispatched)",
)
async def cancel_trip(
    trip_id: uuid.UUID,
    cancel_in: TripCancel,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "dispatcher")),
):
    service = TripService(db)
    return await service.cancel(trip_id, cancel_in)


@router.delete(
    "/{trip_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a trip (Scheduled or Cancelled only)",
)
async def delete_trip(
    trip_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    service = TripService(db)
    await service.delete(trip_id)
