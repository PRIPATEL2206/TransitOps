from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.schemas.analytics import (
    DashboardKPIs,
    DriverPerformance,
    FleetUtilization,
    VehicleROI,
)
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get(
    "/dashboard",
    response_model=DashboardKPIs,
    summary="Get dashboard KPIs and summary metrics",
)
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = AnalyticsService(db)
    return await service.get_dashboard_kpis()


@router.get(
    "/fleet-utilization",
    response_model=List[FleetUtilization],
    summary="Get fleet utilization report per vehicle",
)
async def get_fleet_utilization(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = AnalyticsService(db)
    return await service.get_fleet_utilization()


@router.get(
    "/vehicle-roi",
    response_model=List[VehicleROI],
    summary="Get vehicle ROI and cost analysis",
)
async def get_vehicle_roi(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = AnalyticsService(db)
    return await service.get_vehicle_roi()


@router.get(
    "/driver-performance",
    response_model=List[DriverPerformance],
    summary="Get driver performance metrics",
)
async def get_driver_performance(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = AnalyticsService(db)
    return await service.get_driver_performance()
