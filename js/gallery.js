function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g,
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

function renderGallery(data) {
    const galleryContainer = document.getElementById('gallery-container');
    if (!galleryContainer) return;

    let currentLang = (document.documentElement.lang || 'en').toUpperCase();
    if (currentLang.length > 2) currentLang = 'EN';

    const seenImages = new Set();
    let galleryHtml = '';

    data.forEach(item => {
        const imgUrl = item.Image ? item.Image.trim() : '';
        
        if (imgUrl !== '' && !seenImages.has(imgUrl)) {
            seenImages.add(imgUrl);

            const name = escapeHTML(item[`Name_${currentLang}`] || item.Name_EN || 'Menu Item');
            const largeImgUrl = escapeHTML(item['Image-large'] ? item['Image-large'].trim() : imgUrl);
            const safeImgUrl = escapeHTML(imgUrl);

            galleryHtml += `
                <div class="gallery-item">
                    <img src="${safeImgUrl}" data-modal-img="${largeImgUrl}" alt="${name}" width="600" height="400" loading="lazy">
                </div>`;
        }
    });

    galleryContainer.innerHTML = galleryHtml;
    if (!galleryHtml) showError(getLangError('empty'));
}

function showError(message) {
    const galleryContainer = document.getElementById('gallery-container');
    if (galleryContainer) {
        galleryContainer.innerHTML = `<p class='error-message'>${message}</p>`;
    }
}

renderGallery(MENU_DATA);