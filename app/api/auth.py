# Em app/api/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
# Importe o OAuth2PasswordRequestForm para lidar com dados de formulário
from fastapi.security import OAuth2PasswordRequestForm
from app.core.config import supabase
from app.schemas.usuario import CriarUsuario, Token # LoginUsuario não é mais usado aqui
from gotrue.errors import AuthApiError

router = APIRouter()

# ... (a função registrar_usuario continua igual) ...
@router.post("/registrar", status_code=status.HTTP_201_CREATED)
async def registrar_usuario(dados_usuario: CriarUsuario):
    """
    Registra um novo usuário no sistema usando a autenticação do Supabase.
    """
    try:
        resposta = supabase.auth.sign_up({
            "email": dados_usuario.email,
            "password": dados_usuario.senha,
            "options": {
                "data": {
                    "nome_usuario": dados_usuario.nome_usuario
                }
            }
        })
    except AuthApiError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Um erro inesperado ocorreu: {str(e)}"
        )

    return {"mensagem": "Usuário registrado com sucesso! Verifique seu e-mail para confirmação."}


# A MUDANÇA ESTÁ AQUI
@router.post("/login", response_model=Token)
async def login_para_obter_token(
    # Em vez de receber um JSON (LoginUsuario), agora recebemos dados de formulário
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    Autentica o usuário e retorna um token de acesso.
    O FastAPI pegará o 'username' e 'password' do formulário.
    """
    try:
        # Usamos form_data.username (que será o email) e form_data.password
        resposta = supabase.auth.sign_in_with_password({
            "email": form_data.username,
            "password": form_data.password
        })

        if not resposta.session or not resposta.session.access_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha incorretos."
            )

        return {
            "access_token": resposta.session.access_token,
            "token_type": "bearer"
        }
    except AuthApiError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Um erro inesperado ocorreu: {str(e)}"
        )