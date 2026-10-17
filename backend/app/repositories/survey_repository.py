from uuid import UUID
from typing import Any, List, Optional
import asyncpg


class SurveyRepository:
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool

    async def save_survey(
        self,
        student_id: UUID,
        q01: int, q02: int, q03: int, q04: int,
        q05: int, q06: int, q07: int, q08: int,
        q09: int, q10: int, q11: int, q12: int
    ) -> dict[str, Any]:
        """
        Inserta las respuestas del cuestionario Likert en 'evaluation_surveys'.
        Garantiza que el usuario tenga rol 'STUDENT' mediante la restricción DDL.
        """
        query = """
            INSERT INTO evaluation_surveys (
                student_id, student_role,
                q01, q02, q03, q04, q05, q06, q07, q08, q09, q10, q11, q12,
                submission_date
            )
            VALUES ($1, 'STUDENT', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
            RETURNING id, student_id, submission_date;
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                query,
                student_id,
                q01, q02, q03, q04,
                q05, q06, q07, q08,
                q09, q10, q11, q12
            )
            return dict(row)

    async def get_by_student(self, student_id: UUID) -> Optional[dict[str, Any]]:
        """Verifica si el estudiante ya cuenta con un cuestionario respondido."""
        query = """
            SELECT id, student_id, submission_date,
                   q01, q02, q03, q04, q05, q06, q07, q08, q09, q10, q11, q12
            FROM evaluation_surveys
            WHERE student_id = $1;
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query, student_id)
            return dict(row) if row else None

    async def get_dimension_metrics(self) -> dict[str, Any]:
        """
        Calcula las medias por dimensión para las Tablas 2, 3, 4 y 5 del Capítulo III:
        - Dimensión 1: Detección oportuna del riesgo (Q1, Q3, Q6, Q7, Q9)
        - Dimensión 2: Reducción de barreras de monitoreo (Q2, Q4, Q8, Q12)
        - Dimensión 3: Efectividad de alertas tempranas (Q5, Q10, Q11)
        """
        query = """
            SELECT 
                COUNT(*) AS total_respondents,
                ROUND(AVG((q01 + q03 + q06 + q07 + q09) / 5.0), 2) AS mean_dimension_1,
                ROUND(AVG((q02 + q04 + q08 + q12) / 4.0), 2) AS mean_dimension_2,
                ROUND(AVG((q05 + q10 + q11) / 3.0), 2) AS mean_dimension_3,
                ROUND(AVG((q01 + q02 + q03 + q04 + q05 + q06 + q07 + q08 + q09 + q10 + q11 + q12) / 12.0), 2) AS global_mean
            FROM evaluation_surveys;
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query)
            return dict(row) if row else {}

    async def export_raw_matrix(self) -> List[dict[str, Any]]:
        """Extrae la matriz completa de datos para análisis inferencial en Python (Shapiro-Wilk y Spearman)."""
        query = """
            SELECT s.student_id, u.institutional_id,
                   s.q01, s.q02, s.q03, s.q04, s.q05, s.q06,
                   s.q07, s.q08, s.q09, s.q10, s.q11, s.q12,
                   s.submission_date
            FROM evaluation_surveys s
            JOIN users u ON u.id = s.student_id
            ORDER BY s.submission_date ASC;
        """
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query)
            return [dict(r) for r in rows]