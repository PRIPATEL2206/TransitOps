from app.schemas.auth import LoginRequest, TokenResponse, TokenRefreshRequest, UserResponse, UserCreate, UserUpdate
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleResponse, VehicleListResponse
from app.schemas.driver import DriverCreate, DriverUpdate, DriverResponse, DriverListResponse
from app.schemas.trip import TripCreate, TripDispatch, TripComplete, TripCancel, TripResponse, TripListResponse
from app.schemas.maintenance import MaintenanceCreate, MaintenanceUpdate, MaintenanceClose, MaintenanceResponse
from app.schemas.fuel_log import FuelLogCreate, FuelLogUpdate, FuelLogResponse
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse, ExpenseSummaryResponse
from app.schemas.analytics import DashboardKPIs, FleetUtilization, VehicleROI, DriverPerformance
from app.schemas.common import PaginatedResponse, ErrorResponse, SuccessResponse, MessageResponse

__all__ = [
    "LoginRequest", "TokenResponse", "TokenRefreshRequest", "UserResponse", "UserCreate", "UserUpdate",
    "VehicleCreate", "VehicleUpdate", "VehicleResponse", "VehicleListResponse",
    "DriverCreate", "DriverUpdate", "DriverResponse", "DriverListResponse",
    "TripCreate", "TripDispatch", "TripComplete", "TripCancel", "TripResponse", "TripListResponse",
    "MaintenanceCreate", "MaintenanceUpdate", "MaintenanceClose", "MaintenanceResponse",
    "FuelLogCreate", "FuelLogUpdate", "FuelLogResponse",
    "ExpenseCreate", "ExpenseUpdate", "ExpenseResponse", "ExpenseSummaryResponse",
    "DashboardKPIs", "FleetUtilization", "VehicleROI", "DriverPerformance",
    "PaginatedResponse", "ErrorResponse", "SuccessResponse", "MessageResponse",
]
