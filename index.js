// ===== CONFIGURAÇÃO DO RELÓGIO AO VIVO =====
// Atualiza o relógio no cabeçalho a cada segundo
function updateClock() {
    // Obtém a hora atual formatada em português brasileiro
    document.getElementById('liveClock').innerText = new Date().toLocaleTimeString('pt-BR');
}
// Inicia o relógio e atualiza a cada 1000ms (1 segundo)
setInterval(updateClock, 1000);
updateClock(); // Chama imediatamente para evitar delay inicial

function resizeSignatureCanvas(canvas) {
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    canvas.dataset.drawn = canvas.dataset.drawn || 'false';
}

function clearSignature(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.dataset.drawn = 'false';
    resizeSignatureCanvas(canvas);
}

function isCanvasBlank(canvas) {
    return !canvas || canvas.dataset.drawn !== 'true';
}

function getSignatureData(canvas) {
    return canvas && !isCanvasBlank(canvas) ? canvas.toDataURL('image/png') : '';
}

function initSignatureCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    resizeSignatureCanvas(canvas);

    let drawing = false;
    let lastX = 0;
    let lastY = 0;

    const getPointerPosition = event => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    };

    const startDraw = event => {
        event.preventDefault();
        drawing = true;
        const pos = getPointerPosition(event);
        lastX = pos.x;
        lastY = pos.y;
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(lastX, lastY, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
        canvas.dataset.drawn = 'true';
        canvas.setPointerCapture(event.pointerId);
    };

    const draw = event => {
        if (!drawing) return;
        event.preventDefault();
        const pos = getPointerPosition(event);
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        lastX = pos.x;
        lastY = pos.y;
        canvas.dataset.drawn = 'true';
    };

    const stopDraw = event => {
        drawing = false;
        if (event.pointerId) {
            canvas.releasePointerCapture(event.pointerId);
        }
    };

    canvas.addEventListener('pointerdown', startDraw);
    canvas.addEventListener('pointermove', draw);
    canvas.addEventListener('pointerup', stopDraw);
    canvas.addEventListener('pointercancel', stopDraw);
    canvas.addEventListener('pointerleave', stopDraw);
}


// ===== SEGURANÇA E SANITIZAÇÃO =====
// Função para sanitizar entrada de texto (remove tags HTML e caracteres perigosos)
function sanitizeText(input) {
    if (typeof input !== 'string') return '';
    return input.replace(/[<>'"&]/g, '').trim();
}

// Função para validar entrada numérica
function sanitizeNumber(input) {
    if (typeof input !== 'string') return '0';
    const cleaned = input.replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? '0' : num.toString();
}

// Função para validar e sanitizar entrada antes de salvar
function secureInputValidation() {
    // Sanitiza campos de texto
    const textInputs = document.querySelectorAll('input[type="text"], textarea');
    textInputs.forEach(input => {
        input.value = sanitizeText(input.value);
    });

    // Valida campos numéricos
    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
        const originalValue = input.value;
        const sanitized = sanitizeNumber(originalValue);
        if (originalValue !== sanitized) {
            console.warn(`Campo numérico sanitizado: ${originalValue} -> ${sanitized}`);
            input.value = sanitized;
        }
    });

    return true;
}

