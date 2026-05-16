// Audit helper for checklist item rows.
(function () {
    function audit(el) {
        if (!el) return;
        const row = el.parentElement.parentElement;
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

        const diff = real - prev;
        row.querySelector('.res-falta').value = diff < 0 ? Math.abs(diff) : 0;
        row.querySelector('.res-sobra').value = diff > 0 ? diff : 0;
        const bons = real - (av + sc + ai);
        row.querySelector('.res-bons').value = bons > 0 ? bons : 0;
        auditAll();
    }

    function auditAll() {
        const totalFaltasEl = document.getElementById('totalFaltas');
        const totalSobraEl = document.getElementById('totalSobra');
        const totalBonsEl = document.getElementById('totalBonsGeral');

        const totalFaltas = Array.from(document.querySelectorAll('.res-falta')).reduce((sum, input) => sum + (parseFloat(input.value) || 0), 0);
        const totalSobra = Array.from(document.querySelectorAll('.res-sobra')).reduce((sum, input) => sum + (parseFloat(input.value) || 0), 0);
        const totalBons = Array.from(document.querySelectorAll('.res-bons')).reduce((sum, input) => sum + (parseFloat(input.value) || 0), 0);

        if (totalFaltasEl) totalFaltasEl.innerText = totalFaltas;
        if (totalSobraEl) totalSobraEl.innerText = totalSobra;
        if (totalBonsEl) totalBonsEl.innerText = totalBons;
    }

    function addItemRow({ focus = false } = {}) {
        const tbody = document.getElementById('itemTableBody');
        if (!tbody) return;

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50';
        tr.innerHTML = `
            <td><input type="number" class="table-input val-item-code text-center" placeholder="Cód." min="0" step="1" required></td>
            <td class="bg-blue-50/30"><input type="number" class="table-input val-previsto text-center" value="" min="0" step="1" required></td>
            <td class="bg-blue-50/30"><input type="number" class="table-input val-realizado text-center" value="" min="0" step="1" required></td>
            <td><input type="number" class="table-input text-red-600 res-falta text-center" value="0" readonly></td>
            <td><input type="number" class="table-input text-green-600 res-sobra text-center" value="0" readonly></td>
            <td><input type="number" class="table-input val-avaria text-center" value="" min="0" step="1" required></td>
            <td><input type="number" class="table-input val-scrap text-center" value="" min="0" step="1" required></td>
            <td><input type="number" class="table-input val-avint text-center" value="" min="0" step="1" required></td>
            <td class="bg-slate-100"><input type="number" class="table-input font-black res-bons text-center" value="0" readonly></td>
            <td class="text-center"><button type="button" class="text-slate-300 hover:text-red-500 font-bold">✕</button></td>
        `;

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
        if (focus && firstInput) firstInput.focus();
    }

    window.components = window.components || {};
    window.components.audit = {
        addItemRow,
        audit,
        auditAll
    };
})();
