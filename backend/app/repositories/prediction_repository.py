from uuid import UUID
from typing import Dict, Any, List, Optional
import asyncpg
import json

class PredictionRepository:
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool

    async def fetch_cutoff_features(self, enrollment_id: UUID, cutoff_week: int) -> Optional[Dict[str, Any]]:
        query = """
            SELECT login_count, inactivity_days, avg_score_evaluations,
                   late_submissions_count, materials_accessed, forum_interactions
            FROM fn_ml_features($1, now(), $2);
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, cutoff_week, enrollment_id)
            if not row:
                return None
            return dict(row)

    async def save_prediction_and_alert(
        self,
        enrollment_id: UUID,
        cutoff_week: int,
        model_version: str,
        dropout_probability: float,
        risk_level: str,
        shap_summary: Dict[str, float],
        features_snapshot: Dict[str, Any],
        recommendation_text: Optional[str]
    ) -> tuple[UUID, Optional[UUID]]:
        async with self.pool.acquire() as conn:
            async with conn.transaction():
                # 1. Guardar registro en ml_predictions
                pred_query = """
                    INSERT INTO ml_predictions (
                        enrollment_id, cut_off_week, model_version, 
                        dropout_probability, risk_level, shap_summary, features_snapshot
                    )
                    VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)
                    ON CONFLICT (enrollment_id, cut_off_week, model_version)
                    DO UPDATE SET 
                        dropout_probability = EXCLUDED.dropout_probability,
                        risk_level = EXCLUDED.risk_level,
                        shap_summary = EXCLUDED.shap_summary,
                        features_snapshot = EXCLUDED.features_snapshot,
                        predicted_at = CURRENT_TIMESTAMP
                    RETURNING id;
                """
                prediction_id = await conn.fetchval(
                    pred_query,
                    enrollment_id,
                    cutoff_week,
                    model_version,
                    dropout_probability,
                    risk_level,
                    json.dumps(shap_summary),
                    json.dumps(features_snapshot)
                )

                alert_id = None
                if risk_level in ["MEDIUM", "HIGH"] and recommendation_text:
                    alert_query = """
                        INSERT INTO early_alerts (prediction_id, status, recommendation_text)
                        VALUES ($1, 'PENDING', $2)
                        ON CONFLICT (prediction_id) DO UPDATE 
                        SET recommendation_text = EXCLUDED.recommendation_text
                        RETURNING id;
                    """
                    alert_id = await conn.fetchval(alert_query, prediction_id, recommendation_text)

                return prediction_id, alert_id

    async def list_by_enrollment(self, enrollment_id: UUID, limit: int = 20) -> List[Dict[str, Any]]:
        query = """
            SELECT id, enrollment_id, cut_off_week, model_version, 
                   dropout_probability, risk_level, shap_summary, predicted_at
            FROM ml_predictions
            WHERE enrollment_id = $1
            ORDER BY cut_off_week ASC, predicted_at DESC
            LIMIT $2;
        """
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, enrollment_id, limit)
            return [dict(r) for r in rows]