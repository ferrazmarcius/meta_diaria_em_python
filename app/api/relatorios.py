from fastapi import APIRouter, Depends, Query, HTTPException, status 
from typing import List
from collections import defaultdict
from datetime import date, timedelta, datetime
from app.core.dependencies import get_usuario_atual
from app.core.config import supabase
from app.schemas.relatorio import RelatorioGanhos, FluxoMensal

router = APIRouter()

@router.get("/ganhos", response_model=RelatorioGanhos)
async def gerar_relatorio_de_ganhos(
    # 1. Alteramos para receber strings (str) e damos um nome diferente para clareza
    data_inicio_str: str | None = Query(None, alias="data_inicio", description="Data de início no formato DD/MM/YYYY"),
    data_fim_str: str | None = Query(None, alias="data_fim", description="Data de fim no formato DD/MM/YYYY"),
    usuario_atual = Depends(get_usuario_atual)
):
    """
    Gera um relatório de ganhos para o usuário logado dentro de um período específico.
    Aceita datas no formato DD/MM/YYYY.
    """
    # 2. Fazemos a conversão e validação manualmente aqui dentro
    try:
        # Se a data não for fornecida, usamos o padrão dos últimos 30 dias
        data_inicio = datetime.strptime(data_inicio_str, "%d/%m/%Y").date() if data_inicio_str else date.today() - timedelta(days=30)
        data_fim = datetime.strptime(data_fim_str, "%d/%m/%Y").date() if data_fim_str else date.today()
    except (ValueError, TypeError):
        # Se a conversão falhar, retornamos um erro claro
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Formato de data inválido. Por favor, use DD/MM/YYYY."
        )

    user_id = str(usuario_atual.id)
    
    # ... O restante da função continua exatamente igual ...
    metas_usuario_resp = supabase.table('metas').select("id").eq('usuario_id', user_id).execute()
    if not metas_usuario_resp.data:
        return RelatorioGanhos(
            data_inicio_relatorio=data_inicio,
            data_fim_relatorio=data_fim,
            total_ganhos_periodo=0,
            quantidade_registros=0,
            media_por_ganho=0
        )
    
    lista_de_ids_metas = [meta['id'] for meta in metas_usuario_resp.data]

    ganhos_resp = supabase.table('ganhos') \
        .select("valor_ganho") \
        .in_('meta_id', lista_de_ids_metas) \
        .gte('criado_em', data_inicio.isoformat()) \
        .lte('criado_em', (data_fim + timedelta(days=1)).isoformat()) \
        .execute()

    lista_de_ganhos = ganhos_resp.data
    total_ganhos = sum(item['valor_ganho'] for item in lista_de_ganhos)
    quantidade = len(lista_de_ganhos)
    media = total_ganhos / quantidade if quantidade > 0 else 0

    return RelatorioGanhos(
        data_inicio_relatorio=data_inicio,
        data_fim_relatorio=data_fim,
        total_ganhos_periodo=total_ganhos,
        quantidade_registros=quantidade,
        media_por_ganho=round(media, 2)
    )

@router.get("/fluxo-mensal", response_model=List[FluxoMensal])
async def gerar_relatorio_fluxo_mensal(usuario_atual = Depends(get_usuario_atual)):
    """
    Gera um relatório do fluxo mensal de novas dívidas (baseado no prazo da meta)
    versus ganhos registrados (baseado na data do ganho).
    """
    user_id = str(usuario_atual.id)

    # 1. Buscar todas as metas, garantindo que pegamos a data_prazo
    metas_resp = supabase.table('metas').select("id, valor_meta, criado_em, data_prazo").eq('usuario_id', user_id).execute()
    
    if not metas_resp.data:
        return []

    lista_metas = metas_resp.data
    ids_das_metas = [meta['id'] for meta in lista_metas]
    
    lista_ganhos = []
    if ids_das_metas:
        ganhos_resp = supabase.table('ganhos').select("valor_ganho, criado_em").in_('meta_id', ids_das_metas).execute()
        lista_ganhos = ganhos_resp.data

    fluxo_por_mes = defaultdict(lambda: {"dividas": 0.0, "ganhos": 0.0})

    # --- LÓGICA CORRIGIDA AQUI ---
    for meta in lista_metas:
        # Prioriza a data_prazo. Se não existir, usa a criado_em.
        data_de_referencia = meta.get('data_prazo') or meta['criado_em']
        mes = data_de_referencia[:7] # Pega 'AAAA-MM'
        fluxo_por_mes[mes]['dividas'] += meta['valor_meta']

    for ganho in lista_ganhos:
        # Ganhos continuam sendo agrupados por quando foram criados
        mes = ganho['criado_em'][:7]
        fluxo_por_mes[mes]['ganhos'] += ganho['valor_ganho']

    relatorio_final = []
    for mes in sorted(fluxo_por_mes.keys()):
        dados_mes = fluxo_por_mes[mes]
        relatorio_final.append(
            FluxoMensal(
                mes=mes,
                total_dividas=dados_mes['dividas'],
                total_ganhos=dados_mes['ganhos']
            )
        )

    return relatorio_final