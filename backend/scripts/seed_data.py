"""
Seed script: populates the database with sample data for development and demo purposes.
Run with: python scripts/seed_data.py
"""

import asyncio
import sys
import os
from datetime import date, datetime, timezone, timedelta
from decimal import Decimal

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.base import Base
from app.models.user import User, Role
from app.models.vehicle import Vehicle, VehicleStatus, FuelType
from app.models.driver import Driver, DriverStatus, LicenseClass
from app.models.trip import Trip, TripStatus
from app.models.maintenance import MaintenanceLog, MaintenanceType, MaintenanceStatus
from app.models.fuel_log import FuelLog
from app.models.expense import Expense, ExpenseCategory, ExpenseStatus


async def seed(session: AsyncSession) -> None:
    print("Creating roles...")
    roles = {
        "admin": Role(name="admin", description="System administrator with full access"),
        "manager": Role(name="manager", description="Fleet manager"),
        "dispatcher": Role(name="dispatcher", description="Trip dispatcher"),
        "viewer": Role(name="viewer", description="Read-only access"),
    }
    for role in roles.values():
        session.add(role)
    await session.flush()

    print("Creating users...")
    admin_user = User(
        email="admin@transitops.com",
        username="admin",
        full_name="System Administrator",
        hashed_password=get_password_hash("Admin@1234"),
        is_active=True,
        is_superuser=True,
        roles=[roles["admin"]],
    )
    manager_user = User(
        email="manager@transitops.com",
        username="fleetmanager",
        full_name="Fleet Manager",
        hashed_password=get_password_hash("Manager@1234"),
        is_active=True,
        is_superuser=False,
        roles=[roles["manager"]],
    )
    dispatcher_user = User(
        email="dispatcher@transitops.com",
        username="dispatcher1",
        full_name="John Dispatcher",
        hashed_password=get_password_hash("Dispatch@1234"),
        is_active=True,
        is_superuser=False,
        roles=[roles["dispatcher"]],
    )
    session.add_all([admin_user, manager_user, dispatcher_user])
    await session.flush()

    print("Creating vehicles...")
    vehicles = [
        Vehicle(
            registration_number="TRK-001",
            make="Mercedes-Benz",
            model="Actros 2545",
            year=2021,
            color="White",
            vin="WDB9634031L123456",
            fuel_type=FuelType.DIESEL,
            status=VehicleStatus.AVAILABLE,
            max_capacity_kg=Decimal("25000.00"),
            odometer_km=Decimal("45230.50"),
            fuel_efficiency_kmpl=Decimal("8.50"),
        ),
        Vehicle(
            registration_number="TRK-002",
            make="Volvo",
            model="FH16 750",
            year=2020,
            color="Blue",
            vin="YV2RT40A5LA123789",
            fuel_type=FuelType.DIESEL,
            status=VehicleStatus.AVAILABLE,
            max_capacity_kg=Decimal("30000.00"),
            odometer_km=Decimal("78450.00"),
            fuel_efficiency_kmpl=Decimal("7.80"),
        ),
        Vehicle(
            registration_number="VAN-001",
            make="Ford",
            model="Transit 350",
            year=2022,
            color="Silver",
            vin="WF0XXXTTGXKP12345",
            fuel_type=FuelType.DIESEL,
            status=VehicleStatus.AVAILABLE,
            max_capacity_kg=Decimal("1500.00"),
            odometer_km=Decimal("12800.00"),
            fuel_efficiency_kmpl=Decimal("12.00"),
        ),
        Vehicle(
            registration_number="TRK-003",
            make="MAN",
            model="TGX 26.480",
            year=2019,
            color="Red",
            vin="WMA06XZZ2KM456789",
            fuel_type=FuelType.DIESEL,
            status=VehicleStatus.IN_SHOP,
            max_capacity_kg=Decimal("18000.00"),
            odometer_km=Decimal("120000.00"),
            fuel_efficiency_kmpl=Decimal("7.20"),
            notes="Scheduled for annual service",
        ),
        Vehicle(
            registration_number="TRK-004",
            make="Scania",
            model="R500",
            year=2018,
            color="Green",
            vin="YS2R4X20005654321",
            fuel_type=FuelType.DIESEL,
            status=VehicleStatus.RETIRED,
            max_capacity_kg=Decimal("22000.00"),
            odometer_km=Decimal("350000.00"),
            notes="Decommissioned - exceeded service life",
        ),
    ]
    session.add_all(vehicles)
    await session.flush()

    print("Creating drivers...")
    drivers = [
        Driver(
            first_name="Michael",
            last_name="Johnson",
            email="m.johnson@transitops.com",
            phone="+1-555-0101",
            national_id="NID-001234",
            license_number="DL-789456",
            license_class=LicenseClass.CLASS_C,
            license_expiry_date=date(2026, 8, 15),
            status=DriverStatus.AVAILABLE,
        ),
        Driver(
            first_name="Sarah",
            last_name="Williams",
            email="s.williams@transitops.com",
            phone="+1-555-0102",
            national_id="NID-002345",
            license_number="DL-654789",
            license_class=LicenseClass.CLASS_C,
            license_expiry_date=date(2025, 12, 31),
            status=DriverStatus.AVAILABLE,
        ),
        Driver(
            first_name="David",
            last_name="Brown",
            email="d.brown@transitops.com",
            phone="+1-555-0103",
            national_id="NID-003456",
            license_number="DL-321654",
            license_class=LicenseClass.CLASS_B,
            license_expiry_date=date(2026, 3, 20),
            status=DriverStatus.AVAILABLE,
        ),
        Driver(
            first_name="Emma",
            last_name="Davis",
            email="e.davis@transitops.com",
            phone="+1-555-0104",
            national_id="NID-004567",
            license_number="DL-987123",
            license_class=LicenseClass.CLASS_C,
            license_expiry_date=date(2024, 6, 30),  # Expired
            status=DriverStatus.SUSPENDED,
            notes="Suspended - expired license",
        ),
    ]
    session.add_all(drivers)
    await session.flush()

    print("Creating completed trips...")
    now = datetime.now(timezone.utc)
    trip1 = Trip(
        vehicle_id=vehicles[0].id,
        driver_id=drivers[0].id,
        trip_number="TRIP-000001",
        origin="Warehouse A, Chicago, IL",
        destination="Distribution Center, Detroit, MI",
        description="Regular delivery run",
        cargo_description="Electronics components",
        cargo_weight_kg=Decimal("8500.00"),
        status=TripStatus.COMPLETED,
        scheduled_departure=now - timedelta(days=3),
        scheduled_arrival=now - timedelta(days=3, hours=-6),
        actual_departure=now - timedelta(days=3),
        actual_arrival=now - timedelta(days=3, hours=-6, minutes=-30),
        odometer_start_km=Decimal("44900.00"),
        odometer_end_km=Decimal("45230.50"),
    )
    trip2 = Trip(
        vehicle_id=vehicles[1].id,
        driver_id=drivers[1].id,
        trip_number="TRIP-000002",
        origin="Port of Cleveland, OH",
        destination="Warehouse B, Columbus, OH",
        description="Import cargo delivery",
        cargo_description="Industrial machinery parts",
        cargo_weight_kg=Decimal("15000.00"),
        status=TripStatus.COMPLETED,
        scheduled_departure=now - timedelta(days=1),
        scheduled_arrival=now - timedelta(hours=20),
        actual_departure=now - timedelta(days=1),
        actual_arrival=now - timedelta(hours=20),
        odometer_start_km=Decimal("77900.00"),
        odometer_end_km=Decimal("78450.00"),
    )
    trip3 = Trip(
        vehicle_id=vehicles[0].id,
        driver_id=drivers[0].id,
        trip_number="TRIP-000003",
        origin="Warehouse A, Chicago, IL",
        destination="Customer Site, Milwaukee, WI",
        description="Express delivery",
        cargo_description="Office furniture",
        cargo_weight_kg=Decimal("2000.00"),
        status=TripStatus.SCHEDULED,
        scheduled_departure=now + timedelta(days=1),
        scheduled_arrival=now + timedelta(days=1, hours=4),
    )
    session.add_all([trip1, trip2, trip3])
    await session.flush()

    print("Creating maintenance logs...")
    maint1 = MaintenanceLog(
        vehicle_id=vehicles[3].id,  # TRK-003 (In Shop)
        maintenance_type=MaintenanceType.PREVENTIVE,
        status=MaintenanceStatus.IN_PROGRESS,
        description="Annual preventive maintenance: oil change, brake inspection, tire rotation",
        performed_by="AutoFix Workshop",
        workshop_name="AutoFix Pro Services",
        started_at=now - timedelta(days=1),
        estimated_cost=Decimal("1500.00"),
        odometer_at_service_km=Decimal("120000.00"),
    )
    maint2 = MaintenanceLog(
        vehicle_id=vehicles[0].id,  # TRK-001
        maintenance_type=MaintenanceType.CORRECTIVE,
        status=MaintenanceStatus.CLOSED,
        description="Replaced worn brake pads on rear axle",
        performed_by="QuickFix Garage",
        workshop_name="QuickFix Garage",
        started_at=now - timedelta(days=10),
        completed_at=now - timedelta(days=9),
        estimated_cost=Decimal("400.00"),
        actual_cost=Decimal("380.00"),
        odometer_at_service_km=Decimal("44500.00"),
        resolution_notes="Replaced brake pads and bled brake lines. Vehicle returned to full service.",
    )
    session.add_all([maint1, maint2])
    await session.flush()

    print("Creating fuel logs...")
    fuel_logs = [
        FuelLog(
            vehicle_id=vehicles[0].id,
            trip_id=trip1.id,
            fuel_type="Diesel",
            quantity_liters=Decimal("120.50"),
            price_per_unit=Decimal("1.85"),
            total_cost=Decimal("222.93"),
            odometer_km=Decimal("45000.00"),
            station_name="Pilot Flying J",
            location="Gary, IN",
            filled_at=now - timedelta(days=3, hours=2),
        ),
        FuelLog(
            vehicle_id=vehicles[1].id,
            trip_id=trip2.id,
            fuel_type="Diesel",
            quantity_liters=Decimal("180.00"),
            price_per_unit=Decimal("1.82"),
            total_cost=Decimal("327.60"),
            odometer_km=Decimal("78100.00"),
            station_name="Love's Travel Stop",
            location="Findlay, OH",
            filled_at=now - timedelta(days=1, hours=6),
        ),
    ]
    session.add_all(fuel_logs)
    await session.flush()

    print("Creating expenses...")
    expenses = [
        Expense(
            vehicle_id=vehicles[0].id,
            trip_id=trip1.id,
            driver_id=drivers[0].id,
            category=ExpenseCategory.TOLL,
            amount=Decimal("45.00"),
            currency="USD",
            description="I-94 and I-80 toll charges",
            status=ExpenseStatus.APPROVED,
            incurred_at=now - timedelta(days=3),
        ),
        Expense(
            vehicle_id=vehicles[0].id,
            driver_id=drivers[0].id,
            category=ExpenseCategory.MEALS,
            amount=Decimal("28.50"),
            currency="USD",
            description="Driver meals allowance",
            status=ExpenseStatus.APPROVED,
            incurred_at=now - timedelta(days=3),
        ),
        Expense(
            vehicle_id=vehicles[0].id,
            category=ExpenseCategory.MAINTENANCE,
            amount=Decimal("380.00"),
            currency="USD",
            description="Brake pad replacement",
            status=ExpenseStatus.APPROVED,
            incurred_at=now - timedelta(days=9),
        ),
        Expense(
            vehicle_id=vehicles[1].id,
            trip_id=trip2.id,
            driver_id=drivers[1].id,
            category=ExpenseCategory.PARKING,
            amount=Decimal("15.00"),
            currency="USD",
            description="Overnight parking fee",
            status=ExpenseStatus.PENDING,
            incurred_at=now - timedelta(days=1),
        ),
    ]
    session.add_all(expenses)
    await session.flush()

    print("Seed data committed successfully!")
    print("\n=== DEMO CREDENTIALS ===")
    print("Admin:      admin@transitops.com / Admin@1234")
    print("Manager:    manager@transitops.com / Manager@1234")
    print("Dispatcher: dispatcher@transitops.com / Dispatch@1234")
    print("========================\n")


async def main() -> None:
    engine = create_async_engine(settings.DATABASE_URL, echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        async with session.begin():
            await seed(session)

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
