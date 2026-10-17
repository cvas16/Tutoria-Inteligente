from fastapi import APIRouter, Depends, HTTPException, status
import asyncpg

from app.core.deps import get_db, get_current_user_payload
from app.repositories.user_repository import UserRepository
from app.schemas.auth import TokenPayload, UserProfileResponse

router = APIRouter(prefix="/me", tags=["perfil"])


@router.get("", response_model=UserProfileResponse, summary="Obtener perfil del usuario autenticado")
async def get_current_user_profile(
    current_user: TokenPayload = Depends(get_current_user_payload),
    pool: asyncpg.Pool = Depends(get_db)
):
    """
    Retorna los datos de identidad institucional del usuario autenticado,
    su rol verificado y su contexto de matrícula o docencia activa.
    """
    repo = UserRepository(pool)
    user = await repo.get_by_id(current_user.user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El perfil del usuario autenticado no existe en la base de datos."
        )

    # Si es estudiante, se recuperan datos de acompañamiento académico
    enrollment_info = None
    if user["role"] == "STUDENT":
        enrollment_info = await repo.get_active_enrollment_summary(user["id"])

    return UserProfileResponse(
        id=user["id"],
        institutional_id=user["institutional_id"],
        first_name=user["first_name"],
        last_name=user["last_name"],
        email=user["email"],
        role=user["role"],
        enrollment=enrollment_info
    )