const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTeetU-sTKeodCrslGkzITvyC7Ob4ayTf5HdLDqcEEueZfHw4QqzAxbapHBdWq0TYhR6fbvNuL8lqLT/pub?gid=0&single=true&output=csv';

const GALLERY_ERRORS = {
    empty:   { el: "Δεν βρέθηκαν φωτογραφίες.", en: "No photos found.", it: "Nessuna foto trovata.", fr: "Aucune photo trouvée." },
    parse:   { el: "Σφάλμα φόρτωσης δεδομένων.", en: "Error loading data.", it: "Errore nel caricamento.", fr: "Erreur de chargement." },
    network: { el: "Αποτυχία σύνδεσης στο δίκτυο.", en: "Network connection failed.", it: "Connessione di rete fallita.", fr: "Échec de la connexion réseau." }
};
function getLangError(type) {
    const lang = (document.documentElement.lang || 'en').toLowerCase().slice(0, 2);
    const map = GALLERY_ERRORS[type];
    return (map && map[lang]) ? map[lang] : map.en;
}

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
                    showError(getLangError('empty'));
                }
            },
            error: function (err) {
                console.error("Error parsing CSV:", err);
                showError(getLangError('parse'));
            }
        });
    } catch (error) {
        console.error("Fetch error:", error);
        showError(getLangError('network'));
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
    if (!galleryHtml) showError(getLangError('empty'));
}

function showError(message) {
    const galleryContainer = document.getElementById('gallery-container');
    if (galleryContainer) {
        galleryContainer.innerHTML = `<p class='error-message'>${message}</p>`;
    }
}

loadGallery();