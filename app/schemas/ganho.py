from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID

# Schema para o corpo da requisição de criação de um ganho
class CriarGanho(BaseModel):
    valor_ganho: float = Field(gt=0, description="O valor ganho deve ser maior que zero")
    fonte: str | None = None

# Schema para exibir os dados de um ganho
class Ganho(BaseModel):
    id: UUID
    meta_id: UUID
    valor_ganho: float
    fonte: str | None = None
    criado_em: datetime

    class Config:
        from_attributes = True