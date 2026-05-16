// Photo uploader helper prepares client-side compression and size checks.
// This augments existing behavior in `index.js` but does not replace it.
(function () {
    const MAX_SIZE_BYTES = 300 * 1024; // 300KB recommended

    function clearPhotoPreview(index, photoDataUrls) {
        const preview = document.getElementById(`photoPreview${index}`);
        const input = document.getElementById(`photoInput${index}`);
        const removeBtn = document.querySelector(`.photo-upload-card:nth-child(${index}) .photo-remove-btn`);
        if (!preview) return;

        preview.innerHTML = '<span class="text-xs text-slate-400">Toque para selecionar imagem</span>';
        if (Array.isArray(photoDataUrls)) {
            photoDataUrls[index - 1] = '';
        }
        if (input) input.value = '';
        if (removeBtn) removeBtn.style.display = 'none';
    }

    async function handlePhotoChange(event, index, photoDataUrls) {
        const input = event.target;
        const preview = document.getElementById(`photoPreview${index}`);
        const message = document.getElementById('photoUploadMessage');
        if (!input.files?.[0] || !preview) return;

        try {
            const file = input.files[0];
            if (!file.type.startsWith('image/')) {
                if (message) message.textContent = 'Por favor, selecione um arquivo de imagem válido.';
                clearPhotoPreview(index, photoDataUrls);
                return;
            }

            if (message) {
                if (file.size > MAX_SIZE_BYTES) {
                    message.textContent = 'Imagem muito grande (máx. 300KB). A imagem será comprimida.';
                } else {
                    message.textContent = '';
                }
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                let dataUrl = e.target.result;

                const finishUpload = () => {
                    if (Array.isArray(photoDataUrls)) photoDataUrls[index - 1] = dataUrl;
                    preview.innerHTML = `<img src="${dataUrl}" alt="Foto ${index}" class="photo-preview-img">`;
                    if (message) message.textContent = '';
                    const removeBtn = document.querySelector(`.photo-upload-card:nth-child(${index}) .photo-remove-btn`);
                    if (removeBtn) removeBtn.style.display = 'block';
                };

                if (dataUrl && dataUrl.length > MAX_SIZE_BYTES * 1.34) {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;
                        const maxDim = 1024;

                        if (width > height && width > maxDim) {
                            height = (height * maxDim) / width;
                            width = maxDim;
                        } else if (height > maxDim) {
                            width = (width * maxDim) / height;
                            height = maxDim;
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        dataUrl = canvas.toDataURL('image/jpeg', 0.75);
                        finishUpload();
                    };
                    img.src = dataUrl;
                } else {
                    finishUpload();
                }
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error('Erro ao processar foto:', err);
            if (message) message.textContent = 'Não foi possível carregar a imagem. Tente novamente.';
            if (input) input.value = '';
        }
    }

    function clearAllPhotoPreviews(photoDataUrls) {
        if (Array.isArray(photoDataUrls)) {
            for (let i = 0; i < photoDataUrls.length; i += 1) {
                photoDataUrls[i] = '';
            }
        }
        for (let i = 1; i <= 6; i += 1) {
            clearPhotoPreview(i, photoDataUrls);
            const input = document.getElementById(`photoInput${i}`);
            if (input) input.value = '';
        }
    }

    window.components = window.components || {};
    window.components.photoUploader = {
        MAX_SIZE_BYTES,
        clearPhotoPreview,
        handlePhotoChange,
        clearAllPhotoPreviews
    };
})();
