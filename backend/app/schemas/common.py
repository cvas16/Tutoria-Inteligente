from typing import Generic, TypeVar, List
from pydantic import BaseModel, Field

T = TypeVar("T")

class PaginationParams(BaseModel):
    limit: int = Field(default=20, ge=1, le=100, description="Cantidad máxima de registros")
    offset: int = Field(default=0, ge=0, description="Desplazamiento inicial")

class PaginatedResponse(BaseModel, Generic[T]):
    total: int = Field(..., ge=0, description="Total de registros existentes")
    items: List[T] = Field(..., description="Listado paginado de elementos")

class GenericMessageResponse(BaseModel):
    success: bool = True
    message: str