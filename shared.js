// ===== FUNÇÕES UTILITÁRIAS =====
// Atualiza o relógio em tempo real
function updateClock(elementId = 'liveClock') {
    const clock = document.getElementById(elementId);
    if (!clock) return;

    const now = new Date();
    clock.textContent = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// Sanitiza texto removendo caracteres especiais
function sanitizeText(input) {
    if (typeof input !== 'string') return '';
    return input.replace(/[<>'"&]/g, '').trim();
}

// Escapa HTML para prevenir XSS
function escapeHtml(value) {
    if (value === undefined || value === null) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Define innerHTML de forma segura, removendo scripts e event handlers
function safeSetInnerHTML(element, html) {
    if (!element || typeof html !== 'string') return;
    const sanitized = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        .replace(/javascript:/gi, '');
    element.innerHTML = sanitized;
}

// Escapa valores para CSV
function csvEscape(value) {
    const text = value === undefined || value === null ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
}
