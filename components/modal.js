// Accessibility helpers for modals: adds role, aria attributes and a simple
// focus trap. Designed to be safe and additive — existing modals will call
// `enableModalAccessibility(modal, label)` after creation.
(function () {
    function enableModalAccessibility(modal, label) {
        if (!modal) return;
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', label || 'Detalhes do Checklist');

        // Focus trap
        const focusableSelectors = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';
        const focusable = Array.from(modal.querySelectorAll(focusableSelectors)).filter(el => el.offsetParent !== null);
        if (focusable.length) focusable[0].focus();

        function handleKey(e) {
            if (e.key === 'Escape') {
                // let existing close handlers handle removal
                const close = modal.querySelector('.modal-close');
                if (close) close.click();
                return;
            }
            if (e.key !== 'Tab') return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }

        modal.addEventListener('keydown', handleKey);
        // Remove listener when modal is removed
        const observer = new MutationObserver(() => {
            if (!document.body.contains(modal)) {
                modal.removeEventListener('keydown', handleKey);
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    window.components = window.components || {};
    window.components.modal = { enableModalAccessibility };
})();
