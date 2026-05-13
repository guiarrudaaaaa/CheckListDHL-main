// ===== CONFIGURAÇÃO DO RELÓGIO AO VIVO =====
setInterval(() => updateClock('liveTime'), 1000);
updateClock('liveTime');

async function loadChecklists() {
    if (!window.firebaseDb || !window.firebaseCollection || !window.firebaseGetDocs || !window.firebaseQuery || !window.firebaseOrderBy || !window.firebaseLimit) {
        console.error('Firebase não está inicializado no painel admin.');
        return;
    }

    try {
        // 🔥 OTIMIZAÇÃO: Limita a 100 documentos mais recentes para reduzir custos
        const checklistsRef = window.firebaseCollection(window.firebaseDb, 'checklists');
        const q = window.firebaseQuery(
            checklistsRef,
            window.firebaseOrderBy('createdAt', 'desc'),
            window.firebaseLimit(100)
        );
        const snapshot = await window.firebaseGetDocs(q);

        allChecklists = snapshot.docs.map(docSnapshot => {
            const data = docSnapshot.data();
            const checkinTime = data.checkinTime || (data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toLocaleString('pt-BR') : '');
            return {
                id: docSnapshot.id,
                ...data,
                checkinTime
            };
        });

        allChecklists = validateChecklistData(allChecklists);

        // Atualiza métricas e tabela mesmo que não existam registros
        updateMetrics();
        renderTable();
    } catch (err) {
        console.error('Erro ao carregar relatório Firebase:', err);
    }
}

function subscribeChecklists() {
    if (checklistsUnsubscribe) {
        checklistsUnsubscribe();
        checklistsUnsubscribe = null;
    }

    if (!window.firebaseDb || !window.firebaseCollection || !window.firebaseQuery || !window.firebaseOrderBy || !window.firebaseLimit || !window.firebaseOnSnapshot) {
        loadChecklists();
        return;
    }

    const checklistsRef = window.firebaseCollection(window.firebaseDb, 'checklists');
    const q = window.firebaseQuery(
        checklistsRef,
        window.firebaseOrderBy('createdAt', 'desc'),
        window.firebaseLimit(100)
    );

    checklistsUnsubscribe = window.firebaseOnSnapshot(q, (snapshot) => {
        allChecklists = snapshot.docs.map(docSnapshot => {
            const data = docSnapshot.data();
            const checkinTime = data.checkinTime || (data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toLocaleString('pt-BR') : '');
            return {
                id: docSnapshot.id,
                ...data,
                checkinTime
            };
        });

        allChecklists = validateChecklistData(allChecklists);
        updateMetrics();
        renderTable();
    }, (err) => {
        console.error('Erro no listener de checklists:', err);
        loadChecklists();
    });
}

// ===== SEGURANÇA E SANITIZAÇÃO =====
// As funções sanitizeText e safeSetInnerHTML são importadas de shared.js

// Função para validar dados carregados do Firestore
function validateChecklistData(data) {
    if (!Array.isArray(data)) return [];
    return data.filter(item => {
        // Valida estrutura básica
        if (typeof item !== 'object' || !item) return false;
        // Sanitiza campos de texto
        if (item.dtNumber) item.dtNumber = sanitizeText(item.dtNumber);
        if (item.nfNumber) item.nfNumber = sanitizeText(item.nfNumber);
        if (item.driverName) item.driverName = sanitizeText(item.driverName);
        if (item.placaCavalo) item.placaCavalo = sanitizeText(item.placaCavalo);
        if (item.placaCarreta1) item.placaCarreta1 = sanitizeText(item.placaCarreta1);
        if (item.transportadora) item.transportadora = sanitizeText(item.transportadora);
        if (item.origem) item.origem = sanitizeText(item.origem);
        if (item.lacre1) item.lacre1 = sanitizeText(item.lacre1);
        if (item.lacre2) item.lacre2 = sanitizeText(item.lacre2);
        if (item.statusLacre) item.statusLacre = sanitizeText(item.statusLacre);
        if (item.observations) item.observations = sanitizeText(item.observations);
        return true;
    });
}

// ===== GERENCIAMENTO DE DADOS =====
// Variáveis globais para gerenciar filtros e armazenar checklists
let currentFilter = 'todos'; // Filtro atual aplicado ('todos', 'inbound', 'outbound')
let allChecklists = []; // Array que armazena todos os checklists carregados
let checklistsUnsubscribe = null; // Função para cancelar a escuta em tempo real

// ===== ATUALIZAÇÃO DE MÉTRICAS =====
// Calcula e atualiza os valores exibidos nos cards de métricas
function updateMetrics() {
    // Conta operações inbound (IN)
    const inCount = allChecklists.filter(c => String(c.operationType || '').toUpperCase() === 'IN').length;
    // Conta operações outbound (OUT)
    const outCount = allChecklists.filter(c => String(c.operationType || '').toUpperCase() === 'OUT').length;
    // Total de pallets inbound
    const totalPbrInbound = allChecklists.filter(c => String(c.operationType || '').toUpperCase() === 'IN').reduce((sum, item) => sum + (parseInt(item.totalPbr || item.totalPBR || 0, 10) || 0), 0);
    // Total de pallets outbound
    const totalPbrOutbound = allChecklists.filter(c => String(c.operationType || '').toUpperCase() === 'OUT').reduce((sum, item) => sum + (parseInt(item.totalPbr || item.totalPBR || 0, 10) || 0), 0);
    // Total de pallets usados em todos os checklists
    const totalPbr = totalPbrInbound + totalPbrOutbound;
    // Total de registros
    const totalRegistros = allChecklists.length;

    // Atualiza os elementos HTML dos cards
    const totalRegistrosEl = document.getElementById('totalRegistros');
    const inboundCountEl = document.getElementById('inboundCount');
    const outboundCountEl = document.getElementById('outboundCount');
    const totalPbrInboundEl = document.getElementById('totalPbrInbound');
    const totalPbrOutboundEl = document.getElementById('totalPbrOutbound');
    const totalPbrCountEl = document.getElementById('totalPbrCount');

    if (totalRegistrosEl) totalRegistrosEl.textContent = totalRegistros;
    if (inboundCountEl) inboundCountEl.textContent = inCount;
    if (outboundCountEl) outboundCountEl.textContent = outCount;
    if (totalPbrInboundEl) totalPbrInboundEl.textContent = totalPbrInbound;
    if (totalPbrOutboundEl) totalPbrOutboundEl.textContent = totalPbrOutbound;
    if (totalPbrCountEl) totalPbrCountEl.textContent = totalPbr;

    // Atualiza os contadores nas abas de filtro
    const todosNumberEl = document.getElementById('todosNumber');
    const inboundNumberEl = document.getElementById('inboundNumber');
    const outboundNumberEl = document.getElementById('outboundNumber');
    if (todosNumberEl) todosNumberEl.textContent = `(${totalRegistros})`;
    if (inboundNumberEl) inboundNumberEl.textContent = `(${inCount})`;
    if (outboundNumberEl) outboundNumberEl.textContent = `(${outCount})`;
}

