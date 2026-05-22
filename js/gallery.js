const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQRMulVCBy3lU3x0zVc8uwImpRSzGpphGdSrL-XC_vOz9c_-udsZuaFaka7d10xWCj731PnJTn_FQhj/pub?output=csv';

async function loadGallery() {
    try {
        const response = await fetch(SHEET_URL);
        const csvText = await response.text();
        
        if (typeof Papa === 'undefined') {
            console.error("PapaParse library is missing. Make sure papaparse.min.js is loaded before gallery.js.");
            return;
        }

        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                if (results.data && results.data.length > 0) {
                    renderGallery(results.data);
                } else {
                    console.error("The Sheet is empty or headers don't match.");
                    showError("Το μενού είναι άδειο.");
                }
            },
            error: function (err) {
                console.error("Error parsing CSV:", err);
                showError("Προέκυψε σφάλμα στη φόρτωση των δεδομένων.");
            }
        });
    } catch (error) {
        console.error("Fetch error:", error);
        showError("Αποτυχία σύνδεσης στο δίκτυο.");
    }
}

function renderGallery(data) {
    const galleryContainer = document.getElementById('gallery-container');
    if (!galleryContainer) return;

    let currentLang = document.documentElement.lang.toUpperCase() || 'EN';
    if (currentLang.length > 2) currentLang = 'EN';

    const seenImages = new Set();
    let galleryHtml = '';

    data.forEach(item => {
        const imgUrl = item.Image ? item.Image.trim() : '';
        
        if (imgUrl !== '' && !seenImages.has(imgUrl)) {
            seenImages.add(imgUrl);

            const name = item[`Name_${currentLang}`] || item.Name_EN || 'Menu Item';
            const largeImgUrl = item['Image-large'] ? item['Image-large'].trim() : imgUrl;

            galleryHtml += `
                <div class="gallery-item">
                    <img src="${imgUrl}" data-modal-img="${largeImgUrl}" alt="${name}" loading="lazy">
                </div>`;
        }
    });

    galleryContainer.innerHTML = galleryHtml;
}

function showError(message) {
    const galleryContainer = document.getElementById('gallery-container');
    if (galleryContainer) {
        galleryContainer.innerHTML = `<p class='error-message'>${message}</p>`;
    }
}

loadGallery();