// Small shared validation utilities. These are added in parallel to existing
// functions in `index.js` and `admin.js` and are intentionally non-invasive.
(function () {
    function sanitizeNumber(input) {
        if (typeof input !== 'string') return '0';
        const cleaned = input.replace(/[^
\d.-]/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? '0' : num.toString();
    }

    function sanitizeText(input) {
        if (typeof input !== 'string') return '';
        return input.replace(/[<>"'&]/g, '').trim();
    }

    function secureInputValidation() {
        const textInputs = document.querySelectorAll('input[type="text"], textarea');
        textInputs.forEach(input => {
            input.value = sanitizeText(input.value);
        });

        const numberInputs = document.querySelectorAll('input[type="number"]');
        numberInputs.forEach(input => {
            const originalValue = input.value;
            const cleaned = sanitizeNumber(originalValue);
            if (originalValue !== cleaned) {
                console.warn(`Campo numérico sanitizado: ${originalValue} -> ${cleaned}`);
                input.value = cleaned;
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

    window.utils = window.utils || {};
    window.utils.validation = {
        sanitizeNumber,
        sanitizeText,
        secureInputValidation,
        showFormAlert,
        clearFormAlert
    };
})();
