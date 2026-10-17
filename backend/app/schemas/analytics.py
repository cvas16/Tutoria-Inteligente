from pydantic import BaseModel, Field

class AnalyticsSummaryResponse(BaseModel):
    total_students: int = Field(default=0, ge=0)
    high_risk_count: int = Field(default=0, ge=0)
    medium_risk_count: int = Field(default=0, ge=0)
    low_risk_count: int = Field(default=0, ge=0)
    pending_alerts_count: int = Field(default=0, ge=0)
    resolved_alerts_count: int = Field(default=0, ge=0)