from app.core.exceptions import BusinessRuleViolation
from app.models.vehicle import Vehicle, VehicleStatus


class VehicleRules:
    """All business rules that govern Vehicle state transitions and operations."""

    @staticmethod
    def validate_can_be_dispatched(vehicle: Vehicle) -> None:
        """Raise BusinessRuleViolation if the vehicle cannot be dispatched."""
        if vehicle.status == VehicleStatus.RETIRED:
            raise BusinessRuleViolation(
                f"Vehicle '{vehicle.registration_number}' is Retired and cannot be dispatched.",
                rule_code="VEHICLE_RETIRED",
            )
        if vehicle.status == VehicleStatus.IN_SHOP:
            raise BusinessRuleViolation(
                f"Vehicle '{vehicle.registration_number}' is In Shop and cannot be dispatched.",
                rule_code="VEHICLE_IN_SHOP",
            )
        if vehicle.status == VehicleStatus.ON_TRIP:
            raise BusinessRuleViolation(
                f"Vehicle '{vehicle.registration_number}' is already On Trip.",
                rule_code="VEHICLE_ON_TRIP",
            )
        if vehicle.status != VehicleStatus.AVAILABLE:
            raise BusinessRuleViolation(
                f"Vehicle '{vehicle.registration_number}' is not available (status: {vehicle.status}).",
                rule_code="VEHICLE_NOT_AVAILABLE",
            )

    @staticmethod
    def validate_manual_status_change(vehicle: Vehicle, new_status: VehicleStatus) -> None:
        """Validate manual status transitions from the API (not via trip dispatch/complete)."""
        if vehicle.status == VehicleStatus.ON_TRIP:
            raise BusinessRuleViolation(
                f"Cannot manually change status of vehicle '{vehicle.registration_number}' while it is On Trip. "
                "Complete or cancel the trip first.",
                rule_code="VEHICLE_ON_TRIP_STATUS_CHANGE",
            )
        if vehicle.status == VehicleStatus.RETIRED and new_status != VehicleStatus.RETIRED:
            raise BusinessRuleViolation(
                f"Vehicle '{vehicle.registration_number}' is Retired and cannot be reactivated.",
                rule_code="VEHICLE_RETIRED_REACTIVATION",
            )

    @staticmethod
    def validate_can_be_retired(vehicle: Vehicle) -> None:
        if vehicle.status == VehicleStatus.ON_TRIP:
            raise BusinessRuleViolation(
                f"Cannot retire vehicle '{vehicle.registration_number}' while it is On Trip.",
                rule_code="VEHICLE_ON_TRIP_RETIRE",
            )
        if vehicle.status == VehicleStatus.IN_SHOP:
            raise BusinessRuleViolation(
                f"Cannot retire vehicle '{vehicle.registration_number}' while it is In Shop. "
                "Close active maintenance records first.",
                rule_code="VEHICLE_IN_SHOP_RETIRE",
            )

    @staticmethod
    def validate_can_be_deleted(vehicle: Vehicle) -> None:
        if vehicle.status == VehicleStatus.ON_TRIP:
            raise BusinessRuleViolation(
                f"Cannot delete vehicle '{vehicle.registration_number}' while it is On Trip.",
                rule_code="VEHICLE_ON_TRIP_DELETE",
            )

    @staticmethod
    def validate_capacity_for_cargo(vehicle: Vehicle, cargo_weight_kg: float) -> None:
        """Validate that cargo does not exceed vehicle max capacity."""
        if cargo_weight_kg > float(vehicle.max_capacity_kg):
            raise BusinessRuleViolation(
                f"Cargo weight {cargo_weight_kg} kg exceeds vehicle '{vehicle.registration_number}' "
                f"max capacity of {vehicle.max_capacity_kg} kg.",
                rule_code="CARGO_EXCEEDS_CAPACITY",
            )
