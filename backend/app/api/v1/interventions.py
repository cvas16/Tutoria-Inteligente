from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
import asyncpg

from app.core.deps import get_db, require_role
from app.repositories.intervention_repository import InterventionRepository
from app.repositories.alert_repository import AlertRepository
from app.schemas.auth import TokenPayload
from app.schemas.intervention import (
    InterventionCreate,
    InterventionResponse,
    InterventionDetailRecord
)

router = APIRouter(prefix="/interventions", tags=["intervenciones"])


@router.post(
    "",
    response_model=InterventionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar acción de intervención tutoral sobre una alerta"
)
async def create_intervention(
    payload: InterventionCreate,
    current_user: TokenPayload = Depends(require_role(["TUTOR", "ADMIN"])),
    pool: asyncpg.Pool = Depends(get_db)
):
    """
    Registra una acción correctiva o de acompañamiento pedagógico (entrevista, refuerzo, material).
    Actualiza automáticamente el estado de la alerta asociada a 'INTERVENED' o 'RESOLVED'.
    """
    alert_repo = AlertRepository(pool)
    intervention_repo = InterventionRepository(pool)

    # Validar existencia de la alerta temprana
    alert = await alert_repo.get_by_id(payload.alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La alerta con ID {payload.alert_id} no existe."
        )

    # Registrar la intervención tutoral en la base de datos
    new_intervention = await intervention_repo.create_intervention(
        alert_id=payload.alert_id,
        tutor_id=current_user.user_id,
        action_type=payload.action_type,
        notes=payload.notes,
        agreed_commitment=payload.agreed_commitment
    )

    # Transicionar estado de la alerta según corresponda
    target_status = "RESOLVED" if payload.mark_as_resolved else "INTERVENED"
    await alert_repo.update_status(
        alert_id=payload.alert_id,
        new_status=target_status,
        tutor_id=current_user.user_id
    )

    return new_intervention


@router.get(
    "/alert/{alert_id}",
    response_model=list[InterventionDetailRecord],
    summary="Listar historial de intervenciones realizadas sobre una alerta"
)
async def list_interventions_by_alert(
    alert_id: UUID,
    current_user: TokenPayload = Depends(require_role(["TUTOR", "ADMIN"])),
    pool: asyncpg.Pool = Depends(get_db)
):
    """Obtiene la bitácora cronológica de acciones de soporte pedagógico ejecutadas para un caso."""
    intervention_repo = InterventionRepository(pool)
    return await intervention_repo.list_by_alert(alert_id)


@router.get(
    "/my-interventions",
    response_model=list[InterventionDetailRecord],
    summary="Listar intervenciones gestionadas por el tutor en sesión"
)
async def list_my_interventions(
    limit: int = Query(50, ge=1, le=100),
    current_user: TokenPayload = Depends(require_role(["TUTOR"])),
    pool: asyncpg.Pool = Depends(get_db)
):
    """Obtiene el historial de intervenciones ejecutadas por el docente o tutor autenticado."""
    intervention_repo = InterventionRepository(pool)
    return await intervention_repo.list_by_tutor(current_user.user_id, limit=limit)