// Formatting helpers (non-invasive). Mirrors some helpers in `shared.js`.
(function () {
    function formatValue(val) {
        if (val === null || val === undefined || val === '') return '—';
        return String(val).toUpperCase();
    }

    window.utils = window.utils || {};
    window.utils.formatters = {
        formatValue
    };
})();
