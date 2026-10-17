from uuid import UUID
from datetime import datetime
from typing import Dict, Optional, List
from pydantic import BaseModel, Field

class FeaturePayload(BaseModel):
    login_count: int = Field(default=0, ge=0)
    total_time_seconds: int = Field(default=0, ge=0)
    materials_accessed: int = Field(default=0, ge=0)
    forum_interactions: int = Field(default=0, ge=0)
    inactivity_days: int = Field(default=0, ge=0)
    avg_score_evaluations: Optional[float] = Field(default=None, ge=0.0, le=20.0)
    late_submissions_count: int = Field(default=0, ge=0)
    academic_term: str = Field(default="2026-1")
    course_code: str = Field(default="SIS-101")

class PredictionRequest(BaseModel):
    enrollment_id: Optional[UUID] = None
    cutoff_week: int = Field(..., ge=1, le=16, description="Semana lectiva de corte")
    features: FeaturePayload
    persist: bool = Field(default=True, description="Guardar snapshot en BD")

class RecommendationPayload(BaseModel):
    tutor: Optional[str] = None
    student: Optional[str] = None

class PredictionResponse(BaseModel):
    dropout_probability: float = Field(..., ge=0.0, le=1.0)
    risk_level: str = Field(..., description="LOW, MEDIUM o HIGH")
    shap_summary: Dict[str, float] = Field(default_factory=dict)
    model_version: str
    recommendation: Optional[RecommendationPayload] = None
    warnings: List[str] = Field(default_factory=list)
    prediction_id: Optional[UUID] = None
    alert_id: Optional[UUID] = None
    latency_ms: float

class PredictionRecord(BaseModel):
    id: UUID
    enrollment_id: UUID
    cut_off_week: int
    model_version: str
    dropout_probability: float
    risk_level: str
    shap_summary: Dict[str, float]
    predicted_at: datetime