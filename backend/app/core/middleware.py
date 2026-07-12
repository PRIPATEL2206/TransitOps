"""
Middleware is configured directly in main.py via FastAPI's add_middleware.
This module holds any additional middleware helpers or custom middleware classes.
"""
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import structlog
import uuid

logger = structlog.get_logger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Attaches a unique request ID to each request and response."""

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id

        with structlog.contextvars.bound_contextvars(request_id=request_id):
            response = await call_next(request)

        response.headers["X-Request-ID"] = request_id
        return response


class AuditLogMiddleware(BaseHTTPMiddleware):
    """Logs incoming requests for auditing purposes (excluding health checks)."""

    EXCLUDED_PATHS = {"/health", "/docs", "/redoc", "/openapi.json"}

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.url.path in self.EXCLUDED_PATHS:
            return await call_next(request)

        logger.info(
            "Incoming request",
            method=request.method,
            path=request.url.path,
            client=request.client.host if request.client else "unknown",
        )

        response = await call_next(request)

        logger.info(
            "Request completed",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
        )

        return response
