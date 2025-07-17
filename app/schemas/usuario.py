from pydantic import BaseModel, EmailStr

# Schema para o corpo da requisição de registro de usuário
class CriarUsuario(BaseModel):
    nome_usuario: str
    email: EmailStr  # Pydantic valida se o e-mail tem um formato válido
    senha: str

# Schema para o corpo da requisição de login
class LoginUsuario(BaseModel):
    email: EmailStr
    senha: str

# Schema para a resposta que enviamos de volta após um login bem-sucedido
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"