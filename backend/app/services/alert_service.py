from uuid import UUID
from typing import List, Dict, Any, Optional
import asyncpg
from app.repositories.alert_repository import AlertRepository
from app.core.errors import AppException


class AlertService:
    def __init__(self, pool: asyncpg.Pool):
        self.repo = AlertRepository(pool)

    async def get_dashboard_alerts(self, status: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        return await self.repo.list_alerts(status_filter=status, limit=limit)

    async def transition_status(self, alert_id: UUID, new_status: str, tutor_id: UUID) -> Dict[str, Any]:
        valid_transitions = ["PENDING", "NOTIFIED", "INTERVENED", "RESOLVED"]
        if new_status not in valid_transitions:
            raise AppException(f"Estado '{new_status}' no reconocido.", status_code=400)

        updated = await self.repo.update_status(alert_id, new_status, tutor_id)
        if not updated:
            raise AppException(f"Alerta '{alert_id}' no encontrada.", status_code=404)
        return updated