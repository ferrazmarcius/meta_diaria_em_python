from pydantic import BaseModel
from datetime import date

class RelatorioGanhos(BaseModel):
    data_inicio_relatorio: date
    data_fim_relatorio: date
    total_ganhos_periodo: float
    quantidade_registros: int
    media_por_ganho: float