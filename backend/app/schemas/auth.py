from uuid import UUID
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class LoginPayload(BaseModel):
    email: EmailStr = Field(..., description="Correo electrónico institucional")
    password: str = Field(..., min_length=6, description="Contraseña de acceso")

class TokenPayload(BaseModel):
    user_id: UUID
    role: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: UUID

class EnrollmentSummary(BaseModel):
    enrollment_id: UUID
    course_id: UUID
    course_code: str
    course_name: str
    academic_term: str
    risk_level: Optional[str] = None
    dropout_probability: Optional[float] = None

class UserProfileResponse(BaseModel):
    id: UUID
    institutional_id: str
    first_name: str
    last_name: str
    email: EmailStr
    role: str
    enrollment: Optional[EnrollmentSummary] = None