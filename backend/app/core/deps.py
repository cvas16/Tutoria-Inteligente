from uuid import UUID
import secrets
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import asyncpg
from app.core.database import get_db_pool
from app.core.security import decode_access_token
from app.schemas.auth import TokenPayload
from app.core.config import settings

security_bearer = HTTPBearer(auto_error=False)

async def get_db() -> asyncpg.Pool:
    return await get_db_pool()

async def require_api_key(api_key: str | None = Header(default=None, alias="X-API-Key")) -> None:
    if not api_key or not secrets.compare_digest(api_key, settings.API_KEY):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key inválida o no suministrada.",
            headers={"WWW-Authenticate": "ApiKey"},
        )

async def get_current_user_payload(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_bearer)
) -> TokenPayload:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales de autenticación no suministradas.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_access_token(credentials.credentials)
        return TokenPayload(user_id=UUID(payload["sub"]), role=payload["role"])
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de acceso inválido o expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )

def require_role(allowed_roles: list[str]):
    def role_checker(token_data: TokenPayload = Depends(get_current_user_payload)) -> TokenPayload:
        if token_data.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acceso denegado: permisos insuficientes para ejecutar esta acción."
            )
        return token_data
    return role_checker