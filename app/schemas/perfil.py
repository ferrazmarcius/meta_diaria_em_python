# Em app/schemas/perfil.py

from pydantic import BaseModel, Field

class AtualizarPerfil(BaseModel):
    nome_usuario: str | None = None
    senha: str | None = Field(None, min_length=6, description="A nova senha deve ter no mínimo 6 caracteres")