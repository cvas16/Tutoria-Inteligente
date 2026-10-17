from fastapi import APIRouter, Depends
from app.core.deps import get_db, require_role
from app.schemas.analytics import AnalyticsSummaryResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/summary", response_model=AnalyticsSummaryResponse)
async def get_classroom_analytics(
    user_info = Depends(require_role(["TUTOR", "ADMIN"])),
    pool = Depends(get_db)
):
    return await AnalyticsService(pool).get_classroom_kpis()