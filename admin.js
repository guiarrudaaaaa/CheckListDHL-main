// ===== CONFIGURAÇÃO DO RELÓGIO AO VIVO =====
// Atualiza o relógio no cabeçalho a cada segundo com formato brasileiro
function updateClock() {
    // Obtém a hora atual
    const now = new Date();
    // Formata a hora em português brasileiro (HH:MM:SS)
    const time = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    // Atualiza o elemento HTML com o horário
    document.getElementById('liveTime').textContent = time;
}
// Inicia o relógio e atualiza a cada 1000ms (1 segundo)
setInterval(updateClock, 1000);
updateClock(); // Chama imediatamente para evitar delay inicial

async function carregarRelatorio() {
    if (!window.firebaseDb || !window.firebaseCollection || !window.firebaseGetDocs || !window.firebaseQuery || !window.firebaseOrderBy) {
        console.error('Firebase não está inicializado no painel admin.');
        return;
    }

    try {
        // 🔥 OTIMIZAÇÃO: Limita a 100 documentos mais recentes para reduzir custos
        const checklistsRef = window.firebaseCollection(window.firebaseDb, 'checklists');
        const q = window.firebaseQuery(
            checklistsRef,
            window.firebaseOrderBy('createdAt', 'desc')
            // limit(100) // Descomente se quiser limitar ainda mais
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

        // 🔥 OTIMIZAÇÃO: Só atualiza métricas se houver dados novos
        if (allChecklists.length > 0) {
            updateMetrics();
            renderTable();
        }

        const lista = document.getElementById('lista-nomes');
        if (lista) {
            lista.innerHTML = '';
            // 🔥 OTIMIZAÇÃO: Limita lista a 20 entradas recentes
            allChecklists.slice(0, 20).forEach(item => {
                const li = document.createElement('li');
                li.className = 'checkin-item';
                li.innerHTML = `
                    <div class="checkin-item-top">
                        <span class="checkin-item-type">${item.operationType === 'IN' ? '📥 INBOUND' : '📤 OUTBOUND'}</span>
                        <span class="checkin-item-time">${formatValue(item.checkinTime)}</span>
                    </div>
                    <div class="checkin-item-body">
                        <strong>${formatValue(item.driverName)}</strong>
                        <span>${formatValue(item.dtNumber)}</span>
                        <span>${formatValue(item.placaCavalo)}</span>
                    </div>
                `;
                lista.appendChild(li);
            });
        }
    } catch (err) {
        console.error('Erro ao carregar relatório Firebase:', err);
    }
}

// ===== SEGURANÇA E SANITIZAÇÃO =====
// Função para sanitizar entrada de texto (remove tags HTML e caracteres perigosos)
function sanitizeText(input) {
    if (typeof input !== 'string') return '';
    return input.replace(/[<>'"&]/g, '').trim();
}

// Função para sanitizar HTML gerado dinamicamente
function safeSetInnerHTML(element, html) {
    if (!element || typeof html !== 'string') return;
    // Remove qualquer script ou event handler
    const sanitized = html.replace(/<script[^>]*>.*?<\/script>/gi, '')
                         .replace(/on\w+="[^"]*"/gi, '')
                         .replace(/javascript:/gi, '');
    element.innerHTML = sanitized;
}

// Função para validar dados carregados do Firestore
function validateChecklistData(data) {
    if (!Array.isArray(data)) return [];
    return data.filter(item => {
        // Valida estrutura básica
        if (typeof item !== 'object' || !item) return false;
        // Sanitiza campos de texto
        if (item.dtNumber) item.dtNumber = sanitizeText(item.dtNumber);
        if (item.driverName) item.driverName = sanitizeText(item.driverName);
        if (item.placaCavalo) item.placaCavalo = sanitizeText(item.placaCavalo);
        if (item.placaCarreta1) item.placaCarreta1 = sanitizeText(item.placaCarreta1);
        if (item.transportadora) item.transportadora = sanitizeText(item.transportadora);
        if (item.observations) item.observations = sanitizeText(item.observations);
        return true;
    });
}

// ===== GERENCIAMENTO DE DADOS =====
// Variáveis globais para controlar filtros e armazenar checklists
let currentFilter = 'todos'; // Filtro atual aplicado ('todos', 'inbound', 'outbound')
let allChecklists = []; // Array que armazena todos os checklists carregados

// ===== CARREGAMENTO DE CHECKLISTS =====
// Carrega os checklists do Firebase
async function loadChecklists() {
    await carregarRelatorio();
}

// ===== ATUALIZAÇÃO DE MÉTRICAS =====
// Calcula e atualiza os valores exibidos nos cards de métricas
function updateMetrics() {
    // Conta operações inbound (IN)
    const inCount = allChecklists.filter(c => String(c.operationType || '').toUpperCase() === 'IN').length;
    // Conta operações outbound (OUT)
    const outCount = allChecklists.filter(c => String(c.operationType || '').toUpperCase() === 'OUT').length;
    // Conta docas únicas em uso (remove duplicatas)
    const totalDoca = new Set(allChecklists.filter(c => c.doca && c.doca !== '').map(c => String(c.doca).toUpperCase())).size;
    // Total de pallets usados em todos os checklists
    const totalPbr = allChecklists.reduce((sum, item) => sum + (parseInt(item.totalPbr || item.totalPBR || 0, 10) || 0), 0);
    // Total de registros
    const totalRegistros = allChecklists.length;

    // Atualiza os elementos HTML dos cards
    const totalRegistrosEl = document.getElementById('totalRegistros');
    const totalDocasEl = document.getElementById('totalDocas');
    const inboundCountEl = document.getElementById('inboundCount');
    const outboundCountEl = document.getElementById('outboundCount');
    const totalPbrCountEl = document.getElementById('totalPbrCount');

    if (totalRegistrosEl) totalRegistrosEl.textContent = totalRegistros;
    if (totalDocasEl) totalDocasEl.textContent = totalDoca;
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
        const opType = formatValue(checklist.operationType);
        // Define emoji baseado no tipo
        const opEmoji = opType === 'IN' ? '📥' : (opType === 'OUT' ? '📤' : '❓');
        // Define classe do badge
        const badgeClass = opType === 'IN' ? 'badge-in' : (opType === 'OUT' ? 'badge-out' : '');

        // Define o HTML da linha com todas as colunas
        row.innerHTML = `
            <td>
                <div class="status-cell">
                    <span>${opEmoji}</span> <!-- Emoji do tipo -->
                    <span class="badge ${badgeClass}">${opType}</span> <!-- Badge com tipo -->
                </div>
            </td>
            <td class="text-bold">${formatValue(checklist.driverName)}</td> <!-- Motorista -->
            <td class="text-bold">${formatValue(checklist.placaCavalo)}</td> <!-- Cavalo -->
            <td class="text-bold">${formatValue(checklist.placaCarreta1)}</td> <!-- Carreta -->
            <td class="text-center"><span class="badge badge-doca">${formatValue(checklist.doca)}</span></td> <!-- Doca -->
            <td class="text-bold">${formatValue(checklist.dtNumber)}</td> <!-- DT -->
            <td class="text-bold">⏰ ${formatValue(checklist.checkinTime)}</td> <!-- Check-in -->
            <td class="text-bold">${formatValue(checklist.transportadora)}</td> <!-- Transportadora -->
            <td class="text-bold text-center" style="color: #D40511;">${checklist.totalFardos || 0}</td> <!-- Total fardos -->
            <td class="text-bold text-center" style="color: #D40511;">${checklist.avariados || 0}</td> <!-- Avariados -->
            <td class="text-bold text-center" style="color: #D40511;">${checklist.scrap || 0}</td> <!-- Scrap -->
            <td class="text-bold text-center" style="color: #D40511;">${checklist.avariasInternas || 0}</td> <!-- Internas -->
            <td class="text-center">
                <button onclick="viewChecklistDetails(${globalIndex})" class="action-btn edit-btn" title="Visualizar Detalhes">👁️</button> <!-- Botão visualizar -->
                <button onclick="deleteChecklist(${globalIndex})" class="action-btn delete-btn" title="Excluir">🗑️</button> <!-- Botão excluir -->
            </td>
        `;
        // Adiciona a linha ao corpo da tabela
        tbody.appendChild(row);
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
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
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
                        <div><strong>DT:</strong> ${formatValue(checklist.dtNumber)}</div>
                        <div><strong>Motorista:</strong> ${formatValue(checklist.driverName)}</div>
                        <div><strong>Cavalo:</strong> ${formatValue(checklist.placaCavalo)}</div>
                        <div><strong>Carreta:</strong> ${formatValue(checklist.placaCarreta1)}</div>
                        <div><strong>Doca:</strong> ${formatValue(checklist.doca)}</div>
                        <div><strong>Transportadora:</strong> ${formatValue(checklist.transportadora)}</div>
                        <div><strong>Check-in:</strong> ${formatValue(checklist.checkinTime)}</div>
                        <div><strong>Origem:</strong> ${formatValue(checklist.origem)}</div>
                    </div>
                </div>

                <!-- Higiene -->
                <div class="bg-green-50 p-4 rounded-lg">
                    <h3 class="font-bold text-lg mb-3">🧼 Higiene e Estrutura</h3>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                        ${Object.entries(checklist.hygiene || {}).map(([key, value]) => 
                            `<div class="flex justify-between items-center p-2 bg-white rounded border">
                                <span class="text-sm">${key}</span>
                                <span class="font-bold ${value === 'C' ? 'text-green-600' : 'text-red-600'}">${value}</span>
                            </div>`
                        ).join('')}
                    </div>
                </div>

                ${hygieneNote ? `
                <div class="bg-purple-50 p-4 rounded-lg">
                    <h3 class="font-bold text-lg mb-3">📝 Observação de Higiene e Estrutura</h3>
                    <p class="text-gray-700">${hygieneNote}</p>
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
                                        <td class="border border-gray-300 p-2">${item.code || ''}</td>
                                        <td class="border border-gray-300 p-2 text-center">${item.previsto || 0}</td>
                                        <td class="border border-gray-300 p-2 text-center">${item.realizado || 0}</td>
                                        <td class="border border-gray-300 p-2 text-center text-red-600">${item.faltas || 0}</td>
                                        <td class="border border-gray-300 p-2 text-center text-green-600">${item.sobras || 0}</td>
                                        <td class="border border-gray-300 p-2 text-center">${item.avarias || 0}</td>
                                        <td class="border border-gray-300 p-2 text-center">${item.scrap || 0}</td>
                                        <td class="border border-gray-300 p-2 text-center">${item.avariasInternas || 0}</td>
                                        <td class="border border-gray-300 p-2 text-center font-bold">${item.bons || 0}</td>
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
                    <p class="text-gray-700">${checklist.observations}</p>
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
                                            <td class="border border-gray-300 p-2">${row.code || '—'}</td>
                                            <td class="border border-gray-300 p-2 text-right">${row.count || 0}</td>
                                            <td class="border border-gray-300 p-2 text-right">${row.per || 0}</td>
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
        await loadChecklists();
    } catch (err) {
        console.error('Erro ao excluir registro do Firebase:', err);
        alert('Erro ao excluir o registro. Tente novamente.');
    }
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

// Ouvinte para o botão "Exportar Excel"
document.getElementById('exportBtn').addEventListener('click', () => {
    // Verifica se há registros para exportar
    if (allChecklists.length === 0) {
        alert('Nenhum registro para exportar');
        return;
    }

    // Cria cabeçalho do CSV
    let csv = 'DT,MOTORISTA,CAVALO,CARRETA,DOCA,CHECK-IN,TRANSPORTADORA,TOTAL_FARDOS,AVARIADOS,SCRAP\n';
    // Adiciona cada registro ao CSV
    allChecklists.forEach(c => {
        const dt = formatValue(c.dtNumber);
        const motorista = formatValue(c.driverName);
        const cavalo = formatValue(c.placaCavalo);
        const carreta = formatValue(c.placaCarreta1);
        const doca = formatValue(c.doca);
        const checkin = formatValue(c.checkinTime);
        const transp = formatValue(c.transportadora);
        const fardos = c.totalFardos || 0;
        const avar = c.avariados || 0;
        const scrap = c.scrap || 0;

        csv += `${dt},${motorista},${cavalo},${carreta},${doca},${checkin},${transp},${fardos},${avar},${scrap}\n`;
    });

    // Cria blob com o conteúdo CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    // Cria URL para o blob
    const url = URL.createObjectURL(blob);
    // Cria elemento de link para download
    const a = document.createElement('a');
    a.href = url;
    a.download = `checklists_${new Date().toISOString().split('T')[0]}.csv`; // Nome do arquivo com data
    // Dispara o download
    a.click();
});

// ===== INICIALIZAÇÃO =====
// Carrega dados iniciais ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    loadChecklists();
    // Configura atualização automática do dashboard e do relatório
    setInterval(loadChecklists, 3000);
    setInterval(carregarRelatorio, 10000);
});