function showAuthError(message) {
    const alert = document.getElementById('authAlert');
    if (!alert) return;
    if (!message) {
        alert.classList.add('hidden');
        alert.textContent = '';
        return;
    }
    alert.textContent = message;
    alert.classList.remove('hidden');
}

function showAuthenticatedAdmin() {
    document.getElementById('authScreen')?.classList.add('hidden');
    document.getElementById('adminMain')?.classList.remove('hidden');
    document.getElementById('signOutBtn')?.classList.remove('hidden');
    showAuthError('');
    subscribeChecklists();
}

function showUnauthenticatedAdmin() {
    if (checklistsUnsubscribe) {
        checklistsUnsubscribe();
        checklistsUnsubscribe = null;
    }
    document.getElementById('authScreen')?.classList.remove('hidden');
    document.getElementById('adminMain')?.classList.add('hidden');
    document.getElementById('signOutBtn')?.classList.add('hidden');
    showAuthError('');
}

async function handleLogin() {
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;

    if (!email || !password) {
        showAuthError('Preencha email e senha para entrar.');
        return;
    }

    if (!window.firebaseAuth || !window.firebaseSignInWithEmailAndPassword) {
        showAuthError('Autenticação não inicializada. Atualize a página.');
        return;
    }

    showAuthError('');
    try {
        await window.firebaseSignInWithEmailAndPassword(window.firebaseAuth, email, password);
    } catch (err) {
        console.error('Erro de login:', err);
        showAuthError('Credenciais inválidas ou erro de conexão.');
    }
}

async function handleSignOut() {
    if (!window.firebaseAuth || !window.firebaseSignOut) return;
    try {
        await window.firebaseSignOut(window.firebaseAuth);
        showUnauthenticatedAdmin();
    } catch (err) {
        console.error('Erro ao sair:', err);
        alert('Não foi possível sair. Tente novamente.');
    }
}

// Função para escapar valores CSV (usando a de shared.js)

// ===== FUNÇÃO UTILITÁRIA =====
// Formata valores para exibição, substituindo valores vazios por '—'
const formatValue = (val) => {
    // Verifica se o valor é null, undefined ou string vazia
    if (val === null || val === undefined || val === '') return '—';
    // Converte para string maiúscula
    return String(val).toUpperCase();
};

