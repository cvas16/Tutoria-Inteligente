import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db_pool, close_db_pool
from app.core.errors import register_error_handlers
from app.services.model_service import ModelService
from app.api.v1.router import api_router

# Configuración del registrador de eventos 
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("its_backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestiona el ciclo de vida del servidor ASGI.
    - Startup: Abre el connection pool de PostgreSQL y carga LightGBM/SHAP en memoria.
    - Shutdown: Libera ordenadamente los recursos y conexiones activas.
    """
    logger.info("Iniciando servicios del Sistema de Tutoría Inteligente (UPN 2026)...")
    
    # Inicialización del pool de conexiones PostgreSQL con asyncpg
    try:
        await init_db_pool()
        logger.info("Pool de conexiones a PostgreSQL inicializado con éxito.")
    except Exception as exc:
        logger.error(f"Error crítico al conectar con la base de datos: {exc}")
        raise exc

    #  Carga determinista de binarios de Machine Learning (LightGBM + TreeExplainer)
    try:
        ModelService.load_artifacts()
        logger.info(f"Modelo predictivo cargado exitosamente desde: {settings.ARTIFACTS_DIR}")
    except Exception as exc:
        logger.warning(
            f"No se pudieron precargar los artefactos de ML: {exc}. "
            "El servicio se iniciará pero los endpoints predictivos requerirán los archivos."
        )

    yield

    #  Cierre ordenado de conexiones al apagar el contenedor/servidor
    logger.info("Cerrando servicios y liberando connection pool...")
    await close_db_pool()
    logger.info("Conexiones a base de datos cerradas. Servidor detenido.")


# Creación de la instancia principal de FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "API REST para la Detección Temprana del Riesgo de Deserción en Entornos e-Learning. "
        "Soporta explicabilidad local algorítmica (SHAP), auditoría temporal, despacho de alertas tutorales "
        "y recolección del instrumento psicométrico de tesis (Anexo 3)."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configuración de políticas de intercambio de recursos (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de controladores globales de excepciones
register_error_handlers(app)

# Inclusión del enrutador central bajo el prefijo unificado /api/v1
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health", tags=["diagnóstico"], summary="Comprobación de estado del servicio")
async def health_check():
    """Endpoint de monitoreo ligero para contenedores Docker y balanceadores de carga."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=(settings.ENVIRONMENT == "development")
    )