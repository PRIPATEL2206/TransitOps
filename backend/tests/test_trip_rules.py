"""
Unit tests for business rules — Trip dispatch validation.
Uses in-memory SQLite, no external dependencies required.
"""
import uuid
from datetime import date, timedelta
from decimal import Decimal

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.vehicle import Vehicle, VehicleStatus
from app.models.driver import Driver, DriverStatus
from app.models.trip import Trip, TripStatus
from app.services.trip_service import TripService
from app.core.exceptions import BusinessRuleViolation, NotFoundError
from app.schemas.trip import TripDispatch


class TestTripDispatchRules:
    """Test BR-T001 through BR-T005: Trip dispatch validation cascade."""

    @pytest_asyncio.fixture
    async def vehicle(self, db_session: AsyncSession):
        v = Vehicle(
            id=uuid.uuid4(),
            registration_number="MH-12-TEST-001",
            make="Tata",
            model="Ace",
            year=2023,
            fuel_type="Diesel",
            status=VehicleStatus.AVAILABLE.value,
            max_capacity_kg=Decimal("500.00"),
            odometer_km=Decimal("10000.00"),
            version=1,
        )
        db_session.add(v)
        await db_session.commit()
        await db_session.refresh(v)
        return v

    @pytest_asyncio.fixture
    async def driver(self, db_session: AsyncSession):
        d = Driver(
            id=uuid.uuid4(),
            first_name="Test",
            last_name="Driver",
            license_number="DL-TEST-001",
            license_class="Commercial",
            license_expiry_date=date.today() + timedelta(days=365),
            status=DriverStatus.AVAILABLE.value,
            phone="+911234567890",
            version=1,
        )
        db_session.add(d)
        await db_session.commit()
        await db_session.refresh(d)
        return d

    @pytest_asyncio.fixture
    async def trip(self, db_session: AsyncSession, vehicle, driver):
        t = Trip(
            id=uuid.uuid4(),
            vehicle_id=vehicle.id,
            driver_id=driver.id,
            trip_number="TRP-20260712-0001",
            origin="Mumbai",
            destination="Pune",
            cargo_weight_kg=Decimal("450.00"),
            status=TripStatus.SCHEDULED.value,
        )
        db_session.add(t)
        await db_session.commit()
        await db_session.refresh(t)
        return t

    @pytest.mark.asyncio
    async def test_dispatch_success(self, db_session: AsyncSession, trip, vehicle, driver):
        """BR-T002: Valid dispatch — vehicle Available, driver Available, weight OK."""
        service = TripService(db_session)
        dispatch_data = TripDispatch()

        result = await service.dispatch(trip.id, dispatch_data)

        assert result.status == TripStatus.DISPATCHED.value
        # Refresh vehicle and driver to check status changes
        await db_session.refresh(vehicle)
        await db_session.refresh(driver)
        assert vehicle.status == VehicleStatus.ON_TRIP.value
        assert driver.status == DriverStatus.ON_TRIP.value

    @pytest.mark.asyncio
    async def test_dispatch_overweight_rejected(self, db_session: AsyncSession, vehicle, driver):
        """BR-T001: Cargo weight > vehicle capacity → rejected."""
        # Create trip with 600kg on 500kg vehicle
        overweight_trip = Trip(
            id=uuid.uuid4(),
            vehicle_id=vehicle.id,
            driver_id=driver.id,
            trip_number="TRP-20260712-0002",
            origin="Mumbai",
            destination="Pune",
            cargo_weight_kg=Decimal("600.00"),  # Exceeds 500kg capacity
            status=TripStatus.SCHEDULED.value,
        )
        db_session.add(overweight_trip)
        await db_session.commit()

        service = TripService(db_session)
        with pytest.raises(BusinessRuleViolation, match="exceeds.*capacity"):
            await service.dispatch(overweight_trip.id, TripDispatch())

    @pytest.mark.asyncio
    async def test_dispatch_weight_at_boundary_allowed(self, db_session: AsyncSession, vehicle, driver):
        """BR-T001: Cargo weight == max capacity → ALLOWED (inclusive boundary)."""
        boundary_trip = Trip(
            id=uuid.uuid4(),
            vehicle_id=vehicle.id,
            driver_id=driver.id,
            trip_number="TRP-20260712-0003",
            origin="Mumbai",
            destination="Delhi",
            cargo_weight_kg=Decimal("500.00"),  # Exactly at capacity
            status=TripStatus.SCHEDULED.value,
        )
        db_session.add(boundary_trip)
        await db_session.commit()

        service = TripService(db_session)
        result = await service.dispatch(boundary_trip.id, TripDispatch())
        assert result.status == TripStatus.DISPATCHED.value

    @pytest.mark.asyncio
    async def test_dispatch_retired_vehicle_rejected(self, db_session: AsyncSession, driver):
        """BR-V002: Retired vehicle cannot be dispatched."""
        retired_vehicle = Vehicle(
            id=uuid.uuid4(),
            registration_number="MH-12-RETIRED-001",
            make="Old",
            model="Truck",
            year=2015,
            fuel_type="Diesel",
            status=VehicleStatus.RETIRED.value,
            max_capacity_kg=Decimal("1000.00"),
            odometer_km=Decimal("500000.00"),
            version=1,
        )
        db_session.add(retired_vehicle)
        await db_session.commit()

        trip = Trip(
            id=uuid.uuid4(),
            vehicle_id=retired_vehicle.id,
            driver_id=driver.id,
            trip_number="TRP-20260712-0004",
            origin="A",
            destination="B",
            cargo_weight_kg=Decimal("100.00"),
            status=TripStatus.SCHEDULED.value,
        )
        db_session.add(trip)
        await db_session.commit()

        service = TripService(db_session)
        with pytest.raises(BusinessRuleViolation):
            await service.dispatch(trip.id, TripDispatch())

    @pytest.mark.asyncio
    async def test_dispatch_in_shop_vehicle_rejected(self, db_session: AsyncSession, driver):
        """BR-V003: In Shop vehicle cannot be dispatched."""
        in_shop_vehicle = Vehicle(
            id=uuid.uuid4(),
            registration_number="MH-12-SHOP-001",
            make="Tata",
            model="Prima",
            year=2022,
            fuel_type="Diesel",
            status=VehicleStatus.IN_SHOP.value,
            max_capacity_kg=Decimal("5000.00"),
            odometer_km=Decimal("80000.00"),
            version=1,
        )
        db_session.add(in_shop_vehicle)
        await db_session.commit()

        trip = Trip(
            id=uuid.uuid4(),
            vehicle_id=in_shop_vehicle.id,
            driver_id=driver.id,
            trip_number="TRP-20260712-0005",
            origin="A",
            destination="B",
            cargo_weight_kg=Decimal("100.00"),
            status=TripStatus.SCHEDULED.value,
        )
        db_session.add(trip)
        await db_session.commit()

        service = TripService(db_session)
        with pytest.raises(BusinessRuleViolation):
            await service.dispatch(trip.id, TripDispatch())

    @pytest.mark.asyncio
    async def test_dispatch_expired_license_rejected(self, db_session: AsyncSession, vehicle):
        """BR-D001: Expired license driver cannot be dispatched."""
        expired_driver = Driver(
            id=uuid.uuid4(),
            first_name="Expired",
            last_name="License",
            license_number="DL-EXPIRED-001",
            license_class="Class B",
            license_expiry_date=date.today() - timedelta(days=30),
            status=DriverStatus.AVAILABLE.value,
            phone="+911111111111",
            version=1,
        )
        db_session.add(expired_driver)
        await db_session.commit()

        trip = Trip(
            id=uuid.uuid4(),
            vehicle_id=vehicle.id,
            driver_id=expired_driver.id,
            trip_number="TRP-20260712-0006",
            origin="A",
            destination="B",
            cargo_weight_kg=Decimal("100.00"),
            status=TripStatus.SCHEDULED.value,
        )
        db_session.add(trip)
        await db_session.commit()

        service = TripService(db_session)
        with pytest.raises(BusinessRuleViolation):
            await service.dispatch(trip.id, TripDispatch())

    @pytest.mark.asyncio
    async def test_dispatch_suspended_driver_rejected(self, db_session: AsyncSession, vehicle):
        """BR-D002: Suspended driver cannot be dispatched."""
        suspended_driver = Driver(
            id=uuid.uuid4(),
            first_name="Suspended",
            last_name="Driver",
            license_number="DL-SUSP-001",
            license_class="Commercial",
            license_expiry_date=date.today() + timedelta(days=365),
            status=DriverStatus.SUSPENDED.value,
            phone="+912222222222",
            version=1,
        )
        db_session.add(suspended_driver)
        await db_session.commit()

        trip = Trip(
            id=uuid.uuid4(),
            vehicle_id=vehicle.id,
            driver_id=suspended_driver.id,
            trip_number="TRP-20260712-0007",
            origin="A",
            destination="B",
            cargo_weight_kg=Decimal("100.00"),
            status=TripStatus.SCHEDULED.value,
        )
        db_session.add(trip)
        await db_session.commit()

        service = TripService(db_session)
        with pytest.raises(BusinessRuleViolation):
            await service.dispatch(trip.id, TripDispatch())

    @pytest.mark.asyncio
    async def test_complete_trip_restores_statuses(self, db_session: AsyncSession, trip, vehicle, driver):
        """BR-T002: Completing a trip restores vehicle/driver to Available."""
        from app.schemas.trip import TripComplete

        service = TripService(db_session)

        # First dispatch
        await service.dispatch(trip.id, TripDispatch())
        await db_session.refresh(vehicle)
        await db_session.refresh(driver)
        assert vehicle.status == VehicleStatus.ON_TRIP.value
        assert driver.status == DriverStatus.ON_TRIP.value

        # Then complete
        complete_data = TripComplete(odometer_end_km=Decimal("10150.00"))
        result = await service.complete(trip.id, complete_data)

        assert result.status == TripStatus.COMPLETED.value
        await db_session.refresh(vehicle)
        await db_session.refresh(driver)
        assert vehicle.status == VehicleStatus.AVAILABLE.value
        assert driver.status == DriverStatus.AVAILABLE.value
        assert vehicle.odometer_km == Decimal("10150.00")

    @pytest.mark.asyncio
    async def test_cancel_dispatched_trip_restores_statuses(self, db_session: AsyncSession, trip, vehicle, driver):
        """BR-T002: Cancelling a dispatched trip restores vehicle/driver."""
        from app.schemas.trip import TripCancel

        service = TripService(db_session)

        # Dispatch first
        await service.dispatch(trip.id, TripDispatch())

        # Cancel
        cancel_data = TripCancel(cancellation_reason="Client cancelled")
        result = await service.cancel(trip.id, cancel_data)

        assert result.status == TripStatus.CANCELLED.value
        await db_session.refresh(vehicle)
        await db_session.refresh(driver)
        assert vehicle.status == VehicleStatus.AVAILABLE.value
        assert driver.status == DriverStatus.AVAILABLE.value

    @pytest.mark.asyncio
    async def test_invalid_transition_completed_to_dispatched(self, db_session: AsyncSession, trip, vehicle, driver):
        """BR-T002: Completed trip cannot be dispatched again."""
        from app.schemas.trip import TripComplete

        service = TripService(db_session)
        await service.dispatch(trip.id, TripDispatch())
        await service.complete(trip.id, TripComplete(odometer_end_km=Decimal("10200.00")))

        # Try to dispatch again
        with pytest.raises(BusinessRuleViolation):
            await service.dispatch(trip.id, TripDispatch())
