from uuid import UUID
from typing import Dict, Any
import asyncpg
from app.repositories.survey_repository import SurveyRepository
from app.schemas.survey import SurveyCreate
from app.core.errors import SurveyAlreadyCompletedError


class SurveyService:
    def __init__(self, pool: asyncpg.Pool):
        self.repo = SurveyRepository(pool)

    async def register_response(self, data: SurveyCreate) -> Dict[str, Any]:
        existing = await self.repo.get_by_student(data.student_id)
        if existing:
            raise SurveyAlreadyCompletedError(data.student_id)

        return await self.repo.save_survey(
            student_id=data.student_id,
            q01=data.q01, q02=data.q02, q03=data.q03, q04=data.q04,
            q05=data.q05, q06=data.q06, q07=data.q07, q08=data.q08,
            q09=data.q09, q10=data.q10, q11=data.q11, q12=data.q12
        )

    async def compute_summary(self) -> Dict[str, Any]:
        return await self.repo.get_dimension_metrics()