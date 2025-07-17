from fastapi import APIRouter, Depends, HTTPException, status
from app.core.dependencies import get_usuario_atual
from app.core.config import supabase
from app.schemas.perfil import AtualizarPerfil
from gotrue.errors import AuthApiError
from gotrue.types import UserAttributes

router = APIRouter()

@router.patch("/meu", status_code=status.HTTP_200_OK)
async def atualizar_perfil_usuario(
    dados_perfil: AtualizarPerfil,
    usuario_atual = Depends(get_usuario_atual)
):
    """
    Atualiza os dados do perfil do usuário logado (nome e/ou senha).
    """
    # Inicia o dicionário de atributos do usuário
    user_update: UserAttributes = {}
    
    # Extrai os dados do schema
    dados_para_atualizar = dados_perfil.model_dump(exclude_unset=True)

    if not dados_para_atualizar:
        raise HTTPException(status_code=400, detail="Nenhum dado fornecido para atualização.")

    # Verifica se a senha está sendo atualizada e a adiciona ao dicionário principal
    if "senha" in dados_para_atualizar:
        user_update["password"] = dados_para_atualizar.pop("senha")

    # Verifica se há outros dados (como nome_usuario) para colocar no campo 'data'
    if dados_para_atualizar:
        user_update["data"] = dados_para_atualizar

    try:
        # A função de update lida com os campos 'password' e 'data'
        supabase.auth.update_user(attributes=user_update)
        
        # Retorna uma mensagem de sucesso, pois a senha não deve ser retornada
        return {"mensagem": "Perfil atualizado com sucesso."}

    except AuthApiError as e:
        raise HTTPException(status_code=400, detail=e.message)
    
@router.get("/meu", response_model=dict)
async def obter_perfil_usuario(usuario_atual = Depends(get_usuario_atual)):
    """
    Retorna os dados do perfil (user_metadata) do usuário logado.
    """
    return usuario_atual.user_metadata