from pydantic import BaseModel, Field
from uuid import UUID

class ResumoMeta(BaseModel):
    meta_id: UUID
    nome_meta: str
    valor_meta: float
    total_arrecadado: float = Field(ge=0)
    valor_faltante: float
    progresso: float = Field(ge=0, le=100)