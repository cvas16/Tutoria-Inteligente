from uuid import UUID
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.intervention import InterventionDetailRecord

class AlertStatus(str, Enum):
    PENDING = "PENDING"
    NOTIFIED = "NOTIFIED"
    INTERVENED = "INTERVENED"
    RESOLVED = "RESOLVED"

class AlertStatusUpdate(BaseModel):
    status: AlertStatus = Field(..., description="Nuevo estado de la alerta temprana")

class AlertStatusResponse(BaseModel):
    id: UUID
    prediction_id: UUID
    tutor_id: Optional[UUID] = None
    status: AlertStatus
    notified_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

class AlertRecord(BaseModel):
    id: UUID
    prediction_id: UUID
    tutor_id: Optional[UUID] = None
    status: AlertStatus
    recommendation_text: str
    notified_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    dropout_probability: float
    risk_level: str
    first_name: str
    last_name: str
    institutional_id: str
    course_code: str

class AlertDetailResponse(AlertRecord):
    enrollment_id: UUID
    shap_summary: dict[str, float] = Field(default_factory=dict)
    interventions: list[InterventionDetailRecord] = Field(default_factory=list)