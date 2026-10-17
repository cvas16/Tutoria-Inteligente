from uuid import UUID
from typing import Dict, Any, List
import asyncpg
from app.repositories.intervention_repository import InterventionRepository
from app.repositories.alert_repository import AlertRepository
from app.core.errors import AppException


class InterventionService:
    def __init__(self, pool: asyncpg.Pool):
        self.intervention_repo = InterventionRepository(pool)
        self.alert_repo = AlertRepository(pool)

    async def record_intervention(
        self,
        alert_id: UUID,
        tutor_id: UUID,
        action_type: str,
        notes: str,
        agreed_commitment: str | None = None,
        mark_as_resolved: bool = False
    ) -> Dict[str, Any]:
        alert = await self.alert_repo.get_by_id(alert_id)
        if not alert:
            raise AppException(f"La alerta '{alert_id}' no existe.", status_code=404)

        intervention = await self.intervention_repo.create_intervention(
            alert_id=alert_id,
            tutor_id=tutor_id,
            action_type=action_type,
            notes=notes,
            agreed_commitment=agreed_commitment
        )

        target_status = "RESOLVED" if mark_as_resolved else "INTERVENED"
        await self.alert_repo.update_status(alert_id, target_status, tutor_id)

        return intervention

    async def get_history_by_alert(self, alert_id: UUID) -> List[Dict[str, Any]]:
        return await self.intervention_repo.list_by_alert(alert_id)