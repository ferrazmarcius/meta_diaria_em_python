from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from app.schemas.ganho import CriarGanho, Ganho
from app.core.config import supabase
from app.core.dependencies import get_usuario_atual
from postgrest import APIError

# A CORREÇÃO ESTÁ AQUI: Trocamos a tag para "Metas"
router = APIRouter(
    prefix="/metas/{meta_id}/ganhos",
    tags=["Metas"] # Ao usar a mesma tag, os endpoints serão agrupados sob a seção "Metas"
)

# O restante do arquivo continua exatamente igual...

@router.post("/", response_model=Ganho, status_code=status.HTTP_201_CREATED)
async def registrar_novo_ganho(
    meta_id: UUID,
    dados_ganho: CriarGanho,
    usuario_atual = Depends(get_usuario_atual)
):
    # (código da função sem alterações)
    meta_resp = supabase.table('metas').select("id").eq('id', str(meta_id)).eq('usuario_id', str(usuario_atual.id)).single().execute()
    if not meta_resp.data:
        raise HTTPException(status_code=404, detail="Meta não encontrada ou não pertence ao usuário.")
    ganho_para_db = dados_ganho.model_dump()
    ganho_para_db['meta_id'] = str(meta_id)
    try:
        ganho_resp = supabase.table('ganhos').insert(ganho_para_db).execute()
        if not ganho_resp.data:
            raise HTTPException(status_code=500, detail="Não foi possível registrar o ganho.")
        return ganho_resp.data[0]
    except APIError as e:
        raise HTTPException(status_code=400, detail=f"Erro no banco de dados: {e.message}")


@router.get("/", response_model=List[Ganho])
async def listar_ganhos_da_meta(
    meta_id: UUID,
    usuario_atual = Depends(get_usuario_atual)
):
    # (código da função sem alterações)
    meta_resp = supabase.table('metas').select("id").eq('id', str(meta_id)).eq('usuario_id', str(usuario_atual.id)).single().execute()
    if not meta_resp.data:
        raise HTTPException(status_code=404, detail="Meta não encontrada ou não pertence ao usuário.")
    ganhos_resp = supabase.table('ganhos').select("*").eq('meta_id', str(meta_id)).order('criado_em', desc=True).execute()
    return ganhos_resp.data

@router.delete("/{ganho_id}", status_code=status.HTTP_204_NO_CONTENT)
async def apagar_ganho(
    meta_id: UUID, # Continua vindo da URL para contexto
    ganho_id: UUID, # O ID do ganho a ser apagado
    usuario_atual = Depends(get_usuario_atual)
):
    """
    Apaga um ganho específico de uma meta.
    """
    try:
        # A política RLS de ganhos verifica se o usuário é dono da meta pai,
        # o que indiretamente o autoriza a apagar o ganho.
        resposta = supabase.table('ganhos').delete().eq('id', str(ganho_id)).eq('meta_id', str(meta_id)).execute()

        if not resposta.data:
            raise HTTPException(status_code=404, detail="Ganho não encontrado ou não pertence a esta meta.")
        
        return
    except APIError as e:
        raise HTTPException(status_code=400, detail=f"Erro no banco de dados: {e.message}")