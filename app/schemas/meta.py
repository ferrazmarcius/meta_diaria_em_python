
from pydantic import BaseModel
from datetime import date
from uuid import UUID # Para validar o formato do ID

# Schema para o corpo da requisição de criação de uma meta
class CriarMeta(BaseModel):
    nome_meta: str = "Minha Dívida" # Valor padrão
    valor_meta: float
    data_prazo: date | None = None # O prazo é opcional

# Schema para exibir os dados de uma meta que vem do banco
class Meta(BaseModel):
    id: UUID
    usuario_id: UUID
    nome_meta: str
    valor_meta: float
    data_prazo: date | None = None

class AtualizarMeta(BaseModel):
    nome_meta: str | None = None
    valor_meta: float | None = None
    data_prazo: date | None = None

    # Configuração para Pydantic entender o modelo do banco de dados
    class Config:
        from_attributes = True  