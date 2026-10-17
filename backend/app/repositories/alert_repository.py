from uuid import UUID
from typing import Any
import json
import asyncpg

class AlertRepository:
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool

    async def get_by_id(self, alert_id: UUID) -> dict[str, Any] | None:
        query = """
            SELECT a.id, a.prediction_id, a.tutor_id, a.status, a.recommendation_text,
                   a.notified_at, a.resolved_at, p.enrollment_id, p.dropout_probability,
                   p.risk_level, p.shap_summary, u.first_name, u.last_name,
                   u.institutional_id, c.code AS course_code
            FROM early_alerts a
            JOIN ml_predictions p ON p.id = a.prediction_id
            JOIN enrollments e ON e.id = p.enrollment_id
            JOIN users u ON u.id = e.student_id
            JOIN courses c ON c.id = e.course_id
            WHERE a.id = $1;
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, alert_id)
            if not row:
                return None
            alert = dict(row)
            if isinstance(alert["shap_summary"], str):
                alert["shap_summary"] = json.loads(alert["shap_summary"])
            return alert

    async def list_alerts(self, status_filter: str | None = None, limit: int = 50) -> list[dict[str, Any]]:
        query = """
            SELECT a.id, a.prediction_id, a.tutor_id, a.status, a.recommendation_text,
                   a.notified_at, a.resolved_at, p.dropout_probability, p.risk_level,
                   u.first_name, u.last_name, u.institutional_id, c.code AS course_code
            FROM early_alerts a
            JOIN ml_predictions p ON p.id = a.prediction_id
            JOIN enrollments e ON e.id = p.enrollment_id
            JOIN users u ON u.id = e.student_id
            JOIN courses c ON c.id = e.course_id
            WHERE ($1::text IS NULL OR a.status = $1)
            ORDER BY p.dropout_probability DESC, a.notified_at DESC
            LIMIT $2;
        """
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, status_filter, limit)
            return [dict(r) for r in rows]

    async def update_status(
        self, alert_id: UUID, new_status: str, tutor_id: UUID | None = None
    ) -> dict[str, Any] | None:
        query = """
            UPDATE early_alerts
            SET status = $1::varchar,
                tutor_id = COALESCE($2, tutor_id),
                notified_at = CASE
                    WHEN $1::varchar = 'NOTIFIED' THEN COALESCE(notified_at, CURRENT_TIMESTAMP)
                    WHEN $1::varchar = 'PENDING' THEN NULL
                    ELSE notified_at
                END,
                resolved_at = CASE WHEN $1::varchar = 'RESOLVED' THEN CURRENT_TIMESTAMP ELSE NULL END
            WHERE id = $3
            RETURNING id, prediction_id, tutor_id, status, notified_at, resolved_at;
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, new_status, tutor_id, alert_id)
            return dict(row) if row else None