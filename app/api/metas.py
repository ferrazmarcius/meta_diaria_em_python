from fastapi import APIRouter, Depends, HTTPException, status
from typing import List 
from uuid import UUID # Importe o tipo UUID para validação do ID na rota
from app.schemas.meta import CriarMeta, Meta, AtualizarMeta
from app.core.config import supabase
from app.core.dependencies import get_usuario_atual
from postgrest import APIError
from app.schemas.resumo import ResumoMeta

router = APIRouter()

# Este endpoint não muda, ele continua criando uma meta por vez.
@router.post("/", response_model=Meta, status_code=status.HTTP_201_CREATED)
async def criar_meta_usuario(
    dados_meta: CriarMeta,
    usuario_atual = Depends(get_usuario_atual)
):
    """
    Cria uma nova meta para o usuário atualmente logado.
    """
    meta_para_db = dados_meta.model_dump()
    meta_para_db['usuario_id'] = str(usuario_atual.id)

    if meta_para_db.get("data_prazo"):
        meta_para_db["data_prazo"] = meta_para_db["data_prazo"].isoformat()

    try:
        resposta = supabase.table('metas').insert(meta_para_db).execute()
        if not resposta.data:
            raise HTTPException(status_code=500, detail="Não foi possível criar a meta.")
        return resposta.data[0]
    except APIError as e:
        raise HTTPException(status_code=400, detail=f"Erro no banco de dados: {e.message}")

# --- MUDANÇA 1: Listar todas as metas ---
@router.get("/", response_model=List[Meta])
async def listar_metas_do_usuario(usuario_atual = Depends(get_usuario_atual)):
    """
    Recupera TODAS as metas do usuário atualmente logado.
    """
    try:
        # Busca todas as metas onde o 'usuario_id' é igual ao do usuário logado
        resposta = supabase.table('metas').select("*").eq('usuario_id', str(usuario_atual.id)).execute()
        return resposta.data
    except APIError as e:
        raise HTTPException(status_code=400, detail=f"Erro no banco de dados: {e.message}")

# --- MUDANÇA 2: Novo endpoint para buscar uma meta específica ---
@router.get("/{meta_id}", response_model=Meta)
async def ler_meta_especifica(
    meta_id: UUID, # Recebe o ID da meta pela URL
    usuario_atual = Depends(get_usuario_atual)
):
    """
    Recupera uma meta específica pelo seu ID.
    A política de RLS garante que o usuário só pode buscar suas próprias metas.
    """
    try:
        resposta = supabase.table('metas').select("*").eq('id', str(meta_id)).single().execute()

        if not resposta.data:
            raise HTTPException(status_code=404, detail="Meta não encontrada.")
        
        # A política RLS já filtrou, então se algo foi encontrado, pertence ao usuário.
        return resposta.data
    except APIError as e:
        raise HTTPException(status_code=400, detail=f"Erro no banco de dados: {e.message}")
    
@router.patch("/{meta_id}", response_model=Meta)
async def atualizar_meta_parcialmente(
    meta_id: UUID,
    dados_atualizacao: AtualizarMeta,
    usuario_atual = Depends(get_usuario_atual)
):
    """
    Atualiza parcialmente uma meta específica do usuário.
    Apenas os campos fornecidos no corpo da requisição serão atualizados.
    """
    # Converte os dados para um dicionário, excluindo os campos que não foram enviados (valor None)
    update_data = dados_atualizacao.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum dado fornecido para atualização.")

    # Converte a data para string, se ela estiver presente
    if "data_prazo" in update_data and update_data["data_prazo"]:
        update_data["data_prazo"] = update_data["data_prazo"].isoformat()

    try:
        # A política de RLS já garante que o usuário só pode atualizar suas próprias metas.
        # O .eq('id', ...) e .eq('usuario_id', ...) funcionam como um "filtro" extra de segurança.
        resposta = supabase.table('metas').update(update_data).eq('id', str(meta_id)).eq('usuario_id', str(usuario_atual.id)).execute()

        if not resposta.data:
            raise HTTPException(status_code=404, detail="Meta não encontrada ou não foi possível atualizar.")
        
        return resposta.data[0]
    except APIError as e:
        raise HTTPException(status_code=400, detail=f"Erro no banco de dados: {e.message}")

# --- NOVO ENDPOINT: Apagar uma meta ---
@router.delete("/{meta_id}", status_code=status.HTTP_204_NO_CONTENT)
async def apagar_meta(
    meta_id: UUID,
    usuario_atual = Depends(get_usuario_atual)
):
    """
    Apaga uma meta específica do usuário e todos os ganhos associados a ela.
    """
    try:
        # A política RLS garante que o usuário só pode apagar suas próprias metas.
        # O ON DELETE CASCADE que definimos no banco de dados apagará os ganhos automaticamente.
        resposta = supabase.table('metas').delete().eq('id', str(meta_id)).eq('usuario_id', str(usuario_atual.id)).execute()

        # Verifica se algo foi de fato apagado
        if not resposta.data:
            raise HTTPException(status_code=404, detail="Meta não encontrada.")
        
        # DELETE bem-sucedido não retorna corpo, apenas o status 204.
        return
    except APIError as e:
        raise HTTPException(status_code=400, detail=f"Erro no banco de dados: {e.message}")
    
# --- NOVO ENDPOINT: Resumo calculado de uma meta (VERSÃO CORRIGIDA) ---
@router.get("/{meta_id}/resumo", response_model=ResumoMeta)
async def obter_resumo_da_meta(
    meta_id: UUID,
    usuario_atual = Depends(get_usuario_atual)
):
    """
    Obtém um resumo calculado de uma meta específica, incluindo o total arrecadado
    e o progresso.
    """
    # 1. Buscar a meta específica diretamente do banco de dados
    try:
        meta_resp = supabase.table('metas').select("*").eq('id', str(meta_id)).eq('usuario_id', str(usuario_atual.id)).single().execute()
        
        if not meta_resp.data:
            raise HTTPException(status_code=404, detail="Meta não encontrada ou não pertence ao usuário.")
        
        # Agora, meta_dict é um dicionário com os dados da meta
        meta_dict = meta_resp.data

    except APIError as e:
        raise HTTPException(status_code=400, detail=f"Erro ao buscar meta: {e.message}")

    # 2. Buscar todos os ganhos associados a essa meta
    try:
        ganhos_resp = supabase.table('ganhos').select("valor_ganho").eq('meta_id', str(meta_id)).execute()
    except APIError as e:
        raise HTTPException(status_code=400, detail=f"Erro ao buscar ganhos: {e.message}")

    # 3. Calcular o total arrecadado
    total_arrecadado = sum(item['valor_ganho'] for item in ganhos_resp.data)

    # 4. Calcular os valores restantes, usando a sintaxe de dicionário
    valor_meta = meta_dict['valor_meta']
    valor_faltante = max(0, valor_meta - total_arrecadado)

    if valor_meta > 0:
        progresso = min(100.0, (total_arrecadado / valor_meta) * 100)
    else:
        progresso = 100.0 if total_arrecadado > 0 else 0.0

    # 5. Montar e retornar o objeto de resumo, usando a sintaxe de dicionário
    resumo = ResumoMeta(
        meta_id=meta_dict['id'],
        nome_meta=meta_dict['nome_meta'],
        valor_meta=valor_meta,
        total_arrecadado=total_arrecadado,
        valor_faltante=valor_faltante,
        progresso=round(progresso, 2)
    )
    
    return resumo