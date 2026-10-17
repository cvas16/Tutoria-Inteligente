from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.deps import get_db, require_role
from app.repositories.alert_repository import AlertRepository
from app.repositories.intervention_repository import InterventionRepository
from app.schemas.alert import AlertDetailResponse, AlertRecord, AlertStatusUpdate, AlertStatusResponse

router = APIRouter(prefix="/alerts", tags=["alertas"])

@router.get("/{alert_id}", response_model=AlertDetailResponse)
async def get_alert(
    alert_id: UUID,
    user_info = Depends(require_role(["TUTOR", "ADMIN"])),
    pool = Depends(get_db)
):
    repo = AlertRepository(pool)
    alert = await repo.get_by_id(alert_id)
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alerta temprana no encontrada.")
    alert["interventions"] = await InterventionRepository(pool).list_by_alert(alert_id)
    return alert

@router.get("", response_model=list[AlertRecord])
async def get_all_alerts(
    status: str | None = Query(None, description="Filtrar por PENDING, NOTIFIED, INTERVENED, RESOLVED"),
    limit: int = Query(50, ge=1, le=100),
    user_info = Depends(require_role(["TUTOR", "ADMIN"])),
    pool = Depends(get_db)
):
    repo = AlertRepository(pool)
    return await repo.list_alerts(status, limit)

@router.patch("/{alert_id}", response_model=AlertStatusResponse)
async def modify_alert_status(
    alert_id: UUID,
    payload: AlertStatusUpdate,
    user_info = Depends(require_role(["TUTOR", "ADMIN"])),
    pool = Depends(get_db)
):
    repo = AlertRepository(pool)
    updated = await repo.update_status(alert_id, payload.status, tutor_id=user_info.user_id)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alerta temprana no encontrada.")
    return updated