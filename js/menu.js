const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTeetU-sTKeodCrslGkzITvyC7Ob4ayTf5HdLDqcEEueZfHw4QqzAxbapHBdWq0TYhR6fbvNuL8lqLT/pub?gid=0&single=true&output=csv';
function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
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
                const container = document.getElementById('menu-container');
                if (container) container.textContent = "Προέκυψε σφάλμα στη φόρτωση.";
            }
        });
    } catch (error) {
        console.error("Fetch error:", error);
    }
}
const categoryImages = {
    "Ορεκτικά": "../../assets/images/patates.webp",
    "Σαλάτες": "../../assets/images/xwriatikh.webp",
    "Μαγειρευτά": "../../assets/images/kokoras-lazania-home.webp",
    "Της ώρας": "../../assets/images/mprizola.webp",
    "Θαλασσινά": "../../assets/images/xtapodi.webp",
    "Επιδόρπια": "../../assets/images/koufeto.webp",
    "Κρασιά": "../../assets/images/.webp",
    "Ποτά": "../../assets/images/.webp"
};

const categoryTranslations = {
    "Πιάτο Ημέρας": { EL: "Πιάτο Ημέρας", IT: "Piatto del giorno", FR: "Plat du jour", EN: "Dish of the day" },
    "Ορεκτικά": { EL: "Ορεκτικά", IT: "Antipasti", FR: "Entrées", EN: "Appetizers" },
    "Σαλάτες": { EL: "Σαλάτες", IT: "Insalate", FR: "Salades", EN: "Salads" },
    "Μαγειρευτά": { EL: "Μαγειρευτά", IT: "Piatti Caldi", FR: "Plats Cuisinés", EN: "Hot Dishes" },
    "Της ώρας": { EL: "Της ώρας", IT: "Del Giorno", FR: "Du Jour", EN: "Greek cuisine" },
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
    "Κρασί": { EL: "Κρασί", IT: "Vino", FR: "Vin", EN: "Wine" },
    "Αφρώδες": { EL: "Αφρώδες", IT: "Spumante", FR: "Pétillant", EN: "Sparkling" },
    "Λευκό": { EL: "Λευκό", IT: "Bianco", FR: "Blanc", EN: "White" },
    "Ροζέ": { EL: "Ροζέ", IT: "Rosato", FR: "Rosé", EN: "Rosé" },
    "Κόκκινο": { EL: "Κόκκινο", IT: "Rosso", FR: "Rouge", EN: "Red" }
};

function renderMenu(data) {
    const menuContainer = document.getElementById('menu-container');
    const sidebarContainer = document.querySelector('.menu-links-list');
    let currentLang = document.documentElement.lang.toUpperCase() || 'EN';
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

        const safeCatId = escapeHTML(catId);
        const safeTranslatedCategory = escapeHTML(translatedCategory);
        const safeCatImg = escapeHTML(catImg);

        sidebarHtml += `
        <li>
            <a href="#${safeCatId}" class="category-card" style="background-image:url('${safeCatImg}')">
                <span>${safeTranslatedCategory}</span>
            </a>
        </li>`;

        menuHtml += `
    <section class="menu-category" id="${safeCatId}">
        <h3>${safeTranslatedCategory}</h3>
        <ul class="menu-items">
            ${(() => {
                let currentSub = ""; 
                return grouped[category].map(item => {
                    let subHeader = "";
                    if (item.Subcategory && item.Subcategory.trim() !== "" && item.Subcategory !== currentSub) {
                        currentSub = item.Subcategory.trim();
                        const subEntry = subcategoryTranslations[currentSub];
                        const translatedSub = (subEntry && subEntry[currentLang]) ? subEntry[currentLang] : currentSub;
                        subHeader = `<li class="menu-subcategory-title">${escapeHTML(translatedSub)}</li>`;
                    }

                    const rawName = item[`Name_${currentLang}`] || item.Name_EN || '';
                    const rawDesc = item[`Description_${currentLang}`] || item.Description_EN || '';
                    
                    const name = escapeHTML(rawName);
                    const desc = escapeHTML(rawDesc);
                    
                    const rawImg = item.Image && item.Image.trim() !== '' ? item.Image : '';
                    const rawLargeImg = item['Image-large'] || rawImg;
                    
                    const imgUrl = escapeHTML(rawImg);
                    const largeImgUrl = escapeHTML(rawLargeImg);

                    const price = item.Price ? parseFloat(item.Price.toString().replace(',', '.')).toFixed(2) : "0.00";

                    return `
                        ${subHeader}
                        <li class="${imgUrl ? '' : 'no-image'}">
                            ${imgUrl ? `<img src="${imgUrl}" data-modal-img="${largeImgUrl}" alt="${name}" loading="lazy">` : ''}
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
    const menuSections = Array.from(document.querySelectorAll(".menu-category"));
    const menuLinks = Array.from(document.querySelectorAll(".menu-links-list a"));
    const linksContainer = document.querySelector(".menu-links-list");
    const desktopContainer = document.querySelector(".menu-sidebar");
    
    if (!menuSections.length || !menuLinks.length) return;
    
    let lastActiveId = null;
    let isClickScrolling = false; 
    let clickTimeout = null;
    let ticking = false;

    const setActive = (id) => {
        if (lastActiveId === id) return;
        lastActiveId = id;
        
        menuLinks.forEach((link) => {
            const isActive = link.getAttribute("href") === `#${id}`;
            link.classList.toggle("active", isActive);

            if (isActive) {
                requestAnimationFrame(() => {
                    if (state.mqMobile && state.mqMobile.matches && linksContainer) {
                        const linkOffsetLeft = link.offsetLeft;
                        linksContainer.scrollTo({
                            left: linkOffsetLeft - (linksContainer.clientWidth / 2) + (link.clientWidth / 2),
                            behavior: "smooth"
                        });
                    } else if (desktopContainer) {
                        const linkOffsetTop = link.offsetTop;
                        desktopContainer.scrollTo({
                            top: linkOffsetTop - (desktopContainer.clientHeight / 2) + (link.clientHeight / 2),
                            behavior: "smooth"
                        });
                    }
                });
            }
        });
    };

    const updateOnScroll = () => {
        if (isClickScrolling) return;

        if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 10) {
            setActive(menuSections[menuSections.length - 1].id);
            return;
        }

        const isMobile = state.mqMobile && state.mqMobile.matches;
        const targetLine = isMobile ? 175 : 120; 
        let currentActiveId = null;

        for (let i = menuSections.length - 1; i >= 0; i--) {
            const rect = menuSections[i].getBoundingClientRect();
            if (rect.top <= targetLine + 20) {
                currentActiveId = menuSections[i].id;
                break;
            }
        }

        if (!currentActiveId && menuSections.length > 0) {
            currentActiveId = menuSections[0].id;
        }

        if (currentActiveId) {
            setActive(currentActiveId);
        }
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateOnScroll();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    menuLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
            const targetId = link.getAttribute("href").substring(1);
            
            isClickScrolling = true;
            setActive(targetId);

            clearTimeout(clickTimeout);

            clickTimeout = setTimeout(() => {
                isClickScrolling = false;
            }, 800); 
        });
    });

    updateOnScroll();
}