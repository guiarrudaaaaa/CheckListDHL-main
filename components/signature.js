// Signature helper functions for canvas-based signatures.
(function () {
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
            if (event.pointerId) canvas.setPointerCapture(event.pointerId);
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
            if (event.pointerId && canvas.releasePointerCapture) {
                canvas.releasePointerCapture(event.pointerId);
            }
        };

        canvas.addEventListener('pointerdown', startDraw);
        canvas.addEventListener('pointermove', draw);
        canvas.addEventListener('pointerup', stopDraw);
        canvas.addEventListener('pointercancel', stopDraw);
        canvas.addEventListener('pointerleave', stopDraw);
    }

    window.components = window.components || {};
    window.components.signature = {
        resizeSignatureCanvas,
        clearSignature,
        isCanvasBlank,
        getSignatureData,
        initSignatureCanvas
    };
})();
