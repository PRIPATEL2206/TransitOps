from app.core.exceptions import BusinessRuleViolation
from app.models.maintenance import MaintenanceLog, MaintenanceStatus
from app.models.vehicle import Vehicle, VehicleStatus


class MaintenanceRules:
    """All business rules governing Maintenance operations."""

    @staticmethod
    def validate_vehicle_can_enter_shop(vehicle: Vehicle) -> None:
        """Vehicle must not be On Trip to be sent to maintenance."""
        if vehicle.status == VehicleStatus.ON_TRIP:
            raise BusinessRuleViolation(
                f"Vehicle '{vehicle.registration_number}' is currently On Trip. "
                "Complete or cancel the active trip before creating a maintenance record.",
                rule_code="VEHICLE_ON_TRIP_MAINTENANCE",
            )
        if vehicle.status == VehicleStatus.RETIRED:
            raise BusinessRuleViolation(
                f"Vehicle '{vehicle.registration_number}' is Retired. "
                "Cannot create maintenance for a retired vehicle.",
                rule_code="VEHICLE_RETIRED_MAINTENANCE",
            )

    @staticmethod
    def validate_can_be_closed(log: MaintenanceLog) -> None:
        if log.status == MaintenanceStatus.CLOSED:
            raise BusinessRuleViolation(
                f"Maintenance log is already Closed.",
                rule_code="MAINTENANCE_ALREADY_CLOSED",
            )

    @staticmethod
    def validate_can_be_updated(log: MaintenanceLog) -> None:
        if log.status == MaintenanceStatus.CLOSED:
            raise BusinessRuleViolation(
                "Cannot update a Closed maintenance log.",
                rule_code="MAINTENANCE_UPDATE_CLOSED",
            )

    @staticmethod
    def validate_can_be_deleted(log: MaintenanceLog) -> None:
        if log.status != MaintenanceStatus.OPEN:
            raise BusinessRuleViolation(
                f"Only Open maintenance logs can be deleted (current status: {log.status}).",
                rule_code="MAINTENANCE_DELETE_NOT_OPEN",
            )
