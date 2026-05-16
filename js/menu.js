const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQRMulVCBy3lU3x0zVc8uwImpRSzGpphGdSrL-XC_vOz9c_-udsZuaFaka7d10xWCj731PnJTn_FQhj/pub?output=csv';

async function loadMenu() {
    try {
        const response = await fetch(SHEET_URL);
        const csvText = await response.text();
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                if (results.data.length > 0) {
                    renderMenu(results.data);
                    const state = { mqMobile: window.matchMedia("(max-width: 768px)") };
                    initMenuSidebarLayout(state);
                    initMenuCategoryActive(state);
                } else {
                    console.error("The Sheet is empty or headers don't match.");
                }
            },
            error: function (err) {
                console.error("Error parsing CSV:", err);
                document.getElementById('menu-container').innerHTML = "Προέκυψε σφάλμα στη φόρτωση.";
            }
        });
    } catch (error) {
        console.error("Fetch error:", error);
    }
}
const currentLang = document.documentElement.lang.toUpperCase() || 'EN';
const categoryImages = {
    "Ορεκτικά": "../../assets/images/pitarakia.webp",
    "Σαλάτες": "../../assets/images/xoriatiki.webp",
    "Μαγειρευτά": "../../assets/images/kokoras.webp",
    "Της ώρας": "../../assets/images/tis-ora.webp",
    "Θαλασσινά": "../../assets/images/kalamarakia.webp",
    "Επιδόρπια": "../../assets/images/sokolatopita.webp",
    "Κρασιά": "../../assets/images/krasia.jpg",
    "Ποτά": "../../assets/images/drinks.webp"
};
const categoryTranslations = {
    "Ορεκτικά": { EL: "Ορεκτικά", IT: "Antipasti", FR: "Entrées", EN: "Appetizers" },
    "Σαλάτες": { EL: "Σαλάτες", IT: "Insalate", FR: "Salades", EN: "Salads" },
    "Μαγειρευτά": { EL: "Μαγειρευτά", IT: "Piatti Caldi", FR: "Plats Cuisinés", EN: "Hot Dishes" },
    "Της ώρας": { EL: "Της ώρας", IT: "Del Giorno", FR: "Du Jour", EN: "Specials" },
    "Θαλασσινά": { EL: "Θαλασσινά", IT: "Frutti di Mare", FR: "Fruits de Mer", EN: "Seafood" },
    "Επιδόρπια": { EL: "Επιδόρπια", IT: "Dolci", FR: "Desserts", EN: "Desserts" },
    "Κρασιά": { EL: "Κρασιά", IT: "Vini", FR: "Vins", EN: "Wines" },
    "Ποτά": { EL: "Ποτά", IT: "Bevande", FR: "Boissons", EN: "Drinks" }
};
const subcategoryTranslations = {
    "Νερό": { EL: "Νερό", IT: "Acqua", FR: "Eau", EN: "Water" },
    "Αναψυκτικά": { EL: "Αναψυκτικά", IT: "Bibite", FR: "Boissons Gazeuses", EN: "Soft Drinks" },
    "Ποτά": { EL: "Ποτά", IT: "Bevande", FR: "Boissons", EN: "Drinks" },
    "Μπύρες": { EL: "Μπύρες", IT: "Birre", FR: "Bières", EN: "Beers" },
    "Ούζο": { EL: "Ούζο", IT: "Ouzo", FR: "Ouzo", EN: "Ouzo" },
    "Τσίπουρο": { EL: "Τσίπουρο", IT: "Tsipouro", FR: "Tsipouro", EN: "Tsipouro" },
    "Κρασί": { EL: "Κρασί", IT: "Vino", FR: "Vin", EN: "Wine" }
};
function renderMenu(data) {
    const menuContainer = document.getElementById('menu-container');
    const sidebarContainer = document.querySelector('.menu-links-list');
    const currentLang = document.documentElement.lang.toUpperCase() || 'EN';
    if (currentLang.length > 2) currentLang = 'EN';
    const grouped = data.reduce((acc, item) => {
        const cat = item.Category || "Other";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {});
    let menuHtml = '';
    let sidebarHtml = '';
    for (const category in grouped) {
        const cleanKey = category.trim();
        const entry = categoryTranslations[cleanKey];
        const translatedCategory = (entry && entry[currentLang]) ? entry[currentLang] : cleanKey;
        const catImg = categoryImages[cleanKey] || '';
        const catId = (entry && entry.EN) ? entry.EN.toLowerCase().replace(/\s+/g, '-') : cleanKey;
        sidebarHtml += `
        <li>
            <a href="#${catId}" class="category-card" style="background-image:url('${catImg}')">
                <span>${translatedCategory}</span>
            </a>
        </li>`;
        menuHtml += `
    <section class="menu-category" id="${catId}">
        <h3>${translatedCategory}</h3>
        <ul class="menu-items">
            ${(() => {
                let currentSub = ""; // Μεταβλητή για να θυμόμαστε την υποκατηγορία
                return grouped[category].map(item => {
                    let subHeader = "";
                    if (item.Subcategory && item.Subcategory.trim() !== "" && item.Subcategory !== currentSub) {
                        currentSub = item.Subcategory.trim();
                        const subEntry = subcategoryTranslations[currentSub];
                        const translatedSub = (subEntry && subEntry[currentLang]) ? subEntry[currentLang] : currentSub;
                        subHeader = `<h4 class="menu-subcategory-title">${translatedSub}</h4>`;
                    }
                    const name = item[`Name_${currentLang}`] || item.Name_EN;
                    const desc = item[`Description_${currentLang}`] || item.Description_EN;
                    const hasImage = item.Image && item.Image.trim() !== '';
                    const price = item.Price ? parseFloat(item.Price.toString().replace(',', '.')).toFixed(2) : "0.00";
                    return `
                        ${subHeader} <!-- Εδώ μπαίνει ο τίτλος της υποκατηγορίας αν άλλαξε -->
                        <li class="${hasImage ? '' : 'no-image'}">
                            ${hasImage ? `<img src="${item.Image}" data-modal-img="${item['Image-large'] || item.Image}" alt="${name}" loading="lazy">` : ''}
                            <div class="dish">
                                ${name}
                                ${desc ? `<p>${desc}</p>` : ''}
                            </div>
                            <span class="price">${price}€</span>
                        </li>`;
                }).join('');
            })()}
        </ul>
    </section>`;
    }
    if (menuContainer) menuContainer.innerHTML = menuHtml;
    if (sidebarContainer) sidebarContainer.innerHTML = sidebarHtml;
}
loadMenu();

function initMenuSidebarLayout(state) {
    const wrapper = document.querySelector(".menu-grid-wrapper");
    const sidebar = document.querySelector(".menu-sidebar");
    const main = document.querySelector(".menu-main");
    if (!wrapper || !sidebar || !main) return;

    const apply = () => {
        const mobileNow = state.mqMobile.matches;
        sidebar.classList.toggle("menu-sidebar--mobile", mobileNow);

        if (sidebar.parentElement === wrapper && wrapper.firstElementChild !== sidebar) {
            wrapper.insertBefore(sidebar, main);
        }
    };

    apply();
    window.addEventListener("resize", apply, { passive: true });
}

function initMenuCategoryActive(state) {
    if (window.activeMenuObserver) {
        window.activeMenuObserver.disconnect();
    }

    const menuSections = document.querySelectorAll(".menu-category");
    const menuLinks = document.querySelectorAll(".menu-links-list a");
    const linksContainer = document.querySelector(".menu-links-list");
    const desktopContainer = document.querySelector(".menu-sidebar");

    if (!menuSections.length || !menuLinks.length || !("IntersectionObserver" in window)) return;

    let lastActiveId = null;

    const setActive = (id) => {
        if (lastActiveId === id) return;
        lastActiveId = id;
        menuLinks.forEach((link) => {
            const isActive = link.getAttribute("href") === `#${id}`;
            link.classList.toggle("active", isActive);

            if (isActive) {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        if (state.mqMobile && state.mqMobile.matches) {
                            if (linksContainer) {
                                const linkOffsetLeft = link.offsetLeft;
                                linksContainer.scrollTo({
                                    left: linkOffsetLeft - (linksContainer.clientWidth / 2) + (link.clientWidth / 2),
                                    behavior: "smooth"
                                });
                            }
                        } else {
                            if (desktopContainer) {
                                const linkOffsetTop = link.offsetTop;
                                desktopContainer.scrollTo({
                                    top: linkOffsetTop - (desktopContainer.clientHeight / 2) + (link.clientHeight / 2),
                                    behavior: "smooth"
                                });
                            }
                        }
                    });
                });
            }
        });
    };

    const menuObserver = new IntersectionObserver((entries) => {
        // Στο mobile παίρνουμε το section που έχει μπει περισσότερο στην οθόνη
        // Στο desktop κρατάμε τη λογική με το targetLine που σου δούλευε
        if (state.mqMobile && state.mqMobile.matches) {
            const visibleSection = entries.find(entry => entry.isIntersecting);
            if (visibleSection) {
                setActive(visibleSection.target.id);
            }
        } else {
            let activeId = null;
            let minDistance = Infinity;
            const targetLine = 120;

            menuSections.forEach((sec) => {
                const rect = sec.getBoundingClientRect();
                if (rect.top <= targetLine + 50 && rect.bottom >= targetLine) {
                    const distance = Math.abs(rect.top - targetLine);
                    if (distance < minDistance) {
                        minDistance = distance;
                        activeId = sec.id;
                    }
                }
            });

            if (activeId) {
                setActive(activeId);
            }
        }
    }, {
        // Καθαρίζουμε τα margins για το κινητό και βάζουμε threshold 0.3 (30%)
        rootMargin: state.mqMobile && state.mqMobile.matches ? "0px" : "-10% 0px -40% 0px",
        // ΑΛΛΑΓΗ: Ρίχνουμε το threshold στο 0.1 (10%) για να "πιάνει" αμέσως και τις Σαλάτες!
        threshold: state.mqMobile && state.mqMobile.matches ? 0.1 : 0.01
    });

    menuSections.forEach((sec) => menuObserver.observe(sec));

    window.activeMenuObserver = menuObserver;
}