const API_URL = 'http://127.0.0.1:8000';
let authToken = null;
let metasDoUsuario = [];
let meuGrafico = null;
let dadosCompletosDoGrafico = [];
let indiceMesAtual = 0;

const iconDetalhes = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`;
const iconEditar = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
const iconApagar = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;

const authView = document.getElementById('auth-view');
const loginView = document.getElementById('login-view');
const registerView = document.getElementById('register-view');
const dashboardView = document.getElementById('dashboard-view');
const detailView = document.getElementById('detail-view');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const logoutButton = document.getElementById('logout-button');
const infoUsuario = document.getElementById('info-usuario');
const editNameButton = document.getElementById('edit-name-button');
const metasTableBody = document.getElementById('metas-table-body');
const noMetaView = document.getElementById('no-meta-view');
const createMetaButton = document.getElementById('create-meta-button');
const backToTableBtn = document.getElementById('back-to-table-btn');
const showRegisterLink = document.getElementById('show-register-link');
const showLoginLink = document.getElementById('show-login-link');
const detailGanhoForm = document.getElementById('detail-ganho-form');

const createModal = document.getElementById('create-modal');
const createMetaForm = document.getElementById('create-meta-form');
const cancelCreateButton = document.getElementById('cancel-create-button');

const editModal = document.getElementById('edit-modal');
const editMetaForm = document.getElementById('edit-meta-form');
const cancelEditButton = document.getElementById('cancel-edit-button');

const ganhoModal = document.getElementById('ganho-modal');
const cancelGanhoButton = document.getElementById('cancel-ganho-button');

const prevMonthBtn = document.getElementById('prev-month-btn');
const nextMonthBtn = document.getElementById('next-month-btn');
const currentMonthLabel = document.getElementById('current-month-label');

function showToast(text, type = 'success') {
    const colors = {
        success: "linear-gradient(to right, #00b09b, #96c93d)",
        error: "linear-gradient(to right, #e74c3c, #c0392b)"
    };
    Toastify({
        text: text,
        duration: 3000,
        close: true,
        gravity: "top",
        position: "right",
        stopOnFocus: true,
        style: { background: colors[type] }
    }).showToast();
}

async function apiCall(endpoint, options = {}) {
    options.headers = { 'Content-Type': 'application/json', ...options.headers };
    if (authToken) { options.headers['Authorization'] = `Bearer ${authToken}`; }
    const response = await fetch(`${API_URL}${endpoint}`, options);
    if (response.status === 204) return;
    const data = await response.json();
    if (!response.ok) { throw new Error(data.detail || `Erro na chamada da API.`); }
    return data;
}

function mostrarTelaPrincipal() {
    dashboardView.style.display = 'block';
    detailView.style.display = 'none';
}

async function mostrarTelaDeDetalhes(metaId) {
    dashboardView.style.display = 'none';
    detailView.style.display = 'block';
    detailGanhoForm.dataset.metaId = metaId;

    try {
        const [resumo, ganhos] = await Promise.all([
            apiCall(`/metas/${metaId}/resumo`),
            apiCall(`/metas/${metaId}/ganhos`)
        ]);
        document.getElementById('detail-title').textContent = `Detalhes: ${resumo.nome_meta}`;
        atualizarUIDetalhes(resumo);
        atualizarUIGanhos(ganhos);
    } catch (error) {
        console.error("Erro ao carregar detalhes da meta:", error);
        showToast("Erro ao carregar detalhes.", "error");
    }
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const loginError = document.getElementById('login-error');
    loginError.textContent = '';
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    try {
        const response = await fetch(`${API_URL}/auth/login`, { method: 'POST', body: formData });
        const data = await response.json();
        if (!response.ok || !data.access_token) throw new Error(data.detail || "Email ou senha inválidos.");
        authToken = data.access_token;
        mostrarDashboard();
    } catch (error) {
        loginError.textContent = error.message;
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const registerError = document.getElementById('register-error');
    registerError.textContent = '';
    const dadosNovoUsuario = {
        nome_usuario: document.getElementById('register-name').value,
        email: document.getElementById('register-email').value,
        senha: document.getElementById('register-password').value
    };
    if (dadosNovoUsuario.senha.length < 6) {
        return registerError.textContent = 'A senha deve ter no mínimo 6 caracteres.';
    }
    try {
        await apiCall('/auth/registrar', { method: 'POST', body: JSON.stringify(dadosNovoUsuario) });
        showToast("Usuário registrado com sucesso! Verifique seu e-mail.", 'success');
        registerView.style.display = 'none';
        loginView.style.display = 'block';
        registerForm.reset();
    } catch (error) {
        registerError.textContent = error.message;
    }
});

logoutButton.addEventListener('click', () => {
    authToken = null;
    metasDoUsuario = [];
    authView.style.display = 'block';
    dashboardView.style.display = 'none';
    detailView.style.display = 'none';
    loginForm.reset();
    if(meuGrafico) {
        meuGrafico.destroy();
    }
});

editNameButton.addEventListener('click', async () => {
    const nomeAtual = infoUsuario.textContent.replace('Olá, ', '').replace('!', '');
    const novoNome = prompt("Digite seu novo nome:", nomeAtual);
    if (novoNome && novoNome.trim() !== '' && novoNome !== nomeAtual) {
        try {
            await apiCall('/perfil/meu', { method: 'PATCH', body: JSON.stringify({ nome_usuario: novoNome }) });
            showToast("Nome atualizado com sucesso!", 'success');
            infoUsuario.textContent = `Olá, ${novoNome}!`;
        } catch (error) {
            showToast(error.message, 'error');
        }
    }
});

showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginView.style.display = 'none';
    registerView.style.display = 'block';
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerView.style.display = 'none';
    loginView.style.display = 'block';
});

backToTableBtn.addEventListener('click', mostrarTelaPrincipal);

createMetaButton.addEventListener('click', () => {
    createMetaForm.reset();
    createModal.style.display = 'flex';
});

cancelCreateButton.addEventListener('click', () => {
    createModal.style.display = 'none';
});

createMetaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const dadosNovaMeta = {
        nome_meta: document.getElementById('create-nome-meta').value,
        valor_meta: parseFloat(document.getElementById('create-valor-meta').value),
        data_prazo: document.getElementById('create-data-prazo').value || null
    };
    try {
        await apiCall('/metas/', { method: 'POST', body: JSON.stringify(dadosNovaMeta) });
        createModal.style.display = 'none';
        showToast("Meta criada com sucesso!", 'success');
        await Promise.all([carregarTabelaDeMetas(), carregarDadosDoGrafico()]);
    } catch (error) {
        showToast(error.message, 'error');
    }
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
        await apiCall(`/metas/${metaId}`, { method: 'PATCH', body: JSON.stringify(dadosAtualizados) });
        editModal.style.display = 'none';
        showToast("Meta atualizada com sucesso!", 'success');
        await Promise.all([carregarTabelaDeMetas(), carregarDadosDoGrafico()]);
    } catch (error) {
        showToast(error.message, 'error');
    }
});

detailGanhoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const metaId = e.target.dataset.metaId;
    const valor = parseFloat(document.getElementById('detail-valor-ganho').value);
    const fonte = document.getElementById('detail-fonte-ganho').value;
    try {
        await apiCall(`/metas/${metaId}/ganhos`, { method: 'POST', body: JSON.stringify({ valor_ganho: valor, fonte: fonte || null }) });
        showToast("Ganho adicionado com sucesso!", "success");
        document.getElementById('detail-valor-ganho').value = '';
        document.getElementById('detail-fonte-ganho').value = '';
        await mostrarTelaDeDetalhes(metaId);
    } catch (error) {
        showToast(error.message, 'error');
    }
});

metasTableBody.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;
    const metaId = button.dataset.id;
    if (button.classList.contains('details-btn')) {
        mostrarTelaDeDetalhes(metaId);
    }
    if (button.classList.contains('edit-btn')) {
        abrirModalDeEdicao(metaId);
    }
    if (button.classList.contains('delete-btn')) {
        apagarMeta(metaId);
    }
});

async function mostrarDashboard() {
    authView.style.display = 'none';
    mostrarTelaPrincipal();
    document.getElementById('edit-name-button').innerHTML = iconEditar;
    try {
        const perfil = await apiCall('/perfil/meu');
        infoUsuario.textContent = `Olá, ${perfil.nome_usuario || 'Usuário'}!`;
        await Promise.all([
            carregarTabelaDeMetas(),
            carregarDadosDoGrafico()
        ]);
    } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
    }
}

async function carregarTabelaDeMetas() {
    try {
        const resumos = await apiCall('/metas/resumos/');
        metasDoUsuario = resumos;
        metasTableBody.innerHTML = '';
        if (resumos.length === 0) {
            noMetaView.style.display = 'block';
            metasTableBody.parentElement.style.display = 'none';
        } else {
            noMetaView.style.display = 'none';
            metasTableBody.parentElement.style.display = 'table';
        }
        const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
        resumos.forEach(resumo => {
            const row = metasTableBody.insertRow();
            row.innerHTML = `
                <td>${resumo.nome_meta}</td>
                <td>${formatadorMoeda.format(resumo.valor_meta)}</td>
                <td>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${resumo.progresso.toFixed(2)}%;">${resumo.progresso.toFixed(1)}%</div>
                    </div>
                </td>
                <td class="actions">
                    <button class="details-btn btn-success" data-id="${resumo.meta_id}" title="Detalhes e Ganhos">${iconDetalhes}</button>
                    <button class="edit-btn" data-id="${resumo.meta_id}" title="Editar Meta">${iconEditar}</button>
                    <button class="delete-btn btn-danger" data-id="${resumo.meta_id}" title="Apagar Meta">${iconApagar}</button>
                </td>
            `;
        });
    } catch (error) {
        console.error("Erro ao carregar resumos:", error);
        metasTableBody.innerHTML = '<tr><td colspan="4">Erro ao carregar metas.</td></tr>';
    }
}

function abrirModalDeEdicao(metaId) {
    const meta = metasDoUsuario.find(m => m.meta_id === metaId);
    if (!meta) return;
    document.getElementById('edit-meta-id').value = meta.meta_id;
    document.getElementById('edit-nome-meta').value = meta.nome_meta;
    document.getElementById('edit-valor-meta').value = meta.valor_meta;
    document.getElementById('edit-data-prazo').value = '';
    editModal.style.display = 'flex';
}

async function apagarMeta(metaId) {
    const meta = metasDoUsuario.find(m => m.meta_id === metaId);
    if (confirm(`Tem certeza que deseja apagar a meta "${meta.nome_meta}"?`)) {
        try {
            await apiCall(`/metas/${metaId}`, { method: 'DELETE' });
            showToast("Meta apagada com sucesso!", 'success');
            await Promise.all([carregarTabelaDeMetas(), carregarDadosDoGrafico()]);
        } catch (error) {
            showToast(error.message, 'error');
        }
    }
}

function atualizarUIDetalhes(resumo) {
    const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('detail-valor-meta').textContent = formatadorMoeda.format(resumo.valor_meta);
    document.getElementById('detail-progresso-barra').style.width = `${resumo.progresso}%`;
    document.getElementById('detail-progresso-barra').textContent = `${resumo.progresso.toFixed(1)}%`;
    document.getElementById('detail-total-arrecadado').textContent = formatadorMoeda.format(resumo.total_arrecadado);
    document.getElementById('detail-valor-faltante').textContent = formatadorMoeda.format(resumo.valor_faltante);
}

function atualizarUIGanhos(ganhos) {
    const listaGanhos = document.getElementById('detail-lista-ganhos');
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
        item.textContent = `${formatadorMoeda.format(ganho.valor_ganho)}${fonte} em ${dataGanho}`;
        listaGanhos.appendChild(item);
    });
}

prevMonthBtn.addEventListener('click', () => {
    if (indiceMesAtual > 0) {
        indiceMesAtual--;
        renderizarGrafico();
    }
});

nextMonthBtn.addEventListener('click', () => {
    if (indiceMesAtual < dadosCompletosDoGrafico.length - 1) {
        indiceMesAtual++;
        renderizarGrafico();
    }
});

async function carregarDadosDoGrafico() {
    try {
        dadosCompletosDoGrafico = await apiCall('/relatorios/fluxo-mensal');
        if (dadosCompletosDoGrafico.length > 0) {
            indiceMesAtual = dadosCompletosDoGrafico.length - 1;
        }
        renderizarGrafico();
    } catch (error) {
        console.error("Erro ao carregar dados do gráfico:", error);
    }
}

function renderizarGrafico() {
    const chartContainer = document.querySelector('.chart-container');
    if (dadosCompletosDoGrafico.length === 0) {
        chartContainer.style.display = 'none';
        return;
    }
    chartContainer.style.display = 'block';
    const dadosMesAtual = dadosCompletosDoGrafico[indiceMesAtual];
    const [ano, mes] = dadosMesAtual.mes.split('-');
    currentMonthLabel.textContent = `${mes}/${ano}`;
    const ctx = document.getElementById('fluxoMensalChart').getContext('2d');
    if (meuGrafico) {
        meuGrafico.destroy();
    }
    const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    meuGrafico = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Novas Metas (Dívidas)', 'Ganhos Registrados'],
            datasets: [{
                label: 'Valor (R$)',
                data: [dadosMesAtual.total_dividas, dadosMesAtual.total_ganhos],
                backgroundColor: ['rgba(231, 76, 60, 0.7)', 'rgba(46, 204, 113, 0.7)'],
                borderColor: ['rgba(231, 76, 60, 1)', 'rgba(46, 204, 113, 1)'],
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatadorMoeda.format(context.raw);
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatadorMoeda.format(value);
                        }
                    }
                }
            }
        }
    });
    prevMonthBtn.disabled = indiceMesAtual === 0;
    nextMonthBtn.disabled = indiceMesAtual === dadosCompletosDoGrafico.length - 1;
}