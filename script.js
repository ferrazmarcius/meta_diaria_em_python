const API_URL = 'http://127.0.0.1:8000';
let authToken = null;
let metasDoUsuario = [];

// --- Elementos da Página ---
const authView = document.getElementById('auth-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const ganhoForm = document.getElementById('ganho-form');
const loginError = document.getElementById('login-error');
const ganhoError = document.getElementById('ganho-error');
const metaSelector = document.getElementById('meta-selector');
const logoutButton = document.getElementById('logout-button');
const listaGanhos = document.getElementById('lista-ganhos');
const deleteMetaButton = document.getElementById('delete-meta-button');
const editMetaButton = document.getElementById('edit-meta-button');
const editModal = document.getElementById('edit-modal');
const editMetaForm = document.getElementById('edit-meta-form');
const cancelEditButton = document.getElementById('cancel-edit-button');

// --- Funções de API ---
async function apiCall(endpoint, options = {}) {
    options.headers = { 'Content-Type': 'application/json', ...options.headers };
    if (authToken) { options.headers['Authorization'] = `Bearer ${authToken}`; }
    const response = await fetch(`${API_URL}${endpoint}`, options);
    if (response.status === 204) return;
    const data = await response.json();
    if (!response.ok) { throw new Error(data.detail || `Erro na chamada da API para ${endpoint}`); }
    return data;
}

// --- Lógica de Autenticação e Ações Principais ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    try {
        const response = await fetch(`${API_URL}/auth/login`, { method: 'POST', body: formData });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail);
        authToken = data.access_token;
        mostrarDashboard();
    } catch (error) {
        loginError.textContent = error.message;
    }
});

logoutButton.addEventListener('click', () => {
    authToken = null;
    metasDoUsuario = [];
    authView.style.display = 'block';
    dashboardView.style.display = 'none';
    loginForm.reset();
});

deleteMetaButton.addEventListener('click', async () => {
    const metaIdSelecionada = metaSelector.value;
    if (!metaIdSelecionada) { return alert("Nenhuma meta selecionada para apagar."); }
    const metaSelecionada = metasDoUsuario.find(m => m.id === metaIdSelecionada);
    if (confirm(`Tem certeza que deseja apagar a meta "${metaSelecionada.nome_meta}"?`)) {
        try {
            await apiCall(`/metas/${metaIdSelecionada}`, { method: 'DELETE' });
            await carregarMetasDoUsuario();
            if (metasDoUsuario.length > 0) {
                await carregarDadosCompletosDaMeta(metaSelector.value);
            } else {
                document.getElementById('dashboard-content').innerHTML = "<h2>Nenhuma meta criada.</h2>";
            }
        } catch (error) {
            alert(`Erro ao apagar meta: ${error.message}`);
        }
    }
});

editMetaButton.addEventListener('click', () => {
    const metaIdSelecionada = metaSelector.value;
    const meta = metasDoUsuario.find(m => m.id === metaIdSelecionada);
    if (!meta) { return alert("Por favor, selecione uma meta para editar."); }
    
    document.getElementById('edit-meta-id').value = meta.id;
    document.getElementById('edit-nome-meta').value = meta.nome_meta;
    document.getElementById('edit-valor-meta').value = meta.valor_meta;
    document.getElementById('edit-data-prazo').value = meta.data_prazo || '';
    editModal.style.display = 'flex';
});

cancelEditButton.addEventListener('click', () => {
    editModal.style.display = 'none';
});

editMetaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const metaId = document.getElementById('edit-meta-id').value;
    const dadosAtualizados = {
        nome_meta: document.getElementById('edit-nome-meta').value,
        valor_meta: parseFloat(document.getElementById('edit-valor-meta').value),
        data_prazo: document.getElementById('edit-data-prazo').value || null
    };
    try {
        await apiCall(`/metas/${metaId}`, {
            method: 'PATCH',
            body: JSON.stringify(dadosAtualizados)
        });
        editModal.style.display = 'none';
        await carregarMetasDoUsuario(); 
        metaSelector.value = metaId;
        await carregarDadosCompletosDaMeta(metaId);
    } catch (error) {
        alert(`Erro ao atualizar a meta: ${error.message}`);
    }
});

metaSelector.addEventListener('change', (e) => {
    carregarDadosCompletosDaMeta(e.target.value);
});

ganhoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    ganhoError.textContent = '';
    const metaIdSelecionada = metaSelector.value;
    if (!metaIdSelecionada) { return ganhoError.textContent = "Selecione uma meta."; }
    const valor = parseFloat(document.getElementById('valor-ganho').value);
    const fonte = document.getElementById('fonte-ganho').value;
    try {
        await apiCall(`/metas/${metaIdSelecionada}/ganhos`, {
            method: 'POST',
            body: JSON.stringify({ valor_ganho: valor, fonte: fonte || null })
        });
        ganhoForm.reset();
        carregarDadosCompletosDaMeta(metaIdSelecionada);
    } catch (error) {
        ganhoError.textContent = error.message;
    }
});

// --- Funções de Carregamento e Atualização da UI ---
async function mostrarDashboard() {
    authView.style.display = 'none';
    dashboardView.style.display = 'block';
    await carregarPerfilDoUsuario();
    await carregarMetasDoUsuario();
    if (metasDoUsuario.length > 0) {
        await carregarDadosCompletosDaMeta(metaSelector.value);
    }
}

async function carregarPerfilDoUsuario() {
    try {
        const perfil = await apiCall('/perfil/meu');
        document.getElementById('info-usuario').textContent = `Olá, ${perfil.nome_usuario || 'Usuário'}!`;
    } catch(error) {
        console.error("Erro ao carregar perfil:", error);
        document.getElementById('info-usuario').textContent = 'Olá, Usuário!';
    }
}

async function carregarMetasDoUsuario() {
    try {
        metasDoUsuario = await apiCall('/metas');
        popularSeletorDeMetas();
        if (metasDoUsuario.length === 0) {
            document.getElementById('dashboard-content').innerHTML = "<h2>Nenhuma meta encontrada.</h2><p>Crie sua primeira meta.</p>";
        }
    } catch (error) {
        console.error("Erro ao carregar metas:", error);
    }
}

function popularSeletorDeMetas() {
    metaSelector.innerHTML = '';
    metasDoUsuario.forEach(meta => {
        const option = document.createElement('option');
        option.value = meta.id;
        option.textContent = meta.nome_meta;
        metaSelector.appendChild(option);
    });
}

async function carregarDadosCompletosDaMeta(metaId) {
    if (!metaId) return;
    try {
        const [resumo, ganhos] = await Promise.all([
            apiCall(`/metas/${metaId}/resumo`),
            apiCall(`/metas/${metaId}/ganhos`)
        ]);
        atualizarUIComResumo(resumo);
        atualizarUIComGanhos(ganhos);
    } catch(error) {
        console.error("Erro ao carregar dados da meta:", error);
    }
}

function atualizarUIComResumo(resumo) {
    const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('nome-meta').textContent = resumo.nome_meta;
    document.getElementById('valor-meta').textContent = formatadorMoeda.format(resumo.valor_meta);
    document.getElementById('total-arrecadado').textContent = formatadorMoeda.format(resumo.total_arrecadado);
    document.getElementById('valor-faltante').textContent = formatadorMoeda.format(resumo.valor_faltante);
    const progressoBarra = document.getElementById('progresso-barra');
    progressoBarra.style.width = `${resumo.progresso}%`;
    progressoBarra.textContent = `${resumo.progresso.toFixed(1)}%`;
}

function atualizarUIComGanhos(ganhos) {
    listaGanhos.innerHTML = '';
    if (ganhos.length === 0) {
        listaGanhos.innerHTML = '<li>Nenhum ganho registrado para esta meta.</li>';
        return;
    }
    const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    ganhos.forEach(ganho => {
        const item = document.createElement('li');
        const dataGanho = new Date(ganho.criado_em).toLocaleDateString('pt-BR');
        const fonte = ganho.fonte ? ` - ${ganho.fonte}` : '';
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-ganho-btn';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.onclick = () => apagarGanho(ganho.id);
        const textoGanho = document.createElement('span');
        textoGanho.innerHTML = `<span>${formatadorMoeda.format(ganho.valor_ganho)}${fonte}</span> <span>${dataGanho}</span>`;
        item.appendChild(textoGanho);
        item.appendChild(deleteBtn);
        listaGanhos.appendChild(item);
    });
}

async function apagarGanho(ganhoId) {
    const metaIdSelecionada = metaSelector.value;
    if (confirm("Tem certeza que deseja apagar este ganho?")) {
        try {
            await apiCall(`/metas/${metaIdSelecionada}/ganhos/${ganhoId}`, { method: 'DELETE' });
            await carregarDadosCompletosDaMeta(metaIdSelecionada);
        } catch (error) {
            alert(`Erro ao apagar ganho: ${error.message}`);
        }
    }
}