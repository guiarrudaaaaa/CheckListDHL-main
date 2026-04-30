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
// Variáveis globais para controlar filtros e armazenar checklists
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
    // Total de pallets usados em todos os checklists
    const totalPbr = allChecklists.reduce((sum, item) => sum + (parseInt(item.totalPbr || item.totalPBR || 0, 10) || 0), 0);
    // Total de registros
    const totalRegistros = allChecklists.length;

    // Atualiza os elementos HTML dos cards
    const totalRegistrosEl = document.getElementById('totalRegistros');
    const inboundCountEl = document.getElementById('inboundCount');
    const outboundCountEl = document.getElementById('outboundCount');
    const totalPbrCountEl = document.getElementById('totalPbrCount');

    if (totalRegistrosEl) totalRegistrosEl.textContent = totalRegistros;
    if (inboundCountEl) inboundCountEl.textContent = inCount;
    if (outboundCountEl) outboundCountEl.textContent = outCount;
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
    document.getElementById('signOutBtn')?.classList.add('hidden');
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
    await window.firebaseSignOut(window.firebaseAuth);
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
        // Filtra apenas operações inbound
        filtered = allChecklists.filter(c => String(c.operationType || '').toUpperCase() === 'IN');
    } else if (currentFilter === 'outbound') {
        // Filtra apenas operações outbound
        filtered = allChecklists.filter(c => String(c.operationType || '').toUpperCase() === 'OUT');
    }

    // Aplica filtro de busca por texto
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (searchTerm) {
        // Filtra por DT, motorista, placas ou transportadora
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
                <th>TIPO / STATUS</th> <!-- Tipo de operação e status -->
                <th>MOTORISTA</th> <!-- Nome do motorista -->
                <th>CAVALO</th> <!-- Placa do cavalo -->
                <th>CARRETA</th> <!-- Placa da carreta -->
                <th>DOCA</th> <!-- Número da doca -->
                <th>Nº DT</th> <!-- Número do DT -->
                <th>CHECK-IN</th> <!-- Horário de check-in -->
                <th>TRANSPORTADORA</th> <!-- Nome da transportadora -->
                <th>TOTAL FARDOS</th> <!-- Total de fardos -->
                <th>AVARIADOS</th> <!-- Quantidade avariados -->
                <th>SCRAP</th> <!-- Quantidade scrap -->
                <th>INT</th> <!-- Avarias internas -->
                <th>AÇÕES</th> <!-- Botões de ação -->
            </tr>
        </thead>
        <tbody></tbody>
    `;

    // Seleciona o corpo da tabela
    const tbody = table.querySelector('tbody');

    // Para cada checklist filtrado, cria uma linha na tabela
    filtered.forEach((checklist) => {
        // Encontra o índice global no array original
        const globalIndex = allChecklists.indexOf(checklist);
        // Cria elemento de linha
        const row = document.createElement('tr');
        // Formata o tipo de operação
        const opTypeRaw = formatValue(checklist.operationType);
        const opType = escapeHtml(opTypeRaw);
        // Define emoji baseado no tipo
        const opEmoji = opTypeRaw === 'IN' ? '📥' : (opTypeRaw === 'OUT' ? '📤' : '❓');
        // Define classe do badge
        const badgeClass = opTypeRaw === 'IN' ? 'badge-in' : (opTypeRaw === 'OUT' ? 'badge-out' : '');

        // Define o HTML da linha com todas as colunas
        row.innerHTML = `
            <td>
                <div class="status-cell">
                    <span>${opEmoji}</span> <!-- Emoji do tipo -->
                    <span class="badge ${badgeClass}">${opType}</span> <!-- Badge com tipo -->
                </div>
            </td>
            <td class="text-bold">${escapeHtml(formatValue(checklist.driverName))}</td> <!-- Motorista -->
            <td class="text-bold">${escapeHtml(formatValue(checklist.placaCavalo))}</td> <!-- Cavalo -->
            <td class="text-bold">${escapeHtml(formatValue(checklist.placaCarreta1))}</td> <!-- Carreta -->
            <td class="text-center"><span class="badge badge-doca">${escapeHtml(formatValue(checklist.doca))}</span></td> <!-- Doca -->
            <td class="text-bold">${escapeHtml(formatValue(checklist.dtNumber))}</td> <!-- DT -->
            <td class="text-bold">⏰ ${escapeHtml(formatValue(checklist.checkinTime))}</td> <!-- Check-in -->
            <td class="text-bold">${escapeHtml(formatValue(checklist.transportadora))}</td> <!-- Transportadora -->
            <td class="text-bold text-center" style="color: #D40511;">${escapeHtml(checklist.totalFardos || 0)}</td> <!-- Total fardos -->
            <td class="text-bold text-center" style="color: #D40511;">${escapeHtml(checklist.avariados || 0)}</td> <!-- Avariados -->
            <td class="text-bold text-center" style="color: #D40511;">${escapeHtml(checklist.scrap || 0)}</td> <!-- Scrap -->
            <td class="text-bold text-center" style="color: #D40511;">${escapeHtml(checklist.avariasInternas || 0)}</td> <!-- Internas -->
            <td class="text-center">
                <button type="button" class="action-btn edit-btn view-btn" title="Visualizar Detalhes">👁️</button> <!-- Botão visualizar -->
                <button type="button" class="action-btn delete-btn delete-row-btn" title="Excluir">🗑️</button> <!-- Botão excluir -->
            </td>
        `;
        // Adiciona a linha ao corpo da tabela
        tbody.appendChild(row);
        const viewButton = row.querySelector('.view-btn');
        const deleteButton = row.querySelector('.delete-row-btn');
        if (viewButton) viewButton.addEventListener('click', () => viewChecklistDetailsById(checklist.id));
        if (deleteButton) deleteButton.addEventListener('click', () => deleteChecklistById(checklist.id));
    });

    // Adiciona a tabela completa ao container
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

    // Cria modal com detalhes completos
    const modal = document.createElement('div');
    modal.className = 'detail-modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    // Usa safeSetInnerHTML para prevenir XSS
    safeSetInnerHTML(modal, `
        <div class="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div class="p-6 border-b border-gray-200">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-800">📋 Detalhes do Checklist</h2>
                    <button type="button" class="modal-close text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
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
                        <div><strong>Carreta:</strong> ${escapeHtml(formatValue(checklist.placaCarreta1))}</div>
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
                        ${Object.entries(checklist.hygiene || {}).map(([key, value]) => 
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
                <div class="bg-yellow-50 p-4 rounded-lg">
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
// Configura os ouvintes para as abas de filtro
document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        // Remove classe active de todas as abas
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        // Adiciona classe active na aba clicada
        this.classList.add('active');
        // Atualiza o filtro atual
        currentFilter = this.dataset.filter;
        // Re-renderiza a tabela
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
    showAuthenticatedAdmin();
});
