from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
import asyncpg

from app.core.deps import get_db
from app.core.security import verify_password, create_access_token
from app.repositories.user_repository import UserRepository
from app.schemas.auth import TokenResponse, LoginPayload

router = APIRouter(prefix="/auth", tags=["autenticación"])


@router.post("/login", response_model=TokenResponse, summary="Iniciar sesión y obtener token JWT")
async def login(
    payload: LoginPayload,
    pool: asyncpg.Pool = Depends(get_db)
):
    """
    Autentica al usuario mediante correo institucional y contraseña.
    Emite un token JWT que incluye el rol y el ID del usuario en el payload.
    """
    repo = UserRepository(pool)
    user = await repo.get_by_email(payload.email.lower().strip())
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas: correo electrónico no registrado.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas: contraseña no válida.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=str(user["id"]), role=user["role"])

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user["role"],
        user_id=user["id"]
    )


@router.post("/token", response_model=TokenResponse, include_in_schema=False)
async def login_oauth2_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    pool: asyncpg.Pool = Depends(get_db)
):
    """Endpoint de compatibilidad para la documentación interactiva de Swagger UI."""
    repo = UserRepository(pool)
    user = await repo.get_by_email(form_data.username.lower().strip())
    
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas en formulario OAuth2.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=str(user["id"]), role=user["role"])
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user["role"],
        user_id=user["id"]
    )