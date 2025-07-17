# Em app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, metas, ganhos, perfil, relatorios

app = FastAPI(
    title="Meta Diária API",
    description="API para o SaaS Meta Diária, focado em ajudar usuários a quitarem suas dívidas.",
    version="0.1.0"
) # <--- O parêntese de fechamento deve estar aqui.

# Defina as origens permitidas
origins = [
    "*",
]

# Adicione o middleware de CORS ao seu aplicativo
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas de Autenticação
app.include_router(auth.router, prefix="/auth", tags=["Autenticação"])

# Rotas de Metas e Ganhos
app.include_router(metas.router, prefix="/metas", tags=["Metas"])
app.include_router(ganhos.router, tags=["Metas"])

# Rotas de Perfil
app.include_router(perfil.router, prefix="/perfil", tags=["Perfil"])

# Rotas de Relatórios
app.include_router(relatorios.router, prefix="/relatorios", tags=["Relatórios"])


@app.get("/")
async def raiz():
    """
    Endpoint raiz que exibe uma mensagem de boas-vindas.
    """
    return {"mensagem": "Bem-vindo à API do Meta Diária!"}