# 🚀 Meta Diária - SaaS de Gerenciamento de Metas Financeiras

Um SaaS completo construído com Python e FastAPI no backend e JavaScript puro no frontend. O objetivo desta aplicação é ajudar usuários a focar em suas metas financeiras (como quitar dívidas), permitindo o registro de metas e o acompanhamento do progresso através de ganhos registrados.

---

## 🎯 Sobre o Projeto

A dor que este projeto busca resolver é a dificuldade de manter o foco financeiro e visualizar o progresso ao tentar quitar dívidas ou alcançar um objetivo financeiro. O "Meta Diária" oferece uma solução simples e visual para que o usuário possa:

- Cadastrar múltiplas metas financeiras.
- Registrar cada ganho obtido.
- Acompanhar o progresso de forma clara e intuitiva através de uma tabela e gráficos.

Este projeto foi construído como um exercício de pair programming para desenvolver e aprimorar habilidades em desenvolvimento full-stack.

## ✨ Funcionalidades Principais

- **Autenticação de Usuários:** Sistema completo de registro e login com JWT via Supabase.
- **Gerenciamento de Metas (CRUD):**
  - Criação, edição e exclusão de múltiplas metas por usuário.
  - Segurança a nível de linha (RLS) garantindo que um usuário só pode acessar suas próprias metas.
- **Registro de Ganhos:** Adição de ganhos monetários para cada meta específica.
- **Dashboard Interativo:**
  - Tabela principal com a visão geral de todas as metas e seu progresso.
  - Tela de detalhes para focar em uma única meta e seu histórico de ganhos.
- **Relatórios e Gráficos:**
  - Endpoint de resumo otimizado para a interface.
  - Gráfico de fluxo mensal que compara novas metas (dívidas) vs. ganhos, com navegação interativa.
- **Gerenciamento de Perfil:** O usuário pode alterar seu nome e senha.

## 🛠️ Tecnologias Utilizadas

**Backend:**
- **Python 3.11+**
- **FastAPI:** Para a construção da API RESTful.
- **Uvicorn:** Como servidor ASGI.
- **Supabase:** Utilizado como Backend-as-a-Service para o banco de dados PostgreSQL e autenticação.
- **Pydantic:** Para validação de dados.

**Frontend:**
- **HTML5**
- **CSS3**
- **JavaScript (Vanilla JS):** Sem frameworks, para manipulação do DOM e lógica da interface.
- **Chart.js:** Para a renderização dos gráficos.
- **Toastify.js:** Para notificações e feedback ao usuário.

**Infraestrutura e Ferramentas:**
- **Git & GitHub:** Para versionamento de código.
- **Ambiente Virtual Python (`venv`)**

---

## 🚀 Como Rodar o Projeto Localmente

Siga os passos abaixo para executar a aplicação na sua máquina.

1.  **Clone o Repositório**
    ```bash
    git clone [https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git](https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git)
    cd SEU-REPOSITORIO
    ```

2.  **Crie e Ative o Ambiente Virtual**
    ```bash
    # Criar o venv
    python -m venv venv

    # Ativar no Windows (Git Bash)
    source venv/Scripts/activate

    # Ativar no macOS/Linux
    source venv/bin/activate
    ```

3.  **Crie o Arquivo `requirements.txt`**
    Este é um passo importante que ainda não fizemos! No seu terminal, com o `venv` ativo, rode:
    ```bash
    pip freeze > requirements.txt
    ```
    Isso cria um arquivo que lista todas as dependências Python do projeto.

4.  **Instale as Dependências**
    (Se outra pessoa fosse rodar seu projeto, ela usaria este comando)
    ```bash
    pip install -r requirements.txt
    ```

5.  **Configure as Variáveis de Ambiente**
    - Crie um arquivo chamado `.env` na raiz do projeto.
    - Adicione suas chaves do Supabase, que você pode encontrar no painel do seu projeto em `Project Settings > API`:
      ```
      SUPABASE_URL="SUA_URL_DO_PROJETO_SUPABASE"
      SUPABASE_KEY="SUA_CHAVE_ANON_PUBLIC_DO_SUPABASE"
      ```

6.  **Inicie o Servidor Backend**
    - Certifique-se de que o `venv` está ativo.
    - Rode o comando:
      ```bash
      uvicorn app.main:app --reload
      ```
    - O backend estará rodando em `http://127.0.0.1:8000`.

7.  **Abra o Frontend**
    - Navegue até a pasta do projeto no seu explorador de arquivos.
    - Abra o arquivo `index.html` diretamente no seu navegador preferido (Chrome, Firefox, etc.).

---

## 📝 Próximos Passos (Roadmap Futuro)

- [ ] Fazer o **Deployment** da aplicação para a nuvem.
- [ ] Adicionar **Testes Automatizados** com Pytest para o backend.
- [ ] Refinar a UX com **indicadores de carregamento** e substituição dos `confirm()`.
- [ ] Implementar a funcionalidade de **"Esqueci minha senha"**.
