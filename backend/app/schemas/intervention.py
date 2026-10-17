from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class InterventionCreate(BaseModel):
    alert_id: UUID = Field(..., description="ID de la alerta temprana atendida")
    action_type: str = Field(..., description="ENTREVISTA, REFUERZO_ACADEMICO, ENVIO_MATERIAL, etc.")
    notes: str = Field(..., min_length=5, description="Observaciones pedagógicas de la sesión")
    agreed_commitment: Optional[str] = Field(default=None, description="Compromiso acordado con el estudiante")
    mark_as_resolved: bool = Field(default=False, description="Actualizar estado de la alerta a RESOLVED")

class InterventionResponse(BaseModel):
    id: UUID
    alert_id: UUID
    tutor_id: UUID
    action_type: str
    notes: str
    agreed_commitment: Optional[str] = None
    executed_at: datetime

class InterventionDetailRecord(BaseModel):
    id: UUID
    alert_id: UUID
    tutor_id: UUID
    action_type: str
    notes: str
    agreed_commitment: Optional[str] = None
    executed_at: datetime
    tutor_first_name: Optional[str] = None
    tutor_last_name: Optional[str] = None
    student_first_name: Optional[str] = None
    student_last_name: Optional[str] = None
    student_code: Optional[str] = None
    course_code: Optional[str] = None