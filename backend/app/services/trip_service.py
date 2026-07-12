import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleViolation, ConflictError, NotFoundError, OptimisticLockError
from app.models.driver import Driver, DriverStatus
from app.models.trip import Trip, TripStatus
from app.models.vehicle import Vehicle, VehicleStatus
from app.repositories.driver_repository import DriverRepository
from app.repositories.trip_repository import TripRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.rules.trip_rules import TripRules
from app.schemas.trip import TripCancel, TripComplete, TripCreate, TripDispatch, TripUpdate


class TripService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.vehicle_repo = VehicleRepository(session)
        self.driver_repo = DriverRepository(session)
        self.trip_repo = TripRepository(session)

    async def get_by_id(self, trip_id: uuid.UUID) -> Trip:
        trip = await self.trip_repo.get_with_relations(trip_id)
        if not trip:
            raise NotFoundError("Trip", str(trip_id))
        return trip

    async def get_all(
        self,
        *,
        status: Optional[TripStatus] = None,
        vehicle_id: Optional[uuid.UUID] = None,
        driver_id: Optional[uuid.UUID] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[Trip], int]:
        return await self.trip_repo.get_all_with_filters(
            status=status,
            vehicle_id=vehicle_id,
            driver_id=driver_id,
            skip=skip,
            limit=limit,
        )

    async def create(self, trip_in: TripCreate) -> Trip:
        """
        Create a new trip in SCHEDULED state.
        Validates vehicle and driver exist, but does NOT lock them yet.
        Locking happens at dispatch time.
        """
        vehicle = await self.vehicle_repo.get_by_id(trip_in.vehicle_id)
        if not vehicle:
            raise NotFoundError("Vehicle", str(trip_in.vehicle_id))

        driver = await self.driver_repo.get_by_id(trip_in.driver_id)
        if not driver:
            raise NotFoundError("Driver", str(trip_in.driver_id))

        trip_number = await self.trip_repo.generate_trip_number()
        trip_data = trip_in.model_dump()
        trip_data["trip_number"] = trip_number
        trip_data["status"] = TripStatus.SCHEDULED

        return await self.trip_repo.create(trip_data)

    async def dispatch(self, trip_id: uuid.UUID, dispatch_in: TripDispatch) -> Trip:
        """
        Atomically dispatch a trip:
        1. SELECT FOR UPDATE on vehicle and driver (row-level lock)
        2. Validate all business rules
        3. Set vehicle -> On Trip, driver -> On Trip
        4. Set trip -> Dispatched
        """
        trip = await self.get_by_id(trip_id)
        TripRules.validate_can_be_dispatched(trip)

        # Acquire row-level locks to prevent concurrent dispatch
        vehicle = await self.vehicle_repo.get_for_update(trip.vehicle_id)
        if not vehicle:
            raise NotFoundError("Vehicle", str(trip.vehicle_id))

        driver = await self.driver_repo.get_for_update(trip.driver_id)
        if not driver:
            raise NotFoundError("Driver", str(trip.driver_id))

        # Full validation cascade
        TripRules.validate_vehicle_for_dispatch(vehicle)
        TripRules.validate_driver_for_dispatch(driver)
        TripRules.validate_cargo_weight(trip, vehicle)

        # Check for conflicting active trips
        active_vehicle_trip = await self.trip_repo.get_active_for_vehicle(trip.vehicle_id)
        if active_vehicle_trip and active_vehicle_trip.id != trip_id:
            raise BusinessRuleViolation(
                f"Vehicle '{vehicle.registration_number}' is already on trip '{active_vehicle_trip.trip_number}'",
                rule_code="VEHICLE_ALREADY_ON_TRIP",
            )

        active_driver_trip = await self.trip_repo.get_active_for_driver(trip.driver_id)
        if active_driver_trip and active_driver_trip.id != trip_id:
            raise BusinessRuleViolation(
                f"Driver '{driver.full_name}' is already on trip '{active_driver_trip.trip_number}'",
                rule_code="DRIVER_ALREADY_ON_TRIP",
            )

        # Optimistic lock check
        if vehicle.status != VehicleStatus.AVAILABLE:
            raise BusinessRuleViolation(
                f"Vehicle '{vehicle.registration_number}' is no longer available (status: {vehicle.status.value})",
                rule_code="VEHICLE_NOT_AVAILABLE",
            )
        if driver.status != DriverStatus.AVAILABLE:
            raise BusinessRuleViolation(
                f"Driver '{driver.full_name}' is no longer available (status: {driver.status.value})",
                rule_code="DRIVER_NOT_AVAILABLE",
            )

        # Atomically update vehicle, driver, and trip
        vehicle.status = VehicleStatus.ON_TRIP
        vehicle.version += 1

        driver.status = DriverStatus.ON_TRIP
        driver.version += 1

        trip.status = TripStatus.DISPATCHED
        trip.actual_departure = dispatch_in.actual_departure or datetime.now(timezone.utc)
        if dispatch_in.odometer_start_km is not None:
            trip.odometer_start_km = dispatch_in.odometer_start_km
        else:
            trip.odometer_start_km = vehicle.odometer_km

        self.session.add(vehicle)
        self.session.add(driver)
        self.session.add(trip)
        await self.session.flush()
        await self.session.refresh(trip)
        return trip

    async def complete(self, trip_id: uuid.UUID, complete_in: TripComplete) -> Trip:
        """
        Atomically complete a trip:
        1. Validate trip is in Dispatched or In Progress state
        2. Validate odometer end > start
        3. Update vehicle odometer, restore vehicle -> Available
        4. Restore driver -> Available
        5. Set trip -> Completed
        """
        trip = await self.get_by_id(trip_id)
        TripRules.validate_can_be_completed(trip)
        TripRules.validate_odometer_end(trip, complete_in.odometer_end_km)

        vehicle = await self.vehicle_repo.get_for_update(trip.vehicle_id)
        if not vehicle:
            raise NotFoundError("Vehicle", str(trip.vehicle_id))

        driver = await self.driver_repo.get_for_update(trip.driver_id)
        if not driver:
            raise NotFoundError("Driver", str(trip.driver_id))

        # Update vehicle odometer and restore to Available
        vehicle.odometer_km = complete_in.odometer_end_km
        vehicle.status = VehicleStatus.AVAILABLE
        vehicle.version += 1

        # Restore driver to Available
        driver.status = DriverStatus.AVAILABLE
        driver.version += 1

        # Complete the trip
        trip.status = TripStatus.COMPLETED
        trip.odometer_end_km = complete_in.odometer_end_km
        trip.actual_arrival = complete_in.actual_arrival or datetime.now(timezone.utc)

        self.session.add(vehicle)
        self.session.add(driver)
        self.session.add(trip)
        await self.session.flush()
        await self.session.refresh(trip)
        return trip

    async def cancel(self, trip_id: uuid.UUID, cancel_in: TripCancel) -> Trip:
        """
        Cancel a trip:
        - If dispatched/in-progress: restore vehicle and driver to Available
        - If scheduled: no state restoration needed
        """
        trip = await self.get_by_id(trip_id)
        TripRules.validate_can_be_cancelled(trip)

        was_dispatched = trip.status in (TripStatus.DISPATCHED, TripStatus.IN_PROGRESS)

        if was_dispatched:
            vehicle = await self.vehicle_repo.get_for_update(trip.vehicle_id)
            if vehicle:
                vehicle.status = VehicleStatus.AVAILABLE
                vehicle.version += 1
                self.session.add(vehicle)

            driver = await self.driver_repo.get_for_update(trip.driver_id)
            if driver:
                driver.status = DriverStatus.AVAILABLE
                driver.version += 1
                self.session.add(driver)

        trip.status = TripStatus.CANCELLED
        trip.cancellation_reason = cancel_in.cancellation_reason

        self.session.add(trip)
        await self.session.flush()
        await self.session.refresh(trip)
        return trip

    async def update(self, trip_id: uuid.UUID, trip_in: TripUpdate) -> Trip:
        """Update trip details. Only allowed for Scheduled trips."""
        trip = await self.get_by_id(trip_id)
        TripRules.validate_can_be_updated(trip)

        update_data = {k: v for k, v in trip_in.model_dump().items() if v is not None}
        if update_data:
            for field, value in update_data.items():
                setattr(trip, field, value)
            self.session.add(trip)
            await self.session.flush()
            await self.session.refresh(trip)
        return trip

    async def delete(self, trip_id: uuid.UUID) -> None:
        """Only SCHEDULED or CANCELLED trips may be deleted."""
        trip = await self.get_by_id(trip_id)
        TripRules.validate_can_be_deleted(trip)
        await self.trip_repo.delete(trip)
