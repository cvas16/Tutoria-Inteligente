import logging
from typing import Any, Dict
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import asyncpg

logger = logging.getLogger("uvicorn.error")


# =====================================================================
# 1. EXCEPCIONES PERSONALIZADAS DE DOMINIO
# =====================================================================
class AppException(Exception):
    """Excepción base del sistema."""
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST, payload: Dict[str, Any] | None = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.payload = payload or {}


class EnrollmentNotFoundError(AppException):
    def __init__(self, enrollment_id: Any):
        super().__init__(
            message=f"La matrícula '{enrollment_id}' no existe o no tiene actividad registrada.",
            status_code=status.HTTP_404_NOT_FOUND
        )


class DuplicatePredictionError(AppException):
    def __init__(self, enrollment_id: Any, week: int):
        super().__init__(
            message=f"Ya existe una predicción registrada para la matrícula '{enrollment_id}' en la semana {week}.",
            status_code=status.HTTP_409_CONFLICT
        )


class SurveyAlreadyCompletedError(AppException):
    def __init__(self, student_id: Any):
        super().__init__(
            message=f"El estudiante '{student_id}' ya completó previamente el cuestionario de evaluación (Anexo 3).",
            status_code=status.HTTP_409_CONFLICT
        )


class ModelNotLoadedError(AppException):
    def __init__(self, detail: str = "El modelo predictivo no se encuentra cargado en memoria."):
        super().__init__(
            message=detail,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        )


# =====================================================================
# 2. MANEJADORES GLOBALES (HANDLERS)
# =====================================================================
def register_error_handlers(app: FastAPI) -> None:
    """Registra todos los controladores de excepciones en la instancia de FastAPI."""

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": True,
                "type": exc.__class__.__name__,
                "message": exc.message,
                "payload": exc.payload,
                "path": request.url.path,
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        details = []
        for error in exc.errors():
            details.append({
                "loc": error.get("loc"),
                "msg": error.get("msg"),
                "type": error.get("type"),
            })
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": True,
                "type": "ValidationError",
                "message": "Error de validación en la estructura de la solicitud.",
                "details": details,
                "path": request.url.path,
            },
        )

    @app.exception_handler(asyncpg.UniqueViolationError)
    async def asyncpg_unique_handler(request: Request, exc: asyncpg.UniqueViolationError):
        logger.warning(f"Conflicto de unicidad en BD: {exc}")
        constraint = getattr(exc, "constraint_name", "desconocida")
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "error": True,
                "type": "DatabaseConflictError",
                "message": "El registro ya existe en el sistema.",
                "constraint": constraint,
                "path": request.url.path,
            },
        )

    @app.exception_handler(asyncpg.ForeignKeyViolationError)
    async def asyncpg_foreign_key_handler(request: Request, exc: asyncpg.ForeignKeyViolationError):
        logger.error(f"Violación de clave foránea en BD: {exc}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "error": True,
                "type": "ForeignKeyViolationError",
                "message": "Referencia inválida: la entidad relacionada no existe.",
                "path": request.url.path,
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.error(f"Error no controlado en {request.url.path}: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": True,
                "type": "InternalServerError",
                "message": "Ocurrió un error interno en el servidor. Consulte los logs de ejecución.",
                "path": request.url.path,
            },
        )