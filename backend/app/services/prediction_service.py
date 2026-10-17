from uuid import UUID
from time import perf_counter
from typing import Dict, Any, Optional
import asyncpg
from fastapi.concurrency import run_in_threadpool
from app.repositories.prediction_repository import PredictionRepository
from app.services.model_service import ModelService
from app.services.recommendations import build_recommendation
from app.core.errors import EnrollmentNotFoundError


class PredictionService:
    def __init__(self, pool: asyncpg.Pool):
        self.repo = PredictionRepository(pool)

    async def execute_prediction(
        self,
        cutoff_week: int,
        features: Optional[Dict[str, Any]] = None,
        enrollment_id: Optional[UUID] = None,
        persist: bool = True
    ) -> Dict[str, Any]:
        if features is None:
            if enrollment_id is None:
                raise ValueError("Se requiere 'enrollment_id' o 'features'.")
            features = await self.repo.fetch_cutoff_features(enrollment_id, cutoff_week)
            if not features:
                raise EnrollmentNotFoundError(enrollment_id)

        t0 = perf_counter()
        result = await run_in_threadpool(ModelService.predict, features)
        latency_ms = (perf_counter() - t0) * 1000

        recommendation = (
            build_recommendation(result["shap_summary"])
            if result["risk_level"] != "LOW" else None
        )

        prediction_id = alert_id = None
        if persist and enrollment_id is not None:
            tutor_note = (recommendation or {}).get("tutor")
            prediction_id, alert_id = await self.repo.save_prediction_and_alert(
                enrollment_id=enrollment_id,
                cutoff_week=cutoff_week,
                model_version=result["model_version"],
                dropout_probability=result["dropout_probability"],
                risk_level=result["risk_level"],
                shap_summary=result["shap_summary"],
                features_snapshot=features,
                recommendation_text=tutor_note
            )

        return {
            **result,
            "recommendation": recommendation,
            "warnings": ModelService.warnings_for(cutoff_week),
            "prediction_id": prediction_id,
            "alert_id": alert_id,
            "latency_ms": round(latency_ms, 2)
        }