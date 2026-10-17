from uuid import UUID
from time import perf_counter
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.concurrency import run_in_threadpool

from app.core.deps import get_db, require_api_key
from app.repositories.prediction_repository import PredictionRepository
from app.services.model_service import ModelService
from app.services.recommendations import build_recommendation
from app.schemas.prediction import PredictionRequest, PredictionResponse, PredictionRecord

router = APIRouter(tags=["predicciones"], dependencies=[Depends(require_api_key)])

@router.post("/enrollments/{enrollment_id}/predict", response_model=PredictionResponse)
async def predict_from_enrollment(
    enrollment_id: UUID,
    cutoff_week: int = Query(..., ge=1, le=16, description="Semana de corte lectiva"),
    persist: bool = Query(True, description="Persistir resultado e integrar con alertas"),
    pool = Depends(get_db)
):
    repo = PredictionRepository(pool)
    features = await repo.fetch_cutoff_features(enrollment_id, cutoff_week)
    if not features:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Matrícula {enrollment_id} no encontrada o sin registros en el ciclo."
        )

    t0 = perf_counter()
    result = await run_in_threadpool(ModelService.predict, features)
    latency_ms = (perf_counter() - t0) * 1000

    recommendation = build_recommendation(result["shap_summary"]) if result["risk_level"] != "LOW" else None
    
    prediction_id = None
    alert_id = None
    if persist:
        tutor_note = (recommendation or {}).get("tutor")
        prediction_id, alert_id = await repo.save_prediction_and_alert(
            enrollment_id=enrollment_id,
            cutoff_week=cutoff_week,
            model_version=result["model_version"],
            dropout_probability=result["dropout_probability"],
            risk_level=result["risk_level"],
            shap_summary=result["shap_summary"],
            features_snapshot=features,
            recommendation_text=tutor_note
        )

    return PredictionResponse(
        **result,
        recommendation=recommendation,
        warnings=ModelService.warnings_for(cutoff_week),
        prediction_id=prediction_id,
        alert_id=alert_id,
        latency_ms=round(latency_ms, 2)
    )

@router.get("/enrollments/{enrollment_id}/predictions", response_model=list[PredictionRecord])
async def get_history(enrollment_id: UUID, limit: int = Query(20, ge=1, le=50), pool = Depends(get_db)):
    repo = PredictionRepository(pool)
    return await repo.list_by_enrollment(enrollment_id, limit)