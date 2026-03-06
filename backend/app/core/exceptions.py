from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from loguru import logger


# ── Base exception ────────────────────────────────────────────
class AppException(Exception):
    """Base class for all application-level exceptions."""
    def __init__(self, detail: str, status_code: int = 400):
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


# ── Domain exceptions ─────────────────────────────────────────
class NotFoundException(AppException):
    """Resource not found."""
    def __init__(self, resource: str, resource_id: str = ""):
        detail = f"{resource} not found"
        if resource_id:
            detail = f"{resource} '{resource_id}' not found"
        super().__init__(detail, status_code=status.HTTP_404_NOT_FOUND)


class UnauthorizedException(AppException):
    """Authentication required."""
    def __init__(self, detail: str = "Authentication required"):
        super().__init__(detail, status_code=status.HTTP_401_UNAUTHORIZED)


class ForbiddenException(AppException):
    """Authenticated but not allowed."""
    def __init__(self, detail: str = "You do not have permission to perform this action"):
        super().__init__(detail, status_code=status.HTTP_403_FORBIDDEN)


class ConflictException(AppException):
    """Resource already exists or state conflict."""
    def __init__(self, detail: str):
        super().__init__(detail, status_code=status.HTTP_409_CONFLICT)


class ValidationException(AppException):
    """Business-rule validation failure (distinct from Pydantic schema errors)."""
    def __init__(self, detail: str):
        super().__init__(detail, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)


class ServiceUnavailableException(AppException):
    """External service (weather API, etc.) is down."""
    def __init__(self, service: str):
        super().__init__(
            f"{service} is currently unavailable. Please try again later.",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        )


# ── Error response shape ──────────────────────────────────────
def _error_response(status_code: int, detail: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"detail": detail, "status_code": status_code},
    )

# ===================================================
# Register handlers on the FastAPI app
# ===================================================
def register_exception_handlers(app: FastAPI) -> None:
    """
    Call this once in main.py after creating the FastAPI app.
    Converts all exceptions into consistent JSON error responses.
    """

    @app.exception_handler(AppException)
    async def app_exception_handler(
        request: Request, exc: AppException
    ) -> JSONResponse:
        logger.warning(
            "AppException | {} {} → {}: {}",
            request.method,
            request.url.path,
            exc.status_code,
            exc.detail,
        )
        return _error_response(exc.status_code, exc.detail)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        # Flatten Pydantic validation errors into a readable message
        errors = []
        for error in exc.errors():
            field = " → ".join(str(loc) for loc in error["loc"])
            errors.append(f"{field}: {error['msg']}")

        detail = " | ".join(errors)
        logger.warning(
            "Validation error | {} {}: {}",
            request.method,
            request.url.path,
            detail,
        )
        return _error_response(
            status.HTTP_422_UNPROCESSABLE_ENTITY, detail
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        logger.error(
            "Unhandled exception | {} {}: {}",
            request.method,
            request.url.path,
            exc,
            exc_info=True,
        )
        return _error_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "An unexpected error occurred. Please try again later.",
        )