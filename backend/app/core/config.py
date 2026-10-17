import os
from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Identificación del Proyecto
    PROJECT_NAME: str = "Sistema de Tutoría Inteligente - Dropout Prevention"
    VERSION: str = "2.0.0"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = Field(default="development", description="development | staging | production")

    # Servidor y CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        return ["*"]

    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgrespassword@localhost:5432/tutor_inteligente_db",
        description="Cadena de conexión para SQL / asyncpg"
    )
    DB_POOL_MIN_SIZE: int = 5
    DB_POOL_MAX_SIZE: int = 20

    # Seguridad y Autenticación
    API_KEY: str = Field(default="dev-secret-key-2026", description="API Key para clientes internos")
    JWT_SECRET: str = Field(default="jwt-super-secret-key-tesis-upn-2026", description="Clave para firmar JWT")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 horas

    # Rutas del Sistema y Machine Learning
    # Resuelve la raíz /backend independientemente de dónde se invoque el proceso
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    ARTIFACTS_DIR: str = Field(default="")

    @field_validator("ARTIFACTS_DIR", mode="before")
    @classmethod
    def resolve_artifacts_dir(cls, v: str) -> str:
        if v and os.path.isabs(v):
            return v
        base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        return os.path.join(base, "artifacts")

    # Metadatos del Modelo Activo
    ACTIVE_MODEL_VERSION: str = "dropout_lgbm_v2"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()