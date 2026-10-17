from typing import Dict, Any
import asyncpg


class AnalyticsService:
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool

    async def get_classroom_kpis(self) -> Dict[str, Any]:
        query = """
            SELECT 
                COUNT(e.id) AS total_students,
                COUNT(*) FILTER (WHERE latest.risk_level = 'HIGH') AS high_risk_count,
                COUNT(*) FILTER (WHERE latest.risk_level = 'MEDIUM') AS medium_risk_count,
                COUNT(*) FILTER (WHERE latest.risk_level = 'LOW') AS low_risk_count,
                (SELECT COUNT(*) FROM early_alerts WHERE status = 'PENDING') AS pending_alerts_count,
                (SELECT COUNT(*) FROM early_alerts WHERE status = 'RESOLVED') AS resolved_alerts_count
            FROM enrollments e
            LEFT JOIN LATERAL (
                SELECT p.risk_level
                FROM ml_predictions p
                WHERE p.enrollment_id = e.id
                ORDER BY p.predicted_at DESC
                LIMIT 1
            ) latest ON TRUE;
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(query)
            return dict(row) if row else {}