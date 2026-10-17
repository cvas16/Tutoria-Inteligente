from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field

class SurveyCreate(BaseModel):
    student_id: UUID = Field(..., description="Identificador único del estudiante evaluador")
    # Dimensión 1: Detección oportuna del riesgo académico (Q1, Q3, Q6, Q7, Q9)
    q01: int = Field(..., ge=1, le=5, description="Ítem 1: Interfaz y visualización de dificultades")
    q03: int = Field(..., ge=1, le=5, description="Ítem 3: Navegación y consulta de diagnósticos")
    q06: int = Field(..., ge=1, le=5, description="Ítem 6: Acceso multiplataforma y calificaciones")
    q07: int = Field(..., ge=1, le=5, description="Ítem 7: Reconocimiento inmediato de tareas críticas")
    q09: int = Field(..., ge=1, le=5, description="Ítem 9: Claridad visual de niveles de riesgo")
    # Dimensión 2: Reducción de barreras de monitoreo continuo (Q2, Q4, Q8, Q12)
    q02: int = Field(..., ge=1, le=5, description="Ítem 2: Reducción de demoras en monitoreo continuo")
    q04: int = Field(..., ge=1, le=5, description="Ítem 4: Reducción de sobrecarga operativa")
    q08: int = Field(..., ge=1, le=5, description="Ítem 8: Carga rápida y control de inactividad")
    q12: int = Field(..., ge=1, le=5, description="Ítem 12: Superación de límites de distancia física")
    # Dimensión 3: Efectividad de alertas tempranas y tutoría (Q5, Q10, Q11)
    q05: int = Field(..., ge=1, le=5, description="Ítem 5: Alertas automáticas y apoyo pedagógico")
    q10: int = Field(..., ge=1, le=5, description="Ítem 10: Pautas formativas intuitivas")
    q11: int = Field(..., ge=1, le=5, description="Ítem 11: Precisión predictiva y motivación")

class SurveyResponse(BaseModel):
    id: UUID
    student_id: UUID
    submission_date: datetime

class DimensionScores(BaseModel):
    mean_dimension_1: float | None = Field(default=None, description="Media Detección Oportuna (Q1, Q3, Q6, Q7, Q9)")
    mean_dimension_2: float | None = Field(default=None, description="Media Reducción de Barreras (Q2, Q4, Q8, Q12)")
    mean_dimension_3: float | None = Field(default=None, description="Media Efectividad de Alertas (Q5, Q10, Q11)")
    global_mean: float | None = None
    total_respondents: int