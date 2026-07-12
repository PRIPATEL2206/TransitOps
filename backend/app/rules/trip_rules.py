from decimal import Decimal
from typing import Optional

from app.core.exceptions import BusinessRuleViolation
from app.models.driver import Driver
from app.models.trip import Trip, TripStatus
from app.models.vehicle import Vehicle
from app.rules.driver_rules import DriverRules
from app.rules.vehicle_rules import VehicleRules


class TripRules:
    """All business rules governing Trip lifecycle."""

    @staticmethod
    def validate_can_be_dispatched(trip: Trip) -> None:
        if trip.status != TripStatus.SCHEDULED:
            raise BusinessRuleViolation(
                f"Trip '{trip.trip_number}' cannot be dispatched: current status is '{trip.status.value}'. "
                "Only Scheduled trips can be dispatched.",
                rule_code="TRIP_NOT_SCHEDULED",
            )

    @staticmethod
    def validate_vehicle_for_dispatch(vehicle: Vehicle) -> None:
        """Delegate to VehicleRules for dispatch-specific checks."""
        VehicleRules.validate_can_be_dispatched(vehicle)

    @staticmethod
    def validate_driver_for_dispatch(driver: Driver) -> None:
        """Delegate to DriverRules for dispatch-specific checks."""
        DriverRules.validate_can_be_dispatched(driver)

    @staticmethod
    def validate_cargo_weight(trip: Trip, vehicle: Vehicle) -> None:
        """Validate cargo weight does not exceed vehicle capacity."""
        if trip.cargo_weight_kg is not None and float(vehicle.max_capacity_kg) > 0:
            if trip.cargo_weight_kg > vehicle.max_capacity_kg:
                raise BusinessRuleViolation(
                    f"Cargo weight {trip.cargo_weight_kg} kg exceeds vehicle "
                    f"'{vehicle.registration_number}' max capacity of {vehicle.max_capacity_kg} kg.",
                    rule_code="CARGO_EXCEEDS_CAPACITY",
                )

    @staticmethod
    def validate_can_be_completed(trip: Trip) -> None:
        if trip.status not in (TripStatus.DISPATCHED, TripStatus.IN_PROGRESS):
            raise BusinessRuleViolation(
                f"Trip '{trip.trip_number}' cannot be completed: current status is '{trip.status.value}'. "
                "Only Dispatched or In Progress trips can be completed.",
                rule_code="TRIP_NOT_ACTIVE",
            )

    @staticmethod
    def validate_odometer_end(trip: Trip, odometer_end_km: Decimal) -> None:
        if trip.odometer_start_km is not None and odometer_end_km < trip.odometer_start_km:
            raise BusinessRuleViolation(
                f"End odometer ({odometer_end_km} km) cannot be less than start odometer "
                f"({trip.odometer_start_km} km).",
                rule_code="ODOMETER_END_LESS_THAN_START",
            )

    @staticmethod
    def validate_can_be_cancelled(trip: Trip) -> None:
        if trip.status == TripStatus.COMPLETED:
            raise BusinessRuleViolation(
                f"Trip '{trip.trip_number}' is already Completed and cannot be cancelled.",
                rule_code="TRIP_ALREADY_COMPLETED",
            )
        if trip.status == TripStatus.CANCELLED:
            raise BusinessRuleViolation(
                f"Trip '{trip.trip_number}' is already Cancelled.",
                rule_code="TRIP_ALREADY_CANCELLED",
            )

    @staticmethod
    def validate_can_be_updated(trip: Trip) -> None:
        if trip.status != TripStatus.SCHEDULED:
            raise BusinessRuleViolation(
                f"Trip '{trip.trip_number}' details can only be updated in Scheduled status "
                f"(current: {trip.status.value}).",
                rule_code="TRIP_UPDATE_NOT_SCHEDULED",
            )

    @staticmethod
    def validate_can_be_deleted(trip: Trip) -> None:
        if trip.status not in (TripStatus.SCHEDULED, TripStatus.CANCELLED):
            raise BusinessRuleViolation(
                f"Trip '{trip.trip_number}' can only be deleted when Scheduled or Cancelled "
                f"(current: {trip.status.value}).",
                rule_code="TRIP_DELETE_NOT_ALLOWED",
            )
