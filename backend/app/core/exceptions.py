from typing import Optional


class AppBaseException(Exception):
    """Base exception for all application errors."""

    error_code: str = "APP_ERROR"
    default_message: str = "An application error occurred"

    def __init__(self, message: Optional[str] = None, error_code: Optional[str] = None):
        self.message = message or self.default_message
        if error_code:
            self.error_code = error_code
        super().__init__(self.message)

    def __str__(self) -> str:
        return self.message


class NotFoundError(AppBaseException):
    """Raised when a requested resource does not exist."""

    error_code = "NOT_FOUND"
    default_message = "Resource not found"

    def __init__(self, resource: str = "Resource", identifier: Optional[str] = None):
        if identifier:
            message = f"{resource} with identifier '{identifier}' not found"
        else:
            message = f"{resource} not found"
        super().__init__(message)


class ConflictError(AppBaseException):
    """Raised when a resource already exists or a state conflict occurs."""

    error_code = "CONFLICT"
    default_message = "Resource conflict"

    def __init__(self, message: Optional[str] = None):
        super().__init__(message or self.default_message)


class BusinessRuleViolation(AppBaseException):
    """Raised when a business rule is violated."""

    error_code = "BUSINESS_RULE_VIOLATION"
    default_message = "Business rule violation"

    def __init__(self, message: str, rule_code: Optional[str] = None):
        self.rule_code = rule_code
        super().__init__(message)


class AuthenticationError(AppBaseException):
    """Raised when authentication fails."""

    error_code = "AUTHENTICATION_ERROR"
    default_message = "Authentication failed"


class AuthorizationError(AppBaseException):
    """Raised when a user does not have permission to perform an action."""

    error_code = "AUTHORIZATION_ERROR"
    default_message = "You do not have permission to perform this action"


class ValidationError(AppBaseException):
    """Raised when input validation fails at the domain level."""

    error_code = "VALIDATION_ERROR"
    default_message = "Validation error"


class OptimisticLockError(AppBaseException):
    """Raised when an optimistic lock conflict occurs."""

    error_code = "OPTIMISTIC_LOCK_ERROR"
    default_message = "The resource was modified by another transaction. Please refresh and retry."

    def __init__(self, resource: str = "Resource"):
        super().__init__(
            f"{resource} was modified concurrently. Please refresh and retry."
        )


class StaleDataError(OptimisticLockError):
    """Alias for OptimisticLockError for clarity in some contexts."""

    pass


class DatabaseError(AppBaseException):
    """Raised when a database operation fails."""

    error_code = "DATABASE_ERROR"
    default_message = "A database error occurred"


class ExternalServiceError(AppBaseException):
    """Raised when an external service call fails."""

    error_code = "EXTERNAL_SERVICE_ERROR"
    default_message = "External service error"


class RateLimitError(AppBaseException):
    """Raised when rate limit is exceeded."""

    error_code = "RATE_LIMIT_EXCEEDED"
    default_message = "Rate limit exceeded. Please try again later."
