from uuid import UUID
from typing import Any, List, Optional
import asyncpg


class InterventionRepository:
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool

    async def create_intervention(
        self,
        alert_id: UUID,
        tutor_id: UUID,
        action_type: str,
        notes: str,
        agreed_commitment: Optional[str] = None
    ) -> dict[str, Any]:
        """
        Registra una acción de tutoría adaptativa ejecutada y asocia 
        la intervención directamente al tutor y a la alerta correspondiente.
        """
        query = """
            INSERT INTO tutor_interventions (
                alert_id, tutor_id, action_type, notes, agreed_commitment, executed_at
            )
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            RETURNING id, alert_id, tutor_id, action_type, notes, agreed_commitment, executed_at;
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                query,
                alert_id,
                tutor_id,
                action_type,
                notes,
                agreed_commitment
            )
            return dict(row)

    async def list_by_alert(self, alert_id: UUID) -> List[dict[str, Any]]:
        """Recupera el historial de intervenciones y acuerdos de una alerta en orden cronológico."""
        query = """
            SELECT i.id, i.alert_id, i.tutor_id, i.action_type, i.notes, 
                   i.agreed_commitment, i.executed_at,
                   u.first_name AS tutor_first_name, u.last_name AS tutor_last_name
            FROM tutor_interventions i
            JOIN users u ON u.id = i.tutor_id
            WHERE i.alert_id = $1
            ORDER BY i.executed_at ASC;
        """
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, alert_id)
            return [dict(r) for r in rows]

    async def list_by_tutor(self, tutor_id: UUID, limit: int = 50) -> List[dict[str, Any]]:
        """Recupera las intervenciones realizadas por un tutor docente específico."""
        query = """
            SELECT i.id, i.alert_id, i.tutor_id, i.action_type, i.notes, 
                   i.agreed_commitment, i.executed_at,
                   s.first_name AS student_first_name, s.last_name AS student_last_name,
                   s.institutional_id AS student_code, c.code AS course_code
            FROM tutor_interventions i
            JOIN early_alerts a ON a.id = i.alert_id
            JOIN ml_predictions p ON p.id = a.prediction_id
            JOIN enrollments e ON e.id = p.enrollment_id
            JOIN users s ON s.id = e.student_id
            JOIN courses c ON c.id = e.course_id
            WHERE i.tutor_id = $1
            ORDER BY i.executed_at DESC
            LIMIT $2;
        """
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, tutor_id, limit)
            return [dict(r) for r in rows]