function showFormAlert(type, message) {
    const alertBox = document.getElementById('formAlert');
    if (!alertBox) return;
    alertBox.className = 'form-alert';
    alertBox.classList.add(type === 'success' ? 'form-alert-success' : 'form-alert-error');
    alertBox.innerHTML = '<span class="form-alert-icon">' + (type === 'success' ? '✓' : '!') + '</span><span>' + message + '</span>';
    alertBox.classList.remove('hidden', 'form-alert-hidden');
    alertBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function clearFormAlert() {
    const alertBox = document.getElementById('formAlert');
    if (!alertBox) return;
    alertBox.className = 'form-alert hidden';
    alertBox.textContent = '';
}

// Função para prevenir XSS em elementos dinâmicos
function safeSetInnerHTML(element, html) {
    if (!element || typeof html !== 'string') return;
    // Remove qualquer script ou event handler
    const sanitized = html.replace(/<script[^>]*>.*?<\/script>/gi, '')
                         .replace(/on\w+="[^"]*"/gi, '')
                         .replace(/javascript:/gi, '');
    element.innerHTML = sanitized;
}

// ===== GERAÇÃO DINÂMICA DO GRID DE HIGIENE =====
// Define os critérios de higiene que serão exibidos
const criteria = ["Paredes Internas", "Sem Furos", "Teto", "Chão Limpo", "Sem Odor", "Sem Pragas"];
// Seleciona o container onde os critérios serão inseridos
const hygieneGrid = document.getElementById('hygieneGrid');
// Para cada critério, cria um elemento HTML com botões C/NC
criteria.forEach(item => {
    // Cria um div para cada item
    const div = document.createElement('div');
    // Adiciona classes CSS para estilização
    div.className = "flex items-center justify-between p-4 bg-slate-200 rounded-xl border border-slate-300 shadow-sm";
    // Define o HTML interno com rótulos e botões radio
    div.innerHTML = `<span class="text-[9px] font-black text-slate-700 uppercase">${item}</span>
        <div class="flex gap-2">
            <input type="radio" name="${item}" id="${item}c" class="hidden peer/c" checked> <!-- Radio para "C" (checked por padrão) -->
            <label for="${item}c" class="w-8 h-8 flex items-center justify-center bg-green-500 border border-green-600 rounded-lg peer-checked/c:bg-green-600 peer-checked/c:text-white text-[10px] font-bold cursor-pointer text-white">C</label> <!-- Label estilizado para "C" -->
            <input type="radio" name="${item}" id="${item}nc" class="hidden peer/nc"> <!-- Radio para "NC" -->
            <label for="${item}nc" class="w-8 h-8 flex items-center justify-center bg-slate-300 border border-slate-400 rounded-lg peer-checked/nc:bg-red-600 peer-checked/nc:border-red-700 peer-checked/nc:text-white text-[10px] font-bold cursor-pointer">NC</label> <!-- Label estilizado para "NC" -->
        </div>`;
    // Adiciona o div ao container
    hygieneGrid.appendChild(div);
});

// ===== GERENCIAMENTO DE ITENS =====
// Função para adicionar uma nova linha na tabela de itens
function addItemRow() {
    // Seleciona o corpo da tabela
    const tbody = document.getElementById('itemTableBody');
    // Cria um novo elemento tr (linha)
    const tr = document.createElement('tr');
    // Adiciona classe para hover
    tr.className = "hover:bg-slate-50";
    // Define o HTML da linha com inputs para cada coluna
    tr.innerHTML = `
        <td><input type="number" class="table-input val-item-code text-center" placeholder="Cód." min="0" step="1" required></td> <!-- Código do item -->
        <td class="bg-blue-50/30"><input type="number" class="table-input val-previsto text-center" value="" min="0" step="1" required></td> <!-- Quantidade prevista -->
        <td class="bg-blue-50/30"><input type="number" class="table-input val-realizado text-center" value="" min="0" step="1" required></td> <!-- Quantidade realizada -->
        <td><input type="number" class="table-input text-red-600 res-falta text-center" value="0" readonly></td> <!-- Faltas (calculada) -->
        <td><input type="number" class="table-input text-green-600 res-sobra text-center" value="0" readonly></td> <!-- Sobras (calculada) -->
        <td><input type="number" class="table-input val-avaria text-center" value="" min="0" step="1" required></td> <!-- Avarias -->
        <td><input type="number" class="table-input val-scrap text-center" value="" min="0" step="1" required></td> <!-- Scrap -->
        <td><input type="number" class="table-input val-avint text-center" value="" min="0" step="1" required></td> <!-- Avarias internas -->
        <td class="bg-slate-100"><input type="number" class="table-input font-black res-bons text-center" value="0" readonly></td> <!-- Total bons (calculada) -->
        <td class="text-center"><button type="button" class="text-slate-300 hover:text-red-500 font-bold">✕</button></td> <!-- Botão remover -->
    `;

    // Adiciona a linha ao corpo da tabela
    tbody.appendChild(tr);

    const inputs = tr.querySelectorAll('.val-previsto, .val-realizado, .val-avaria, .val-scrap, .val-avint');
    inputs.forEach(input => {
        input.addEventListener('input', () => audit(input));
        input.addEventListener('change', () => audit(input));
    });

    const removeButton = tr.querySelector('button');
    if (removeButton) {
        removeButton.addEventListener('click', () => {
            tr.remove();
            auditAll();
        });
    }

    const firstInput = tr.querySelector('.val-item-code');
    if (firstInput) firstInput.focus();
}

function addPalletRow(bodyId) {
    const tbody = document.getElementById(bodyId);
    if (!tbody) return;

    const tr = document.createElement('tr');
    tr.className = 'border-b border-muted';
    tr.innerHTML = `
        <td class="py-3 pl-4"><input type="number" class="input-field val-pallet-code text-right" placeholder="CÓD" min="0" step="1" oninput="numericOnly(this)"></td>
        <td class="py-3 pr-4"><input type="number" class="input-field val-pallet-count text-right" placeholder="Fardos Totais" min="0" step="1" oninput="numericOnly(this)"></td>
        <td class="py-3 pr-4"><input type="number" class="input-field val-pallet-per text-right" placeholder="Fardos / Pallet" min="0" step="1" oninput="numericOnly(this)"></td>
        <td class="text-center"><button type="button" onclick="removePalletRow(this)" class="text-slate-300 hover:text-red-500 font-bold">✕</button></td>
    `;
    tbody.appendChild(tr);
}

function removePalletRow(button) {
    const row = button?.closest('tr');
    if (!row) return;
    const tbody = row.parentElement;
    row.remove();
    if (tbody.children.length === 0) {
        addPalletRow(tbody.id);
    }
}

// ===== FUNÇÕES DE AUDITORIA =====
// Função para calcular faltas, sobras e totais para uma linha específica
function audit(el) {
    // Seleciona a linha do elemento
    const row = el.parentElement.parentElement;
    // Obtém os valores dos inputs
    const prevInput = row.querySelector('.val-previsto');
    const realInput = row.querySelector('.val-realizado');
    const avInput = row.querySelector('.val-avaria');
    const scInput = row.querySelector('.val-scrap');
    const aiInput = row.querySelector('.val-avint');

    const prev = prevInput && prevInput.value.trim() !== '' ? parseFloat(prevInput.value) || 0 : null;
    const real = realInput && realInput.value.trim() !== '' ? parseFloat(realInput.value) || 0 : null;
    const av = avInput && avInput.value.trim() !== '' ? parseFloat(avInput.value) || 0 : 0;
    const sc = scInput && scInput.value.trim() !== '' ? parseFloat(scInput.value) || 0 : 0;
    const ai = aiInput && aiInput.value.trim() !== '' ? parseFloat(aiInput.value) || 0 : 0;

    if (prev === null || real === null) {
        row.querySelector('.res-falta').value = 0;
        row.querySelector('.res-sobra').value = 0;
        row.querySelector('.res-bons').value = 0;
        auditAll();
        return;
    }

    // Calcula a diferença (positivo = sobra, negativo = falta)
    const diff = real - prev;
    // Define o valor de faltas (absoluto se negativo)
    row.querySelector('.res-falta').value = diff < 0 ? Math.abs(diff) : 0;
    // Define o valor de sobras (se positivo) - não são contabilizadas nos bons
    row.querySelector('.res-sobra').value = diff > 0 ? diff : 0;
    // Calcula total de itens bons: REALIZADO menos as perdas (avarias, scrap, av.int.)
    // Sobras não afetam o total bons, apenas faltas e perdas.
    const bons = real - (av + sc + ai);
    row.querySelector('.res-bons').value = bons > 0 ? bons : 0;
    // Atualiza os totais gerais
    auditAll();
}

// Função para calcular os totais gerais de todas as linhas
function auditAll() {
    // Soma todas as faltas
    let f = 0;
    document.querySelectorAll('.res-falta').forEach(i => f += parseFloat(i.value) || 0);
    // Soma todas as sobras
    let s = 0;
    document.querySelectorAll('.res-sobra').forEach(i => s += parseFloat(i.value) || 0);
    // Soma todos os valores realizados para entrada
    let b = 0;
    document.querySelectorAll('.val-realizado').forEach(i => b += parseFloat(i.value) || 0);
    // Atualiza os elementos HTML com os totais
    document.getElementById('totalFaltas').innerText = f;
    document.getElementById('totalSobra').innerText = s;
    document.getElementById('totalBonsGeral').innerText = b;
}

function numericOnly(el) {
    if (!el) return;
    el.value = el.value.replace(/\D+/g, '');
}

function validateChecklist() {
    const form = document.getElementById('mainChecklist');
    if (!form.checkValidity()) {
        form.reportValidity();
        return false;
    }

    const rows = document.querySelectorAll('#itemTableBody tr');
    if (rows.length === 0) {
        showFormAlert('error', 'Adicione pelo menos um item na conferência técnica.');
        return false;
    }

    for (const row of rows) {
        const code = row.querySelector('.val-item-code');
        if (!code || code.value.trim() === '') {
            showFormAlert('error', 'Preencha o código numérico de todos os itens da conferência técnica.');
            return false;
        }
        const numbers = row.querySelectorAll('input[type="number"]');
        for (const input of numbers) {
            if (input.required && input.value.trim() === '') {
                showFormAlert('error', 'Preencha todos os campos numéricos da conferência técnica.');
                return false;
            }
            if (input.value.trim() !== '' && Number.isNaN(Number(input.value))) {
                showFormAlert('error', 'Use apenas números nos campos numéricos da conferência técnica.');
                return false;
            }
        }
    }

    const totalPbrInput = document.getElementById('totalPbrInput');
    if (!totalPbrInput || totalPbrInput.value.trim() === '' || Number.isNaN(Number(totalPbrInput.value))) {
        showFormAlert('error', 'Preencha o total de pallets utilizados com um número válido.');
        return false;
    }

    const driverCanvas = document.getElementById('driverSignatureCanvas');
    const checkerCanvas = document.getElementById('checkerSignatureCanvas');
    if (isCanvasBlank(driverCanvas) || isCanvasBlank(checkerCanvas)) {
        showFormAlert('error', 'Por favor, assine no quadro do motorista e do conferente antes de finalizar.');
        return false;
    }

    return true;
}

// ===== INICIALIZAÇÃO =====
// Adiciona uma linha inicial de item ao carregar a página
addItemRow();

initSignatureCanvas('driverSignatureCanvas');
initSignatureCanvas('checkerSignatureCanvas');

document.addEventListener('DOMContentLoaded', () => {
    loadChecklists();
});

// ===== SALVAMENTO DO CHECKLIST =====
// Função para salvar o checklist no Firebase Firestore
async function saveChecklist(event) {
    event.preventDefault();

    clearFormAlert();
    if (!secureInputValidation()) {
        showFormAlert('error', 'Erro de validação de segurança. Verifique os dados inseridos.');
        return;
    }

    if (!validateChecklist()) {
        return;
    }

    const operationType = document.getElementById('operationTypeSelect').value;

    const checklistData = {
        operationType: operationType === 'INBOUND' ? 'IN' : 'OUT',
        dtNumber: document.getElementById('dtNumberInput')?.value || '',
        driverName: document.getElementById('driverNameInput')?.value || '',
        origem: document.getElementById('origemInput')?.value || '',
        placaCavalo: document.getElementById('placaCavaloInput')?.value || '',
        placaCarreta1: document.getElementById('placaCarreta1Input')?.value || '',
        placaCarreta2: document.getElementById('placaCarreta2Input')?.value || '',
        transportadora: document.getElementById('transportadoraInput')?.value || '',
        doca: document.getElementById('docaInput')?.value || '',
        palletsInbound: '0',
        palletsOutbound: '0',
        totalPbr: document.getElementById('totalPbrInput')?.value || '0',
        hygieneNote: document.getElementById('hygieneObservation')?.value.trim() || '',
        lacre1: document.getElementById('lacre1Input')?.value || '',
        lacre2: document.getElementById('lacre2Input')?.value || '',
        statusLacre: document.getElementById('statusLacreSelect')?.value || '',
        checkinTime: new Date().toLocaleString('pt-BR'),
        hygiene: {},
        items: [],
        totalFaltas: parseInt(document.getElementById('totalFaltas')?.innerText) || 0,
        totalSobra: parseInt(document.getElementById('totalSobra')?.innerText) || 0,
        totalBonsGeral: parseInt(document.getElementById('totalBonsGeral')?.innerText) || 0,
        observations: document.getElementById('cargoObservations')?.value || '',
        driverSignature: getSignatureData(document.getElementById('driverSignatureCanvas')),
        checkerSignature: getSignatureData(document.getElementById('checkerSignatureCanvas'))
    };

    const criteria = ["Paredes Internas", "Sem Furos", "Teto", "Chão Limpo", "Sem Odor", "Sem Pragas"];
    criteria.forEach(item => {
        const selected = document.querySelector(`input[name="${item}"]:checked`);
        checklistData.hygiene[item] = selected ? (selected.id.endsWith('nc') ? 'NC' : 'C') : 'N/A';
    });

    const itemRows = document.querySelectorAll('#itemTableBody tr');
    itemRows.forEach(row => {
        const item = {
            code: row.querySelector('.val-item-code')?.value || '',
            previsto: parseInt(row.querySelector('.val-previsto')?.value) || 0,
            realizado: parseInt(row.querySelector('.val-realizado')?.value) || 0,
            faltas: parseInt(row.querySelector('.res-falta')?.value) || 0,
            sobras: parseInt(row.querySelector('.res-sobra')?.value) || 0,
            avarias: parseInt(row.querySelector('.val-avaria')?.value) || 0,
            scrap: parseInt(row.querySelector('.val-scrap')?.value) || 0,
            avariasInternas: parseInt(row.querySelector('.val-avint')?.value) || 0,
            bons: parseInt(row.querySelector('.res-bons')?.value) || 0
        };
        checklistData.items.push(item);
    });

    checklistData.totalFardos = checklistData.items.reduce((sum, item) => sum + item.previsto, 0);
    checklistData.avariados = checklistData.items.reduce((sum, item) => sum + item.avarias, 0);
    checklistData.scrap = checklistData.items.reduce((sum, item) => sum + item.scrap, 0);
    checklistData.avariasInternas = checklistData.items.reduce((sum, item) => sum + item.avariasInternas, 0);
    checklistData.palletRows = [];

    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.add('opacity-70', 'cursor-not-allowed');
        submitButton.innerText = 'Enviando...';
    }

    try {
        if (!window.firebaseDb || !window.firebaseAddDoc || !window.firebaseCollection) {
            throw new Error('Firebase não está inicializado.');
        }

        await window.firebaseAddDoc(
            window.firebaseCollection(window.firebaseDb, 'checklists'),
            {
                ...checklistData,
                createdAt: window.firebaseServerTimestamp ? window.firebaseServerTimestamp() : new Date()
            }
        );

        showFormAlert('success', 'Checklist enviado para o painel admin com sucesso!');
        document.getElementById('mainChecklist').reset();
        clearSignature('driverSignatureCanvas');
        clearSignature('checkerSignatureCanvas');
        auditAll();
    } catch (error) {
        console.error('Erro ao enviar dados para o painel:', error);
        showFormAlert('error', 'Erro ao enviar o relatório para o painel admin. Verifique a conexão e tente novamente.');
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.classList.remove('opacity-70', 'cursor-not-allowed');
            submitButton.innerText = 'Finalizar Checklist Operacional';
        }
    }
}


// ===== CONFIGURAÇÃO DO EVENT LISTENER =====

// O formulário já chama saveChecklist() via onsubmit no HTML.
