from uuid import UUID
from typing import Any, Optional
import asyncpg


class UserRepository:
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool

    async def get_by_id(self, user_id: UUID) -> Optional[dict[str, Any]]:
        """Recupera los datos base de un usuario por su clave primaria UUID."""
        query = """
            SELECT id, institutional_id, first_name, last_name, email, role, created_at
            FROM users
            WHERE id = $1;
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, user_id)
            return dict(row) if row else None

    async def get_by_email(self, email: str) -> Optional[dict[str, Any]]:
        """
        Recupera el usuario para autenticación (incluyendo el password_hash).
        Aprovecha el índice insensible a mayúsculas 'uq_users_email_ci'.
        """
        query = """
            SELECT id, institutional_id, first_name, last_name, email, role, password_hash
            FROM users
            WHERE lower(email) = lower($1);
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, email)
            return dict(row) if row else None

    async def get_active_enrollment_summary(self, student_id: UUID) -> Optional[dict[str, Any]]:
        """
        Recupera el contexto de la matrícula activa del estudiante, 
        su curso asignado y la última evaluación de riesgo calculada.
        """
        query = """
            SELECT e.id AS enrollment_id, e.status, e.enrolled_at,
                   c.id AS course_id, c.code AS course_code, c.name AS course_name, c.academic_term,
                   p.risk_level, p.dropout_probability, p.predicted_at
            FROM enrollments e
            JOIN courses c ON c.id = e.course_id
            LEFT JOIN LATERAL (
                SELECT risk_level, dropout_probability, predicted_at
                FROM ml_predictions
                WHERE enrollment_id = e.id
                ORDER BY predicted_at DESC
                LIMIT 1
            ) p ON TRUE
            WHERE e.student_id = $1 AND e.status = 'ACTIVE'
            LIMIT 1;
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, student_id)
            return dict(row) if row else None