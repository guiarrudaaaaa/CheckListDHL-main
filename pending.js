/**
 * =============================================
 * MÓDULO DE PENDÊNCIAS — CheckList DHL
 * =============================================
 * Controla o status de cada seção em tempo real.
 * O botão de finalizar só habilita quando tudo estiver verde.
 *
 * Regras por seção:
 *  01 - Identificação : todos os campos required preenchidos
 *  02 - Higiene       : todos os critérios marcados; se houver NC → observação obrigatória
 *  03 - Conf. Técnica : pelo menos 1 item, todos os campos preenchidos (só INBOUND)
 *  04 - Pallets       : campo totalPbrInput preenchido
 *  05 - Observações   : livre (sempre OK, campo opcional)
 *  06 - Fotos         : pelo menos 1 foto anexada
 *  07 - Assinaturas   : lacre 01, status lacre, assinatura motorista e conferente
 */
(function () {
    'use strict';

    /* ── IDs das seções na ordem do formulário ── */
    const SECTION_IDS = [
        'identificationSection',
        'hygieneSection',
        'technicalConferenceSection',
        'palletsSection',
        'observationsSection',
        'photosSection',
        'signaturesSection',
    ];

    /* ── Rótulos amigáveis para o painel de pendências ── */
    const SECTION_LABELS = {
        identificationSection:      '01 · Identificação Geral',
        hygieneSection:             '02 · Higiene e Estrutura',
        technicalConferenceSection: '03 · Conferência Técnica',
        palletsSection:             '04 · Pallets',
        observationsSection:        '05 · Observações',
        photosSection:              '06 · Fotos',
        signaturesSection:          '07 · Assinaturas',
    };

    /* ── Estado dos ícones de badge ── */
    const BADGE = {
        pending:    { emoji: '🔴', cls: 'pending-badge--red',    title: 'Pendente'    },
        incomplete: { emoji: '🟡', cls: 'pending-badge--yellow', title: 'Incompleto'  },
        done:       { emoji: '🟢', cls: 'pending-badge--green',  title: 'Concluído'   },
        skipped:    { emoji: '⚪', cls: 'pending-badge--grey',   title: 'N/A'         },
    };

    /* ──────────────────────────────────────────
       INJEÇÃO DE ESTILOS
    ────────────────────────────────────────── */
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* ── Barra de progresso fixa no topo ── */
            #pendingProgressBar {
                position: sticky;
                top: 0;
                z-index: 50;
                background: #fff;
                border-bottom: 2px solid #e5e7eb;
                padding: 10px 24px;
                display: flex;
                align-items: center;
                gap: 12px;
                flex-wrap: wrap;
                box-shadow: 0 2px 8px rgba(0,0,0,.08);
            }
            #pendingProgressBar .ppb-title {
                font-size: 10px;
                font-weight: 900;
                text-transform: uppercase;
                color: #111;
                letter-spacing: .05em;
                white-space: nowrap;
            }
            #pendingProgressBar .ppb-track {
                flex: 1;
                min-width: 120px;
                height: 8px;
                background: #e5e7eb;
                border-radius: 99px;
                overflow: hidden;
            }
            #pendingProgressBar .ppb-fill {
                height: 100%;
                border-radius: 99px;
                background: linear-gradient(90deg, #d40511, #ffcc00);
                transition: width .4s ease;
            }
            #pendingProgressBar .ppb-count {
                font-size: 11px;
                font-weight: 800;
                color: #d40511;
                white-space: nowrap;
            }
            #pendingProgressBar .ppb-badges {
                display: flex;
                gap: 6px;
                flex-wrap: wrap;
            }
            .pending-badge {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                font-size: 9px;
                font-weight: 800;
                text-transform: uppercase;
                padding: 3px 8px;
                border-radius: 99px;
                border: 1.5px solid transparent;
                cursor: default;
                transition: background .25s, border-color .25s;
                white-space: nowrap;
            }
            .pending-badge--red    { background:#fee2e2; border-color:#fca5a5; color:#b91c1c; }
            .pending-badge--yellow { background:#fef9c3; border-color:#fde047; color:#854d0e; }
            .pending-badge--green  { background:#dcfce7; border-color:#86efac; color:#166534; }
            .pending-badge--grey   { background:#f3f4f6; border-color:#d1d5db; color:#6b7280; }

            /* ── Anel de status no cabeçalho de cada seção ── */
            .section-status-ring {
                width: 14px;
                height: 14px;
                border-radius: 50%;
                border: 2.5px solid #d1d5db;
                background: #fff;
                transition: border-color .25s, background .25s;
                flex-shrink: 0;
            }
            .section-status-ring.ring--red    { border-color:#ef4444; background:#fef2f2; }
            .section-status-ring.ring--yellow { border-color:#eab308; background:#fefce8; }
            .section-status-ring.ring--green  { border-color:#22c55e; background:#f0fdf4; }

            /* ── Painel de pendências abaixo do botão submit ── */
            #pendingPanel {
                margin-top: 16px;
                background: #fff5f5;
                border: 2px solid #fca5a5;
                border-radius: 16px;
                padding: 16px 20px;
                display: none;
            }
            #pendingPanel.visible { display: block; }
            #pendingPanel .pp-title {
                font-size: 11px;
                font-weight: 900;
                color: #b91c1c;
                text-transform: uppercase;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            #pendingPanel ul {
                list-style: none;
                padding: 0;
                margin: 0;
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            #pendingPanel ul li {
                font-size: 11px;
                font-weight: 700;
                color: #7f1d1d;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            /* ── Botão submit bloqueado ── */
            .btn-submit.btn-locked {
                opacity: .45;
                cursor: not-allowed;
                pointer-events: none;
            }
            .btn-submit.btn-locked::after {
                content: ' 🔒';
            }
        `;
        document.head.appendChild(style);
    }

    /* ──────────────────────────────────────────
       CRIAÇÃO DO DOM
    ────────────────────────────────────────── */
    function buildProgressBar() {
        const bar = document.createElement('div');
        bar.id = 'pendingProgressBar';
        bar.innerHTML = `
            <span class="ppb-title">Progresso</span>
            <div class="ppb-track"><div class="ppb-fill" id="ppbFill" style="width:0%"></div></div>
            <span class="ppb-count" id="ppbCount">0 / 0</span>
            <div class="ppb-badges" id="ppbBadges"></div>
        `;
        /* Insere depois do header (navbar) */
        const header = document.querySelector('header');
        if (header && header.nextSibling) {
            header.parentNode.insertBefore(bar, header.nextSibling);
        } else {
            document.body.prepend(bar);
        }
    }

    function buildPendingPanel() {
        const submitBtn = document.querySelector('button[type="submit"]');
        if (!submitBtn) return;
        const panel = document.createElement('div');
        panel.id = 'pendingPanel';
        panel.innerHTML = `
            <div class="pp-title">⚠️ Pendências encontradas</div>
            <ul id="pendingList"></ul>
        `;
        submitBtn.parentNode.insertBefore(panel, submitBtn.nextSibling);
    }

    function injectSectionRings() {
        SECTION_IDS.forEach(id => {
            const section = document.getElementById(id);
            if (!section) return;
            const headerRow = section.querySelector('.flex.items-center.gap-3');
            if (!headerRow) return;
            const ring = document.createElement('span');
            ring.className = 'section-status-ring ring--red';
            ring.id = `ring-${id}`;
            headerRow.appendChild(ring);
        });
    }

    /* ──────────────────────────────────────────
       LÓGICA DE VALIDAÇÃO POR SEÇÃO
    ────────────────────────────────────────── */

    function checkIdentification() {
        const fields = ['operationTypeSelect','nfNumberInput','dtNumberInput','docaInput',
                        'driverNameInput','cpfCnhInput','transportadoraInput',
                        'placaCavaloInput','placaCarreta1Input','origemInput'];
        let filled = 0;
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el && el.value.trim() !== '') filled++;
        });
        if (filled === 0) return 'pending';
        if (filled < fields.length) return 'incomplete';
        return 'done';
    }

    function checkHygiene() {
        /* Todos os critérios devem estar marcados (C ou NC) */
        const criteria = ['paredes_internas','sem_furos','teto','chao_limpo','sem_odor','sem_pragas'];
        let markedCount = 0;
        let hasNC = false;

        criteria.forEach(key => {
            const checked = document.querySelector(`input[name="${key}"]:checked`);
            if (checked) {
                markedCount++;
                if (checked.id.endsWith('nc')) hasNC = true;
            }
        });

        const obs = (document.getElementById('hygieneObservation')?.value || '').trim();

        if (markedCount === 0) return 'pending';
        if (markedCount < criteria.length) return 'incomplete';
        /* Se tem NC, observação é obrigatória */
        if (hasNC && obs === '') return 'incomplete';
        return 'done';
    }

    function checkTechnicalConference() {
        /* Seção oculta em OUTBOUND — pula */
        const section = document.getElementById('technicalConferenceSection');
        if (!section || section.classList.contains('hidden')) return 'skipped';

        const rows = document.querySelectorAll('#itemTableBody tr');
        if (rows.length === 0) return 'pending';

        let allFilled = true;
        rows.forEach(row => {
            const inputs = row.querySelectorAll('input[type="number"]:not([readonly])');
            inputs.forEach(inp => {
                if (inp.value.trim() === '') allFilled = false;
            });
            const code = row.querySelector('.val-item-code');
            if (!code || code.value.trim() === '') allFilled = false;
        });

        return allFilled ? 'done' : 'incomplete';
    }

    function checkPallets() {
        const val = (document.getElementById('totalPbrInput')?.value || '').trim();
        if (val === '') return 'pending';
        return 'done';
    }

    function checkObservations() {
        /* Campo livre — sempre considerado OK */
        return 'done';
    }

    function checkPhotos() {
        /* Pelo menos 1 foto */
        if (typeof photoDataUrls !== 'undefined') {
            const hasPhoto = photoDataUrls.some(p => p && p !== '');
            return hasPhoto ? 'done' : 'pending';
        }
        /* Fallback: verificar previews no DOM */
        for (let i = 1; i <= 6; i++) {
            const preview = document.getElementById(`photoPreview${i}`);
            if (preview && preview.querySelector('img')) return 'done';
        }
        return 'pending';
    }

    function checkSignatures() {
        const lacre1 = (document.getElementById('lacre1Input')?.value || '').trim();
        const status = (document.getElementById('statusLacreSelect')?.value || '').trim();

        let filled = 0;
        let total = 4; // lacre1, statusLacre, assinMotorista, assinConferente

        if (lacre1 !== '') filled++;
        if (status !== '') filled++;

        /* Assinaturas — chama isCanvasBlank se disponível */
        const driverCanvas  = document.getElementById('driverSignatureCanvas');
        const checkerCanvas = document.getElementById('checkerSignatureCanvas');
        const driverSigned  = typeof isCanvasBlank === 'function' ? !isCanvasBlank(driverCanvas)  : driverCanvas?.dataset?.drawn === 'true';
        const checkerSigned = typeof isCanvasBlank === 'function' ? !isCanvasBlank(checkerCanvas) : checkerCanvas?.dataset?.drawn === 'true';

        if (driverSigned)  filled++;
        if (checkerSigned) filled++;

        if (filled === 0) return 'pending';
        if (filled < total) return 'incomplete';
        return 'done';
    }

    const VALIDATORS = {
        identificationSection:      checkIdentification,
        hygieneSection:             checkHygiene,
        technicalConferenceSection: checkTechnicalConference,
        palletsSection:             checkPallets,
        observationsSection:        checkObservations,
        photosSection:              checkPhotos,
        signaturesSection:          checkSignatures,
    };

    /* ──────────────────────────────────────────
       ATUALIZAÇÃO DO DOM
    ────────────────────────────────────────── */
    function updateUI(results) {
        const visibleSections = SECTION_IDS.filter(id => {
            if (id === 'technicalConferenceSection') return results[id] !== 'skipped';
            return true;
        });

        const total = visibleSections.length;
        const doneCount = visibleSections.filter(id => results[id] === 'done').length;

        /* Barra de progresso */
        const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
        const fill = document.getElementById('ppbFill');
        const count = document.getElementById('ppbCount');
        if (fill)  fill.style.width = pct + '%';
        if (count) count.textContent = `${doneCount} / ${total}`;

        /* Badges */
        const badgesEl = document.getElementById('ppbBadges');
        if (badgesEl) {
            badgesEl.innerHTML = '';
            SECTION_IDS.forEach(id => {
                const status = results[id];
                if (status === 'skipped') return;
                const b = BADGE[status];
                const badge = document.createElement('span');
                badge.className = `pending-badge ${b.cls}`;
                badge.title = SECTION_LABELS[id];
                badge.textContent = `${b.emoji} ${SECTION_LABELS[id].split('·')[0].trim()}`;
                badgesEl.appendChild(badge);
            });
        }

        /* Anéis nas seções */
        SECTION_IDS.forEach(id => {
            const ring = document.getElementById(`ring-${id}`);
            if (!ring) return;
            const status = results[id];
            ring.className = 'section-status-ring';
            if (status === 'pending')    ring.classList.add('ring--red');
            if (status === 'incomplete') ring.classList.add('ring--yellow');
            if (status === 'done')       ring.classList.add('ring--green');
            if (status === 'skipped')    ring.classList.add('ring--grey');
        });

        /* Painel de pendências e botão */
        const allDone = visibleSections.every(id => results[id] === 'done');
        const submitBtn = document.querySelector('button[type="submit"]');
        const panel = document.getElementById('pendingPanel');
        const list  = document.getElementById('pendingList');

        if (allDone) {
            if (submitBtn) submitBtn.classList.remove('btn-locked');
            if (panel)     panel.classList.remove('visible');
        } else {
            if (submitBtn) submitBtn.classList.add('btn-locked');
            if (panel && list) {
                list.innerHTML = '';
                visibleSections
                    .filter(id => results[id] !== 'done')
                    .forEach(id => {
                        const status = results[id];
                        const b = BADGE[status];
                        const li = document.createElement('li');
                        li.innerHTML = `<span>${b.emoji}</span><span>${SECTION_LABELS[id]} — ${b.title}</span>`;
                        list.appendChild(li);
                    });
                panel.classList.add('visible');
            }
        }
    }

    /* ──────────────────────────────────────────
       FUNÇÃO PRINCIPAL — roda a cada evento
    ────────────────────────────────────────── */
    function runChecks() {
        const results = {};
        SECTION_IDS.forEach(id => {
            results[id] = VALIDATORS[id] ? VALIDATORS[id]() : 'done';
        });
        updateUI(results);
    }

    /* ──────────────────────────────────────────
       REGISTRO DE EVENTOS
    ────────────────────────────────────────── */
    function attachListeners() {
        /* Formulário principal — input e change */
        const form = document.getElementById('mainChecklist');
        if (form) {
            form.addEventListener('input',  runChecks);
            form.addEventListener('change', runChecks);
        }

        /* Canvas de assinaturas — pointer up */
        ['driverSignatureCanvas','checkerSignatureCanvas'].forEach(id => {
            const canvas = document.getElementById(id);
            if (canvas) canvas.addEventListener('pointerup', runChecks);
        });

        /* Fotos — mutation observer no preview */
        for (let i = 1; i <= 6; i++) {
            const preview = document.getElementById(`photoPreview${i}`);
            if (preview) {
                new MutationObserver(runChecks).observe(preview, { childList: true, subtree: true });
            }
        }

        /* Troca de fluxo INBOUND/OUTBOUND */
        const opSelect = document.getElementById('operationTypeSelect');
        if (opSelect) opSelect.addEventListener('change', () => setTimeout(runChecks, 50));

        /* Remoção de linhas na tabela de itens */
        const tbody = document.getElementById('itemTableBody');
        if (tbody) {
            new MutationObserver(runChecks).observe(tbody, { childList: true, subtree: false });
        }

        /* Botão submit bloqueado — mostrar aviso ao tentar clicar */
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                if (submitBtn.classList.contains('btn-locked')) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    const panel = document.getElementById('pendingPanel');
                    if (panel) {
                        panel.classList.add('visible');
                        panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }, true);
        }
    }

    /* ──────────────────────────────────────────
       INICIALIZAÇÃO
    ────────────────────────────────────────── */
    function init() {
        injectStyles();
        buildProgressBar();
        injectSectionRings();
        buildPendingPanel();
        attachListeners();
        /* Primeira checagem após 300ms para garantir que o DOM do index.js já renderizou */
        setTimeout(runChecks, 300);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /* Expõe para chamada manual se necessário (ex: após limpar formulário) */
    window.pendingModule = { runChecks };
})();
