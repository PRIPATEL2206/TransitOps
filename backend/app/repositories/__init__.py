from app.repositories.base import BaseRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.repositories.driver_repository import DriverRepository
from app.repositories.trip_repository import TripRepository
from app.repositories.maintenance_repository import MaintenanceRepository
from app.repositories.fuel_repository import FuelRepository
from app.repositories.expense_repository import ExpenseRepository
from app.repositories.analytics_repository import AnalyticsRepository

__all__ = [
    "BaseRepository",
    "VehicleRepository",
    "DriverRepository",
    "TripRepository",
    "MaintenanceRepository",
    "FuelRepository",
    "ExpenseRepository",
    "AnalyticsRepository",
]
