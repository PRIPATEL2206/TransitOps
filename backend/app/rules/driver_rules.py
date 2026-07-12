from datetime import date

from app.core.exceptions import BusinessRuleViolation
from app.models.driver import Driver, DriverStatus


class DriverRules:
    """All business rules that govern Driver state transitions and operations."""

    @staticmethod
    def validate_can_be_dispatched(driver: Driver) -> None:
        """Raise BusinessRuleViolation if the driver cannot be dispatched."""
        if driver.status == DriverStatus.SUSPENDED:
            raise BusinessRuleViolation(
                f"Driver '{driver.full_name}' is Suspended and cannot be dispatched.",
                rule_code="DRIVER_SUSPENDED",
            )
        if driver.status == DriverStatus.ON_TRIP:
            raise BusinessRuleViolation(
                f"Driver '{driver.full_name}' is already On Trip.",
                rule_code="DRIVER_ON_TRIP",
            )
        if driver.status == DriverStatus.INACTIVE:
            raise BusinessRuleViolation(
                f"Driver '{driver.full_name}' is Inactive and cannot be dispatched.",
                rule_code="DRIVER_INACTIVE",
            )
        if driver.status != DriverStatus.AVAILABLE:
            raise BusinessRuleViolation(
                f"Driver '{driver.full_name}' is not available (status: {driver.status.value}).",
                rule_code="DRIVER_NOT_AVAILABLE",
            )

        # License check
        today = date.today()
        if driver.license_expiry_date < today:
            raise BusinessRuleViolation(
                f"Driver '{driver.full_name}' has an expired license "
                f"(expired: {driver.license_expiry_date}). Renew before dispatch.",
                rule_code="DRIVER_LICENSE_EXPIRED",
            )

    @staticmethod
    def validate_manual_status_change(driver: Driver, new_status: DriverStatus) -> None:
        if driver.status == DriverStatus.ON_TRIP:
            raise BusinessRuleViolation(
                f"Cannot manually change status of driver '{driver.full_name}' while On Trip. "
                "Complete or cancel the trip first.",
                rule_code="DRIVER_ON_TRIP_STATUS_CHANGE",
            )

    @staticmethod
    def validate_can_be_suspended(driver: Driver) -> None:
        if driver.status == DriverStatus.ON_TRIP:
            raise BusinessRuleViolation(
                f"Cannot suspend driver '{driver.full_name}' while On Trip.",
                rule_code="DRIVER_ON_TRIP_SUSPEND",
            )

    @staticmethod
    def validate_can_be_reinstated(driver: Driver) -> None:
        if driver.status != DriverStatus.SUSPENDED:
            raise BusinessRuleViolation(
                f"Driver '{driver.full_name}' is not Suspended (status: {driver.status.value}). "
                "Only Suspended drivers can be reinstated.",
                rule_code="DRIVER_NOT_SUSPENDED",
            )

        # Check license validity on reinstate
        today = date.today()
        if driver.license_expiry_date < today:
            raise BusinessRuleViolation(
                f"Cannot reinstate driver '{driver.full_name}': license expired on {driver.license_expiry_date}.",
                rule_code="DRIVER_LICENSE_EXPIRED_REINSTATE",
            )

    @staticmethod
    def validate_can_be_deleted(driver: Driver) -> None:
        if driver.status == DriverStatus.ON_TRIP:
            raise BusinessRuleViolation(
                f"Cannot delete driver '{driver.full_name}' while On Trip.",
                rule_code="DRIVER_ON_TRIP_DELETE",
            )