// ===== RENDERIZAÇÃO DA TABELA =====
// Renderiza a tabela de registros aplicando filtros e busca
function renderTable() {
    // Seleciona o container da tabela
    const container = document.getElementById('checklistsList');
    // Limpa o conteúdo anterior
    container.innerHTML = '';

    // Aplica filtro por tipo de operação
    let filtered = allChecklists;
    if (currentFilter === 'inbound') {
        filtered = allChecklists.filter(c => String(c.operationType || '').toUpperCase() === 'IN');
    } else if (currentFilter === 'outbound') {
        filtered = allChecklists.filter(c => String(c.operationType || '').toUpperCase() === 'OUT');
    }

    // Aplica filtro de busca por texto
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(c =>
            String(c.dtNumber || '').toLowerCase().includes(searchTerm) ||
            String(c.driverName || '').toLowerCase().includes(searchTerm) ||
            String(c.placaCavalo || '').toLowerCase().includes(searchTerm) ||
            String(c.placaCarreta1 || '').toLowerCase().includes(searchTerm) ||
            String(c.transportadora || '').toLowerCase().includes(searchTerm)
        );
    }

    // Se não há registros após filtros, mostra mensagem vazia
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>📋 Nenhum registro encontrado</p></div>';
        return;
    }

    // Cria a estrutura da tabela
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>TIPO / STATUS</th>
                <th>MOTORISTA</th>
                <th>CAVALO</th>
                <th>CARRETA</th>
                <th>DOCA</th>
                <th>Nº DT</th>
                <th>CHECK-IN</th>
                <th>TRANSPORTADORA</th>
                <th>TOTAL FARDOS</th>
                <th>AVARIADOS</th>
                <th>SCRAP</th>
                <th>INT</th>
                <th>AÇÕES</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    // Seleciona o corpo da tabela
    const tbody = table.querySelector('tbody');

    // Para cada checklist filtrado, cria uma linha na tabela
    filtered.forEach((checklist) => {
        const row = document.createElement('tr');
        const opTypeRaw = formatValue(checklist.operationType);
        const opType = escapeHtml(opTypeRaw);
        const opEmoji = opTypeRaw === 'IN' ? '📥' : (opTypeRaw === 'OUT' ? '📤' : '❓');
        const badgeClass = opTypeRaw === 'IN' ? 'badge-in' : (opTypeRaw === 'OUT' ? 'badge-out' : '');

        row.innerHTML = `
            <td>
                <div class="status-cell">
                    <span>${opEmoji}</span>
                    <span class="badge ${badgeClass}">${opType}</span>
                </div>
            </td>
            <td class="text-bold">${escapeHtml(formatValue(checklist.driverName))}</td>
            <td class="text-bold">${escapeHtml(formatValue(checklist.placaCavalo))}</td>
            <td class="text-bold">${escapeHtml(formatValue(checklist.placaCarreta1))}</td>
            <td class="text-center"><span class="badge badge-doca">${escapeHtml(formatValue(checklist.doca))}</span></td>
            <td class="text-bold">${escapeHtml(formatValue(checklist.dtNumber))}</td>
            <td class="text-bold">⏰ ${escapeHtml(formatValue(checklist.checkinTime))}</td>
            <td class="text-bold">${escapeHtml(formatValue(checklist.transportadora))}</td>
            <td class="text-bold text-center" style="color: #D40511;">${escapeHtml(checklist.totalFardos || 0)}</td>
            <td class="text-bold text-center" style="color: #D40511;">${escapeHtml(checklist.avariados || 0)}</td>
            <td class="text-bold text-center" style="color: #D40511;">${escapeHtml(checklist.scrap || 0)}</td>
            <td class="text-bold text-center" style="color: #D40511;">${escapeHtml(checklist.avariasInternas || 0)}</td>
            <td class="text-center">
                <button type="button" class="action-btn edit-btn view-btn" title="Visualizar Detalhes">👁️</button>
                <button type="button" class="action-btn delete-btn delete-row-btn" title="Excluir">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
        const viewButton = row.querySelector('.view-btn');
        const deleteButton = row.querySelector('.delete-row-btn');
        if (viewButton) viewButton.addEventListener('click', () => viewChecklistDetailsById(checklist.id));
        if (deleteButton) deleteButton.addEventListener('click', () => deleteChecklistById(checklist.id));
    });

    container.appendChild(table);
}

// ===== FUNÇÕES DE AÇÃO =====
// Função para visualizar detalhes completos do checklist
function viewChecklistDetails(index) {
    const checklist = allChecklists[index];
    if (!checklist) return;

    const totalPallets = Number.isFinite(Number(checklist.totalPbr || checklist.totalPBR))
        ? Number(checklist.totalPbr || checklist.totalPBR)
        : (Array.isArray(checklist.palletRows)
            ? checklist.palletRows.reduce((sum, row) => sum + (parseInt(row.quantity || row.qtd || 0, 10) || 0), 0)
            : 0);

    const hygieneNote = (checklist.hygieneNote || checklist.hygieneObservation || checklist.hygiene_notes || checklist.hygiene_note || '').toString().trim();
    const hygiene = normalizeHygieneEntries(checklist.hygiene || {});
    const hygieneEntries = Object.entries(hygiene).length ? Object.entries(hygiene) : [['Sem dados', 'N/A']];

    // Cria modal com detalhes completos
    const modal = document.createElement('div');
    modal.className = 'detail-modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    // Usa safeSetInnerHTML para prevenir XSS
    safeSetInnerHTML(modal, `
        <div class="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div class="p-6 border-b border-gray-200">
                <div class="flex justify-between items-center gap-2">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800">📋 Detalhes do Checklist</h2>
                        <p class="text-sm text-slate-500">ID: ${escapeHtml(checklist.id || '')}</p>
                    </div>
                    <div class="flex gap-2">
                        <button type="button" class="modal-edit-btn btn-secondary">Editar</button>
                        <button type="button" class="modal-close text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                    </div>
                </div>
            </div>
            <div class="p-6 space-y-6">
                <!-- Identificação -->
                <div class="bg-blue-50 p-4 rounded-lg">
                    <h3 class="font-bold text-lg mb-3">🏷️ Identificação</h3>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div><strong>Tipo:</strong> ${checklist.operationType === 'IN' ? '📥 Inbound' : '📤 Outbound'}</div>
                        <div><strong>NF:</strong> ${escapeHtml(formatValue(checklist.nfNumber))}</div>
                        <div><strong>DT:</strong> ${escapeHtml(formatValue(checklist.dtNumber))}</div>
                        <div><strong>Motorista:</strong> ${escapeHtml(formatValue(checklist.driverName))}</div>
                        <div><strong>Cavalo:</strong> ${escapeHtml(formatValue(checklist.placaCavalo))}</div>
                        <div><strong>Carreta 1:</strong> ${escapeHtml(formatValue(checklist.placaCarreta1))}</div>
                        <div><strong>Carreta 2:</strong> ${escapeHtml(formatValue(checklist.placaCarreta2))}</div>
                        <div><strong>Total Paletes:</strong> ${escapeHtml(String(checklist.totalPbr || checklist.totalPBR || 0))}</div>
                        <div><strong>Doca:</strong> ${escapeHtml(formatValue(checklist.doca))}</div>
                        <div><strong>Transportadora:</strong> ${escapeHtml(formatValue(checklist.transportadora))}</div>
                        <div><strong>Status Lacre:</strong> ${escapeHtml(formatValue(checklist.statusLacre))}</div>
                        <div><strong>Lacre 1:</strong> ${escapeHtml(formatValue(checklist.lacre1))}</div>
                        <div><strong>Lacre 2:</strong> ${escapeHtml(formatValue(checklist.lacre2))}</div>
                        <div><strong>Check-in:</strong> ${escapeHtml(formatValue(checklist.checkinTime))}</div>
                        <div><strong>Origem:</strong> ${escapeHtml(formatValue(checklist.origem))}</div>
                    </div>
                </div>

                <!-- Higiene -->
                <div class="bg-green-50 p-4 rounded-lg">
                    <h3 class="font-bold text-lg mb-3">🧼 Higiene e Estrutura</h3>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                        ${hygieneEntries.map(([key, value]) => 
                            `<div class="flex justify-between items-center p-2 bg-white rounded border">
                                <span class="text-sm">${escapeHtml(key)}</span>
                                <span class="font-bold ${value === 'C' ? 'text-green-600' : 'text-red-600'}">${escapeHtml(value)}</span>
                            </div>`
                        ).join('')}
                    </div>
                </div>

                ${hygieneNote ? `
                <div class="bg-purple-50 p-4 rounded-lg">
                    <h3 class="font-bold text-lg mb-3">📝 Observação de Higiene e Estrutura</h3>
                    <p class="text-gray-700">${escapeHtml(hygieneNote)}</p>
                </div>
                ` : ''}

                <!-- Itens -->
                <div class="bg-yellow-50 p-4 rounded-lg ${checklist.operationType === 'OUT' ? 'hidden' : ''}">
                    <h3 class="font-bold text-lg mb-3">📦 Itens Conferidos</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm border-collapse border border-gray-300">
                            <thead>
                                <tr class="bg-gray-100">
                                    <th class="border border-gray-300 p-2">Código</th>
                                    <th class="border border-gray-300 p-2">Previsto</th>
                                    <th class="border border-gray-300 p-2">Realizado</th>
                                    <th class="border border-gray-300 p-2">Faltas</th>
                                    <th class="border border-gray-300 p-2">Sobras</th>
                                    <th class="border border-gray-300 p-2">Avarias</th>
                                    <th class="border border-gray-300 p-2">Scrap</th>
                                    <th class="border border-gray-300 p-2">Av. Int.</th>
                                    <th class="border border-gray-300 p-2">Bons</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(checklist.items || []).map(item => `
                                    <tr>
                                        <td class="border border-gray-300 p-2">${escapeHtml(item.code || '')}</td>
                                        <td class="border border-gray-300 p-2 text-center">${escapeHtml(item.previsto || 0)}</td>
                                        <td class="border border-gray-300 p-2 text-center">${escapeHtml(item.realizado || 0)}</td>
                                        <td class="border border-gray-300 p-2 text-center text-red-600">${escapeHtml(item.faltas || 0)}</td>
                                        <td class="border border-gray-300 p-2 text-center text-green-600">${escapeHtml(item.sobras || 0)}</td>
                                        <td class="border border-gray-300 p-2 text-center">${escapeHtml(item.avarias || 0)}</td>
                                        <td class="border border-gray-300 p-2 text-center">${escapeHtml(item.scrap || 0)}</td>
                                        <td class="border border-gray-300 p-2 text-center">${escapeHtml(item.avariasInternas || 0)}</td>
                                        <td class="border border-gray-300 p-2 text-center font-bold">${escapeHtml(item.bons || 0)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
<div class="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div class="bg-white p-2 rounded border text-center">
                            <strong>Total Faltas:</strong> <span class="text-red-600">${checklist.totalFaltas || 0}</span>
                        </div>
                        <div class="bg-white p-2 rounded border text-center">
                            <strong>Total Sobras:</strong> <span class="text-green-600">${checklist.totalSobra || 0}</span>
                        </div>
                                <div class="bg-white p-2 rounded border text-center">
                            <strong>Total Bons:</strong> <span class="text-blue-600 font-bold">${calculateTotalBons(checklist)}</span>
                        </div>
                        <div class="bg-white p-2 rounded border text-center">
                            <strong>Total Fardos:</strong> <span class="font-bold">${checklist.totalFardos || calculateTotalFardos(checklist)}</span>
                        </div>
                        <div class="bg-white p-2 rounded border text-center">
                            <strong>Total Pallets:</strong> <span class="font-bold">${totalPallets}</span>
                        </div>
                    </div>
                </div>

                <!-- Observações -->
                ${checklist.observations ? `
                <div class="bg-purple-50 p-4 rounded-lg">
                    <h3 class="font-bold text-lg mb-3">📝 Observações</h3>
                    <p class="text-gray-700">${escapeHtml(checklist.observations)}</p>
                </div>
                ` : ''}

                ${(checklist.driverSignature || checklist.checkerSignature) ? `
                <div class="bg-slate-50 p-4 rounded-lg">
                    <h3 class="font-bold text-lg mb-3">✍️ Assinaturas</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        ${checklist.driverSignature ? `
                        <div class="bg-white p-4 rounded-lg border">
                            <p class="font-bold mb-2">Motorista</p>
                            <img src="${escapeHtml(checklist.driverSignature)}" alt="Assinatura Motorista" class="w-full h-44 object-contain">
                        </div>
                        ` : ''}
                        ${checklist.checkerSignature ? `
                        <div class="bg-white p-4 rounded-lg border">
                            <p class="font-bold mb-2">Conferente</p>
                            <img src="${escapeHtml(checklist.checkerSignature)}" alt="Assinatura Conferente" class="w-full h-44 object-contain">
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}

                ${Array.isArray(checklist.photos) && checklist.photos.length > 0 ? `
                <div class="bg-slate-50 p-4 rounded-lg">
                    <h3 class="font-bold text-lg mb-3">📷 Fotos do Checklist</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        ${checklist.photos.map((photo, photoIndex) => `
                            <div class="rounded-3xl overflow-hidden border border-gray-200 shadow-sm bg-white">
                                <img src="${escapeHtml(photo)}" alt="Foto ${photoIndex + 1}" class="w-full h-44 object-cover">
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Pallets e Selos (se existirem) -->
                ${((checklist.palletRows && checklist.palletRows.length > 0) || (checklist.pallets && Object.values(checklist.pallets).some(v => v)) || (checklist.seals && Object.values(checklist.seals).some(v => v))) ? `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${checklist.palletRows && checklist.palletRows.length > 0 ? `
                    <div class="bg-orange-50 p-4 rounded-lg">
                        <h3 class="font-bold text-lg mb-3">📦 Pallets (${checklist.operationType === 'IN' ? 'INBOUND' : 'OUTBOUND'})</h3>
                        <div class="overflow-x-auto text-sm w-full">
                            <table class="w-full min-w-[560px] border-collapse border border-gray-300">
                                <thead>
                                    <tr class="bg-white">
                                        <th class="border border-gray-300 p-2 text-left">Código</th>
                                        <th class="border border-gray-300 p-2 text-right">Fardos Totais</th>
                                        <th class="border border-gray-300 p-2 text-right">Fardos / Pallet</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${checklist.palletRows.map(row => `
                                        <tr>
                                            <td class="border border-gray-300 p-2">${escapeHtml(row.code || '—')}</td>
                                            <td class="border border-gray-300 p-2 text-right">${escapeHtml(row.count || 0)}</td>
                                            <td class="border border-gray-300 p-2 text-right">${escapeHtml(row.per || 0)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    ` : ''}
                    ${checklist.seals && Object.values(checklist.seals).some(v => v) ? `
                    <div class="bg-red-50 p-4 rounded-lg">
                        <h3 class="font-bold text-lg mb-3">🔒 Selos</h3>
                        <div class="space-y-1 text-sm">
                            ${Object.entries(checklist.seals).map(([key, value]) => 
                                value ? `<div><strong>${key.replace('seal', 'Selo ')}:</strong> ${value}</div>` : ''
                            ).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
                ` : ''}
            </div>
        </div>
    `);
    const closeButton = modal.querySelector('.modal-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => modal.remove());
    }

    const editButton = modal.querySelector('.modal-edit-btn');
    if (editButton) {
        editButton.addEventListener('click', () => {
            modal.remove();
            openChecklistEditor(checklist);
        });
    }

    document.body.appendChild(modal);
}

function calculateTotalBons(checklist) {
    if (!checklist || !Array.isArray(checklist.items)) return checklist.totalBonsGeral || 0;
    return checklist.items.reduce((sum, item) => {
        const realizado = Number(item.realizado || 0);
        const losses = Number(item.avarias || 0) + Number(item.scrap || 0) + Number(item.avariasInternas || 0);
        const bons = realizado - losses;
        return sum + (bons > 0 ? bons : 0);
    }, 0);
}

function calculateTotalFardos(checklist) {
    if (!checklist || !Array.isArray(checklist.items)) return checklist.totalFardos || 0;
    return checklist.items.reduce((sum, item) => sum + Number(item.previsto || 0), 0);
}

function normalizeHygieneEntries(hygiene) {
    if (!hygiene || typeof hygiene !== 'object') return {};
    return Object.entries(hygiene).reduce((acc, [key, value]) => {
        if (value && typeof value === 'object' && 'label' in value && 'value' in value) {
            acc[value.label || key] = String(value.value || '').trim().toUpperCase() || 'N/A';
        } else if (typeof value === 'string') {
            acc[key] = value.toString().trim().toUpperCase() || 'N/A';
        } else {
            acc[key] = String(value || '').trim().toUpperCase() || 'N/A';
        }
        return acc;
    }, {});
}

async function updateChecklistDetails(id, updates) {
    if (!window.firebaseDb || !window.firebaseUpdateDoc || !window.firebaseDoc) {
        throw new Error('Firebase não está inicializado para atualização de checklist.');
    }
    const docRef = window.firebaseDoc(window.firebaseDb, 'checklists', id);
    await window.firebaseUpdateDoc(docRef, updates);
}

function openChecklistEditor(checklist) {
    const hygiene = normalizeHygieneEntries(checklist.hygiene || {});
    const hygieneEntries = Object.entries(hygiene).length ? Object.entries(hygiene) : [
        ['Paredes Internas', 'N/A'],
        ['Sem Furos', 'N/A'],
        ['Teto', 'N/A'],
        ['Chão Limpo', 'N/A'],
        ['Sem Odor', 'N/A'],
        ['Sem Pragas', 'N/A']
    ];
    const items = Array.isArray(checklist.items) ? checklist.items : [];
    const totalPbr = Number(checklist.totalPbr || checklist.totalPBR || 0);
    const statusValues = Array.from(new Set([checklist.statusLacre || 'OK', 'OK', 'Quebrado', 'Ausente', 'Sem Lacre']));
    const hygieneSelectionHtml = hygieneEntries.map(([key, value]) => {
        const safeKey = key.replace(/\s+/g, '_').toLowerCase();
        return `
            <div class="bg-white p-3 rounded-lg border">
                <div class="text-sm font-semibold mb-2">${escapeHtml(key)}</div>
                <div class="flex flex-wrap gap-3 text-sm">
                    <label class="flex items-center gap-2"><input type="radio" name="${safeKey}" value="C" ${value === 'C' ? 'checked' : ''}>C</label>
                    <label class="flex items-center gap-2"><input type="radio" name="${safeKey}" value="NC" ${value === 'NC' ? 'checked' : ''}>NC</label>
                    <label class="flex items-center gap-2"><input type="radio" name="${safeKey}" value="N/A" ${value !== 'C' && value !== 'NC' ? 'checked' : ''}>N/A</label>
                </div>
            </div>
        `;
    }).join('');

    const modal = document.createElement('div');
    modal.className = 'detail-modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    safeSetInnerHTML(modal, `
        <div class="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div class="p-6 border-b border-gray-200 flex items-center justify-between gap-2">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800">✏️ Editar Checklist</h2>
                    <p class="text-sm text-slate-500">ID: ${escapeHtml(checklist.id || '')}</p>
                </div>
                <div class="flex gap-2">
                    <button type="button" class="modal-save-btn btn-primary">Salvar</button>
                    <button type="button" class="modal-cancel-btn btn-secondary">Cancelar</button>
                </div>
            </div>
            <div class="p-6 space-y-6">
                <div class="bg-blue-50 p-4 rounded-lg">
                    <h3 class="font-bold text-lg mb-3">🏷️ Identificação</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label class="block text-sm font-semibold text-slate-700">
                            Fluxo
                            <select id="adminOperationType" class="input-field w-full mt-2" onchange="document.getElementById('adminTechnicalSection')?.classList.toggle('hidden', this.value === 'OUT')">
                                <option value="IN" ${checklist.operationType === 'IN' ? 'selected' : ''}>INBOUND</option>
                                <option value="OUT" ${checklist.operationType === 'OUT' ? 'selected' : ''}>OUTBOUND</option>
                            </select>
                        </label>
                        <label class="block text-sm font-semibold text-slate-700">
                            NF
                            <input id="adminNfNumber" type="text" class="input-field w-full mt-2" value="${escapeHtml(checklist.nfNumber || '')}">
                        </label>
                        <label class="block text-sm font-semibold text-slate-700">
                            DT
                            <input id="adminDtNumber" type="text" class="input-field w-full mt-2" value="${escapeHtml(checklist.dtNumber || '')}">
                        </label>
                        <label class="block text-sm font-semibold text-slate-700">
                            Motorista
                            <input id="adminDriverName" type="text" class="input-field w-full mt-2" value="${escapeHtml(checklist.driverName || '')}">
                        </label>
                        <label class="block text-sm font-semibold text-slate-700">
                            Cavalo
                            <input id="adminPlacaCavalo" type="text" class="input-field w-full mt-2" value="${escapeHtml(checklist.placaCavalo || '')}">
                        </label>
                        <label class="block text-sm font-semibold text-slate-700">
                            Carreta
                            <input id="adminPlacaCarreta1" type="text" class="input-field w-full mt-2" value="${escapeHtml(checklist.placaCarreta1 || '')}">
                        </label>
                        <label class="block text-sm font-semibold text-slate-700">
                            Carreta 2
                            <input id="adminPlacaCarreta2" type="text" class="input-field w-full mt-2" value="${escapeHtml(checklist.placaCarreta2 || '')}">
                        </label>
                        <label class="block text-sm font-semibold text-slate-700">
                            Total Paletes
                            <input id="adminTotalPbr" type="number" class="input-field w-full mt-2" min="0" value="${escapeHtml(String(totalPbr))}">
                        </label>
                        <label class="block text-sm font-semibold text-slate-700">
                            Transportadora
                            <input id="adminTransportadora" type="text" class="input-field w-full mt-2" value="${escapeHtml(checklist.transportadora || '')}">
                        </label>
                        <label class="block text-sm font-semibold text-slate-700">
                            Origem
                            <input id="adminOrigem" type="text" class="input-field w-full mt-2" value="${escapeHtml(checklist.origem || '')}">
                        </label>
                        <label class="block text-sm font-semibold text-slate-700">
                            Doca
                            <input id="adminDoca" type="text" class="input-field w-full mt-2" value="${escapeHtml(checklist.doca || '')}">
                        </label>
                        <label class="block text-sm font-semibold text-slate-700">
                            Status Lacre
                            <select id="adminStatusLacre" class="input-field w-full mt-2">
                                ${statusValues.map(value => `<option value="${escapeHtml(value)}" ${checklist.statusLacre === value ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('')}
                            </select>
                        </label>
                        <label class="block text-sm font-semibold text-slate-700">
                            Lacre 1
                            <input id="adminLacre1" type="text" class="input-field w-full mt-2" value="${escapeHtml(checklist.lacre1 || '')}">
                        </label>
                        <label class="block text-sm font-semibold text-slate-700">
                            Lacre 2
                            <input id="adminLacre2" type="text" class="input-field w-full mt-2" value="${escapeHtml(checklist.lacre2 || '')}">
                        </label>
                        <label class="block text-sm font-semibold text-slate-700">
                            Check-in
                            <input id="adminCheckinTime" type="text" class="input-field w-full mt-2" value="${escapeHtml(checklist.checkinTime || '')}">
                        </label>
                    </div>
                </div>
                <div id="adminTechnicalSection" class="bg-yellow-50 p-4 rounded-lg ${checklist.operationType === 'OUT' ? 'hidden' : ''}">
                    <h3 class="font-bold text-lg mb-3">📦 Itens Conferidos</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm border-collapse border border-gray-300">
                            <thead>
                                <tr class="bg-gray-100">
                                    <th class="border border-gray-300 p-2">Código</th>
                                    <th class="border border-gray-300 p-2">Previsto</th>
                                    <th class="border border-gray-300 p-2">Realizado</th>
                                    <th class="border border-gray-300 p-2">Faltas</th>
                                    <th class="border border-gray-300 p-2">Sobras</th>
                                    <th class="border border-gray-300 p-2">Avarias</th>
                                    <th class="border border-gray-300 p-2">Scrap</th>
                                    <th class="border border-gray-300 p-2">Av. Int.</th>
                                    <th class="border border-gray-300 p-2">Bons</th>
                                    <th class="border border-gray-300 p-2">Ações</th>
                                </tr>
                            </thead>
                            <tbody class="edit-items-body">
                                ${items.length ? items.map((item, index) => `
                                    <tr class="edit-item-row" data-row-index="${index}">
                                        <td class="border border-gray-300 p-2"><input type="text" class="table-input edit-item-code" value="${escapeHtml(item.code || '')}"></td>
                                        <td class="border border-gray-300 p-2"><input type="number" class="table-input edit-item-previsto" value="${escapeHtml(item.previsto || 0)}" min="0"></td>
                                        <td class="border border-gray-300 p-2"><input type="number" class="table-input edit-item-realizado" value="${escapeHtml(item.realizado || 0)}" min="0"></td>
                                        <td class="border border-gray-300 p-2"><input type="number" class="table-input edit-item-faltas" value="${escapeHtml(item.faltas || 0)}" readonly></td>
                                        <td class="border border-gray-300 p-2"><input type="number" class="table-input edit-item-sobras" value="${escapeHtml(item.sobras || 0)}" readonly></td>
                                        <td class="border border-gray-300 p-2"><input type="number" class="table-input edit-item-avarias" value="${escapeHtml(item.avarias || 0)}" min="0"></td>
                                        <td class="border border-gray-300 p-2"><input type="number" class="table-input edit-item-scrap" value="${escapeHtml(item.scrap || 0)}" min="0"></td>
                                        <td class="border border-gray-300 p-2"><input type="number" class="table-input edit-item-avint" value="${escapeHtml(item.avariasInternas || 0)}" min="0"></td>
                                        <td class="border border-gray-300 p-2"><input type="number" class="table-input edit-item-bons" value="${escapeHtml(item.bons || 0)}" readonly></td>
                                        <td class="border border-gray-300 p-2 text-center"><button type="button" class="edit-item-remove-btn text-red-600">✕</button></td>
                                    </tr>
                                `).join('') : `
                                    <tr class="edit-item-row" data-row-index="0">
                                        <td class="border border-gray-300 p-2"><input type="text" class="table-input edit-item-code" value=""></td>
                                        <td class="border border-gray-300 p-2"><input type="number" class="table-input edit-item-previsto" value="0" min="0"></td>
                                        <td class="border border-gray-300 p-2"><input type="number" class="table-input edit-item-realizado" value="0" min="0"></td>
                                        <td class="border border-gray-300 p-2"><input type="number" class="table-input edit-item-faltas" value="0" readonly></td>
                                        <td class="border border-gray-300 p-2"><input type="number" class="table-input edit-item-sobras" value="0" readonly></td>
                                        <td class="border border-gray-300 p-2"><input type="number" class="table-input edit-item-avarias" value="0" min="0"></td>
                                        <td class="border border-gray-300 p-2"><input type="number" class="table-input edit-item-scrap" value="0" min="0"></td>
                                        <td class="border border-gray-300 p-2"><input type="number" class="table-input edit-item-avint" value="0" min="0"></td>
                                        <td class="border border-gray-300 p-2"><input type="number" class="table-input edit-item-bons" value="0" readonly></td>
                                        <td class="border border-gray-300 p-2 text-center"><button type="button" class="edit-item-remove-btn text-red-600">✕</button></td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                        <div class="mt-4">
                            <button type="button" class="add-item-row-btn btn-secondary">＋ Adicionar item</button>
                        </div>
                    </div>
                </div>
                <div class="bg-green-50 p-4 rounded-lg">
                    <h3 class="font-bold text-lg mb-3">🧼 Higiene e Estrutura</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${hygieneSelectionHtml}
                    </div>
                </div>
                <div class="bg-purple-50 p-4 rounded-lg">
                    <label for="adminHygieneObservation" class="text-sm font-bold uppercase mb-2 block">Observação de Higiene e Estrutura</label>
                    <textarea id="adminHygieneObservation" class="w-full min-h-[120px] bg-white border border-muted rounded-2xl p-4 text-sm" placeholder="Observação de higiene...">${escapeHtml(checklist.hygieneNote || checklist.hygieneObservation || '')}</textarea>
                </div>
                <div class="bg-purple-50 p-4 rounded-lg">
                    <label for="adminObservations" class="text-sm font-bold uppercase mb-2 block">Observações Gerais</label>
                    <textarea id="adminObservations" class="w-full min-h-[120px] bg-white border border-muted rounded-2xl p-4 text-sm" placeholder="Observações gerais...">${escapeHtml(checklist.observations || '')}</textarea>
                </div>
            </div>
        </div>
    `);

    const cancelButton = modal.querySelector('.modal-cancel-btn');
    if (cancelButton) {
        cancelButton.addEventListener('click', () => modal.remove());
    }

    function recalcItemRow(row) {
        const previsto = parseInt(row.querySelector('.edit-item-previsto')?.value, 10) || 0;
        const realizado = parseInt(row.querySelector('.edit-item-realizado')?.value, 10) || 0;
        const avarias = parseInt(row.querySelector('.edit-item-avarias')?.value, 10) || 0;
        const scrap = parseInt(row.querySelector('.edit-item-scrap')?.value, 10) || 0;
        const avint = parseInt(row.querySelector('.edit-item-avint')?.value, 10) || 0;
        const faltas = Math.max(previsto - realizado, 0);
        const sobras = Math.max(realizado - previsto, 0);
        const bons = Math.max(realizado - (avarias + scrap + avint), 0);
        row.querySelector('.edit-item-faltas').value = faltas;
        row.querySelector('.edit-item-sobras').value = sobras;
        row.querySelector('.edit-item-bons').value = bons;
    }

    function attachItemListeners(row) {
        ['.edit-item-previsto', '.edit-item-realizado', '.edit-item-avarias', '.edit-item-scrap', '.edit-item-avint'].forEach(selector => {
            const input = row.querySelector(selector);
            if (input) {
                input.addEventListener('input', () => recalcItemRow(row));
            }
        });
        const removeButton = row.querySelector('.edit-item-remove-btn');
        if (removeButton) {
            removeButton.addEventListener('click', () => {
                row.remove();
            });
        }
    }

    modal.querySelectorAll('.edit-item-row').forEach(row => attachItemListeners(row));

    const addRowButton = modal.querySelector('.add-item-row-btn');
    if (addRowButton) {
        addRowButton.addEventListener('click', () => {
            const tbody = modal.querySelector('.edit-items-body');
            const row = document.createElement('tr');
            row.className = 'edit-item-row';
            row.innerHTML = `
                <td class="border border-gray-300 p-2"><input type="text" class="table-input edit-item-code" value=""></td>
                <td class="border border-gray-300 p-2"><input type="number" class="table-input edit-item-previsto" value="0" min="0"></td>
                <td class="border border-gray-300 p-2"><input type="number" class="table-input edit-item-realizado" value="0" min="0"></td>
                <td class="border border-gray-300 p-2"><input type="number" class="table-input edit-item-faltas" value="0" readonly></td>
                <td class="border border-gray-300 p-2"><input type="number" class="table-input edit-item-sobras" value="0" readonly></td>
                <td class="border border-gray-300 p-2"><input type="number" class="table-input edit-item-avarias" value="0" min="0"></td>
                <td class="border border-gray-300 p-2"><input type="number" class="table-input edit-item-scrap" value="0" min="0"></td>
                <td class="border border-gray-300 p-2"><input type="number" class="table-input edit-item-avint" value="0" min="0"></td>
                <td class="border border-gray-300 p-2"><input type="number" class="table-input edit-item-bons" value="0" readonly></td>
                <td class="border border-gray-300 p-2 text-center"><button type="button" class="edit-item-remove-btn text-red-600">✕</button></td>
            `;
            tbody.appendChild(row);
            attachItemListeners(row);
        });
    }

    const saveButton = modal.querySelector('.modal-save-btn');
    if (saveButton) {
        saveButton.addEventListener('click', async () => {
            const updatedHygiene = {};
            hygieneEntries.forEach(([key]) => {
                const safeKey = key.replace(/\s+/g, '_').toLowerCase();
                const selected = modal.querySelector(`input[name="${safeKey}"]:checked`);
                updatedHygiene[key] = selected ? selected.value : 'N/A';
            });
            const updatedNote = modal.querySelector('#adminHygieneObservation')?.value.trim() || '';
            const updatedObservations = modal.querySelector('#adminObservations')?.value.trim() || '';
            const updatedItems = [];
            modal.querySelectorAll('.edit-item-row').forEach(row => {
                const code = row.querySelector('.edit-item-code')?.value || '';
                const previsto = parseInt(row.querySelector('.edit-item-previsto')?.value, 10) || 0;
                const realizado = parseInt(row.querySelector('.edit-item-realizado')?.value, 10) || 0;
                const avarias = parseInt(row.querySelector('.edit-item-avarias')?.value, 10) || 0;
                const scrap = parseInt(row.querySelector('.edit-item-scrap')?.value, 10) || 0;
                const avariasInternas = parseInt(row.querySelector('.edit-item-avint')?.value, 10) || 0;
                const faltas = parseInt(row.querySelector('.edit-item-faltas')?.value, 10) || Math.max(previsto - realizado, 0);
                const sobras = parseInt(row.querySelector('.edit-item-sobras')?.value, 10) || Math.max(realizado - previsto, 0);
                const bons = parseInt(row.querySelector('.edit-item-bons')?.value, 10) || Math.max(realizado - (avarias + scrap + avariasInternas), 0);
                updatedItems.push({ code, previsto, realizado, faltas, sobras, avarias, scrap, avariasInternas, bons });
            });

            const updatedChecklist = {
                operationType: modal.querySelector('#adminOperationType')?.value || checklist.operationType,
                nfNumber: modal.querySelector('#adminNfNumber')?.value || '',
                dtNumber: modal.querySelector('#adminDtNumber')?.value || '',
                driverName: modal.querySelector('#adminDriverName')?.value || '',
                placaCavalo: modal.querySelector('#adminPlacaCavalo')?.value || '',
                placaCarreta1: modal.querySelector('#adminPlacaCarreta1')?.value || '',
                transportadora: modal.querySelector('#adminTransportadora')?.value || '',
                origem: modal.querySelector('#adminOrigem')?.value || '',
                doca: modal.querySelector('#adminDoca')?.value || '',
                statusLacre: modal.querySelector('#adminStatusLacre')?.value || '',
                lacre1: modal.querySelector('#adminLacre1')?.value || '',
                lacre2: modal.querySelector('#adminLacre2')?.value || '',
                placaCarreta2: modal.querySelector('#adminPlacaCarreta2')?.value || '',
                totalPbr: parseInt(modal.querySelector('#adminTotalPbr')?.value, 10) || 0,
                checkinTime: modal.querySelector('#adminCheckinTime')?.value || checklist.checkinTime,
                hygiene: updatedHygiene,
                hygieneNote: updatedNote,
                observations: updatedObservations,
                items: updatedItems,
                totalFardos: updatedItems.reduce((sum, item) => sum + item.previsto, 0),
                avariados: updatedItems.reduce((sum, item) => sum + item.avarias, 0),
                scrap: updatedItems.reduce((sum, item) => sum + item.scrap, 0),
                avariasInternas: updatedItems.reduce((sum, item) => sum + item.avariasInternas, 0),
                totalFaltas: updatedItems.reduce((sum, item) => sum + item.faltas, 0),
                totalSobra: updatedItems.reduce((sum, item) => sum + item.sobras, 0),
                totalBonsGeral: updatedItems.reduce((sum, item) => sum + item.bons, 0),
                photos: checklist.photos || [],
                driverSignature: checklist.driverSignature,
                checkerSignature: checklist.checkerSignature
            };

            try {
                saveButton.disabled = true;
                saveButton.textContent = 'Salvando...';
                await updateChecklistDetails(checklist.id, updatedChecklist);
                const index = allChecklists.findIndex(item => item.id === checklist.id);
                if (index !== -1) {
                    allChecklists[index] = {
                        ...allChecklists[index],
                        ...updatedChecklist
                    };
                }
                updateMetrics();
                renderTable();
                alert('Checklist atualizado com sucesso.');
                modal.remove();
            } catch (err) {
                console.error('Erro ao atualizar checklist:', err);
                alert('Falha ao salvar alterações. Tente novamente.');
                saveButton.disabled = false;
                saveButton.textContent = 'Salvar';
            }
        });
    }

    document.body.appendChild(modal);
}

function closeDetailModal() {
    const modal = document.querySelector('.detail-modal-overlay');
    if (modal) modal.remove();
}

// Função para editar um checklist (placeholder)
function editChecklist(index) {
    // Por enquanto, redireciona para visualizar detalhes
    viewChecklistDetails(index);
}

// Função para excluir um checklist
async function deleteChecklist(index) {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;

    const checklist = allChecklists[index];
    if (!checklist?.id) {
        alert('Não foi possível excluir este registro. ID ausente.');
        return;
    }

    try {
        await window.firebaseDeleteDoc(window.firebaseDoc(window.firebaseDb, 'checklists', checklist.id));

        // Fechar modal de detalhes caso esteja aberto
        closeDetailModal();

        // Atualizar estado local imediatamente para remover o registro do painel
        allChecklists.splice(index, 1);
        updateMetrics();
        renderTable();

        // Recarregar a lista apenas se não estiver usando listener em tempo real
        if (!window.firebaseOnSnapshot) {
            await loadChecklists();
        }
    } catch (err) {
        console.error('Erro ao excluir registro do Firebase:', err);
        alert('Erro ao excluir o registro. Tente novamente.');
    }
}

window.viewChecklistDetailsById = viewChecklistDetailsById;
window.deleteChecklistById = deleteChecklistById;
window.deleteChecklist = deleteChecklist;

function viewChecklistDetailsById(id) {
    const index = allChecklists.findIndex(item => item.id === id);
    if (index === -1) return;
    viewChecklistDetails(index);
}

async function deleteChecklistById(id) {
    const index = allChecklists.findIndex(item => item.id === id);
    if (index === -1) {
        alert('Registro não encontrado para exclusão. Atualize a página e tente novamente.');
        return;
    }
    return deleteChecklist(index);
}

// ===== OUVINTES DE EVENTOS =====
// Ouvinte para as abas de filtro
document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.dataset.filter;
        renderTable();
    });
});

// Ouvinte para o campo de busca
document.getElementById('searchInput').addEventListener('input', renderTable);

// Ouvinte para o botão "Nova Entrada"
document.getElementById('newEntryBtn').addEventListener('click', () => {
    // Redireciona para a página de formulário
    window.location.href = 'index.html';
});

function getVisibleChecklists() {
    let filtered = allChecklists;
    if (currentFilter === 'inbound') {
        filtered = allChecklists.filter(c => String(c.operationType || '').toUpperCase() === 'IN');
    } else if (currentFilter === 'outbound') {
        filtered = allChecklists.filter(c => String(c.operationType || '').toUpperCase() === 'OUT');
    }

    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    if (searchTerm) {
        filtered = filtered.filter(c =>
            String(c.dtNumber || '').toLowerCase().includes(searchTerm) ||
            String(c.driverName || '').toLowerCase().includes(searchTerm) ||
            String(c.placaCavalo || '').toLowerCase().includes(searchTerm) ||
            String(c.placaCarreta1 || '').toLowerCase().includes(searchTerm) ||
            String(c.transportadora || '').toLowerCase().includes(searchTerm)
        );
    }

    return filtered;
}

// Ouvinte para o botão "Exportar Excel"
document.getElementById('exportBtn').addEventListener('click', () => {
    const visibleChecklists = getVisibleChecklists();
    if (visibleChecklists.length === 0) {
        alert('Nenhum registro para exportar');
        return;
    }

    if (!window.XLSX) {
        alert('Biblioteca Excel não carregada. Atualize a página e tente novamente.');
        return;
    }

    const headers = [
        'Tipo / Status',
        'DT',
        'NF',
        'Motorista',
        'Cavalo',
        'Carreta',
        'Doca',
        'Transportadora',
        'Origem',
        'Total Fardos',
        'Avariados',
        'Scrap',
        'Avarias Internas',
        'Total Bons',
        'Check-in',
        'Status Lacre',
        'Lacre 1',
        'Lacre 2',
        'Observações'
    ];

    const rows = visibleChecklists.map(c => [
        c.operationType === 'IN' ? 'INBOUND' : c.operationType === 'OUT' ? 'OUTBOUND' : '',
        formatValue(c.dtNumber),
        formatValue(c.nfNumber),
        formatValue(c.driverName),
        formatValue(c.placaCavalo),
        formatValue(c.placaCarreta1),
        formatValue(c.doca),
        formatValue(c.transportadora),
        formatValue(c.origem),
        c.totalFardos || 0,
        c.avariados || 0,
        c.scrap || 0,
        c.avariasInternas || 0,
        c.totalBonsGeral || 0,
        formatValue(c.checkinTime),
        formatValue(c.statusLacre),
        formatValue(c.lacre1),
        formatValue(c.lacre2),
        formatValue(c.observations)
    ]);

    const workbook = XLSX.utils.book_new();
    const data = [
        ['Checklist de Projeto'],
        []
    ];
    data.push(headers);
    rows.forEach(row => data.push(row));

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];
    worksheet['!cols'] = headers.map(() => ({ wch: 18 }));

    const totalRowIndex = rows.length + 4;
    const totalFardosFormula = `SUM(J3:J${rows.length + 2})`;
    const totalRecordsFormula = `COUNTA(A3:A${rows.length + 2})`;
    XLSX.utils.sheet_add_aoa(worksheet, [
        ['Resumo', '', '', '', '', '', '', '', 'Total Fardos', { f: totalFardosFormula }],
        ['', '', '', '', '', '', '', '', 'Registros Exportados', { f: totalRecordsFormula }]
    ], { origin: `A${totalRowIndex}` });

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Checklists');
    const workbookArray = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([workbookArray], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checklists_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
});

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    showUnauthenticatedAdmin();

    document.getElementById('loginBtn')?.addEventListener('click', handleLogin);
    document.getElementById('signOutBtn')?.addEventListener('click', handleSignOut);

    if (window.firebaseAuth && window.firebaseOnAuthStateChanged) {
        window.firebaseOnAuthStateChanged(window.firebaseAuth, (user) => {
            if (user) {
                showAuthenticatedAdmin();
            } else {
                showUnauthenticatedAdmin();
            }
        });
    }
});
