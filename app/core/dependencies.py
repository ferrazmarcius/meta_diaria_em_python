from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.core.config import supabase
from gotrue.errors import AuthApiError

# Esta linha cria o esquema de segurança.
# O tokenUrl diz ao FastAPI qual endpoint o frontend deve usar para obter o token.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_usuario_atual(token: str = Depends(oauth2_scheme)):
    """
    Dependência que valida o token JWT e retorna os dados do usuário.
    """
    try:
        # Pede ao Supabase para validar o token e obter os dados do usuário
        user_response = supabase.auth.get_user(token)
        return user_response.user
    except AuthApiError:
        # Se o token for inválido ou expirado, o Supabase levanta um erro.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )