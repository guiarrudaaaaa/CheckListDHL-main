// Upload de fotos: seleção múltipla, compressão determinística e limite seguro para Firestore.
(function () {
    const MAX_PHOTOS = 12;
    const MAX_SIZE_BYTES = 85 * 1024;
    const MAX_DIMENSION = 1280;
    const PLACEHOLDER = '<span class="text-xs text-slate-400">Nenhuma imagem selecionada</span>';

    function setMessage(text, kind = '') {
        const el = document.getElementById('photoUploadMessage');
        if (!el) return;
        el.textContent = text;
        el.className = `text-sm mb-4 ${kind === 'error' ? 'text-red-600' : kind === 'success' ? 'text-green-700' : 'text-slate-600'}`;
    }
    function dataUrlBytes(dataUrl) {
        const base64 = (dataUrl.split(',')[1] || '').replace(/\s/g, '');
        return Math.ceil(base64.length * 3 / 4);
    }
    function readImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
            reader.onload = () => {
                const img = new Image();
                img.onerror = () => reject(new Error('Formato de imagem não suportado.'));
                img.onload = () => resolve(img);
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        });
    }
    async function compressImage(file) {
        const img = await readImage(file);
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
        canvas.height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        let quality = 0.78;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrlBytes(dataUrl) > MAX_SIZE_BYTES && quality > 0.42) {
            quality -= 0.08;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        return dataUrl;
    }
    function renderPreviews(photoDataUrls) {
        const grid = document.getElementById('photoPreviewGrid');
        const clear = document.getElementById('clearPhotosButton');
        if (!grid) return;
        grid.innerHTML = photoDataUrls.length ? photoDataUrls.map((url, i) => `
            <div class="photo-upload-card photo-preview-card">
                <div class="photo-preview"><img src="${url}" alt="Foto ${i + 1}" class="photo-preview-img"></div>
                <div class="photo-controls"><span class="text-xs font-bold text-slate-600">Foto ${i + 1}</span>
                    <button type="button" class="photo-remove-btn" data-photo-index="${i}" aria-label="Remover foto ${i + 1}">✕</button>
                </div>
            </div>`).join('') : PLACEHOLDER;
        grid.querySelectorAll('[data-photo-index]').forEach(button => button.addEventListener('click', () => {
            const index = Number(button.dataset.photoIndex);
            photoDataUrls.splice(index, 1);
            renderPreviews(photoDataUrls);
            setMessage(photoDataUrls.length ? `${photoDataUrls.length} foto(s) pronta(s).` : '');
        }));
        if (clear) clear.style.display = photoDataUrls.length ? 'inline-flex' : 'none';
    }
    async function handlePhotoChange(event, photoDataUrls) {
        const files = Array.from(event.target.files || []);
        if (!files.length) return;
        if (files.length > MAX_PHOTOS) {
            setMessage(`Selecione no máximo ${MAX_PHOTOS} fotos.`, 'error');
            event.target.value = '';
            return;
        }
        const invalid = files.find(file => !file.type.startsWith('image/'));
        if (invalid) {
            setMessage('Todos os arquivos precisam ser imagens.', 'error');
            event.target.value = '';
            return;
        }
        photoDataUrls.splice(0, photoDataUrls.length);
        setMessage(`Processando 0/${files.length} fotos...`);
        try {
            for (let i = 0; i < files.length; i += 1) {
                photoDataUrls.push(await compressImage(files[i]));
                setMessage(`Processando ${i + 1}/${files.length} fotos...`);
                renderPreviews(photoDataUrls);
            }
            const totalKb = Math.round(photoDataUrls.reduce((sum, url) => sum + dataUrlBytes(url), 0) / 1024);
            setMessage(`${photoDataUrls.length} foto(s) pronta(s) para envio (${totalKb} KB no total).`, 'success');
        } catch (error) {
            photoDataUrls.splice(0, photoDataUrls.length);
            renderPreviews(photoDataUrls);
            setMessage(error.message || 'Não foi possível processar as fotos.', 'error');
        } finally {
            event.target.value = '';
        }
    }
    function clearAllPhotoPreviews(photoDataUrls) {
        photoDataUrls.splice(0, photoDataUrls.length);
        const input = document.getElementById('photoInput');
        if (input) input.value = '';
        renderPreviews(photoDataUrls);
        setMessage('');
    }
    window.components = window.components || {};
    window.components.photoUploader = { MAX_PHOTOS, MAX_SIZE_BYTES, handlePhotoChange, clearAllPhotoPreviews, renderPreviews };
})();
