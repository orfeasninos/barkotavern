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
const categoryImages = {
    "Ορεκτικά": "../../assets/images/patates.webp",
    "Σαλάτες": "../../assets/images/ntakos.webp",
    "Μαγειρευτά": "../../assets/images/kokoras-lazania-home.webp",
    "Της ώρας": "../../assets/images/souvlaki-kotopoulo.webp",
    "Θαλασσινά": "../../assets/images/xtapodi.webp",
    "Επιδόρπια": "../../assets/images/sokolatopita.webp",
    "Κρασιά": "",
    "Ποτά": ""
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

const dietarySVGs = {
    V: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
    VG: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22V12"/><path d="M12 12c-2 0-5-2.5-5-5.5 2 0 5 2.5 5 5.5z"/><path d="M12 12c2 0 5-2.5 5-5.5-2 0-5 2.5-5 5.5z"/></svg>`,
    GF: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="21" x2="21" y2="3"/><path d="M12 4v14"/><path d="M9 8c0-2 1.5-3.5 3-4"/><path d="M15 8c0-2-1.5-3.5-3-4"/><path d="M9 13c0-2 1.5-3.5 3-4"/><path d="M15 13c0-2-1.5-3.5-3-4"/></svg>`
};

const dietaryLabels = {
    EN: { V: "Vegetarian", VG: "Vegan", GF: "Gluten-free" },
    EL: { V: "Χορτοφαγικό", VG: "Vegan", GF: "Χωρίς Γλουτένη" },
    IT: { V: "Vegetariano", VG: "Vegano", GF: "Senza Glutine" },
    FR: { V: "Végétarien", VG: "Vegan", GF: "Sans Gluten" }
};

function buildDietBadges(item, lang) {
    const labels = dietaryLabels[lang] || dietaryLabels.EN;
    const isTruthy = v => v && v.trim() !== '' && v.trim() !== '0' && v.trim().toLowerCase() !== 'false';
    let badges = '';
    if (isTruthy(item.Vegetarian)) {
        badges += `<span class="diet-badge diet-v" title="${labels.V}">${dietarySVGs.V}</span>`;
    }
    if (isTruthy(item.Vegan)) {
        badges += `<span class="diet-badge diet-vg" title="${labels.VG}">${dietarySVGs.VG}</span>`;
    }
    if (isTruthy(item.GlutenFree)) {
        badges += `<span class="diet-badge diet-gf" title="${labels.GF}">${dietarySVGs.GF}</span>`;
    }
    return badges;
}

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
    let currentLang = (document.documentElement.lang || 'en').toUpperCase();
    if (currentLang.length > 2) currentLang = 'EN';

    const grouped = data.reduce((acc, item) => {
        const cat = item.Category || "Other";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {});

    const labels = dietaryLabels[currentLang] || dietaryLabels.EN;
    let menuHtml = `
    <div class="menu-diet-legend" aria-label="Dietary key">
        <span class="diet-legend-item"><span class="diet-badge diet-v">${dietarySVGs.V}</span>${escapeHTML(labels.V)}</span>
        <span class="diet-legend-item"><span class="diet-badge diet-vg">${dietarySVGs.VG}</span>${escapeHTML(labels.VG)}</span>
        <span class="diet-legend-item"><span class="diet-badge diet-gf">${dietarySVGs.GF}</span>${escapeHTML(labels.GF)}</span>
    </div>`;
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

                    const rawPrice = item.Price ? parseFloat(item.Price.toString().replace(',', '.')) : NaN;
                    const price = !isNaN(rawPrice) ? rawPrice.toFixed(2) : null;

                    const dietBadges = buildDietBadges(item, currentLang);

                    return `
                        ${subHeader}
                        <li class="${imgUrl ? '' : 'no-image'}">
                            ${imgUrl ? `<img src="${imgUrl}" data-modal-img="${largeImgUrl}" alt="${name}" width="100" height="100" loading="lazy">` : ''}
                            <div class="dish">
                                <span class="dish-name">${name}${dietBadges ? `<span class="diet-badges">${dietBadges}</span>` : ''}</span>
                                ${desc ? `<p>${desc}</p>` : ''}
                            </div>
                            ${price !== null ? `<span class="price">${price}€</span>` : ''}
                        </li>`;
                }).join('');
            })()}
        </ul>
    </section>`;
    }

    if (menuContainer) menuContainer.innerHTML = menuHtml;
    if (sidebarContainer) sidebarContainer.innerHTML = sidebarHtml;
}

renderMenu(MENU_DATA);
const state = { mqMobile: window.matchMedia("(max-width: 768px)") };
initMenuCategoryActive(state);



function initMenuCategoryActive(state) {
    const menuSections = Array.from(document.querySelectorAll(".menu-category"));
    const menuLinks = Array.from(document.querySelectorAll(".menu-links-list a"));
    const linksContainer = document.querySelector(".menu-links-list");
    const desktopContainer = document.querySelector(".menu-sidebar");

    if (!menuSections.length || !menuLinks.length) return;

    let lastActiveId = null;
    let isClickScrolling = false;
    let clickScrollTimer = null;
    let ticking = false;
    const getTargetLine = () => {
        if (state.mqMobile?.matches) {
            return window.innerHeight * 0.45;
        }
        return window.innerHeight * 0.4;
    };

    const scrollNavToLink = (link) => {
        requestAnimationFrame(() => {
            if (state.mqMobile?.matches && linksContainer) {
                const cRect = linksContainer.getBoundingClientRect();
                const lRect = link.getBoundingClientRect();
                linksContainer.scrollBy({
                    left: lRect.left - cRect.left - (linksContainer.clientWidth - lRect.width) / 2,
                    behavior: "smooth"
                });
            } else if (desktopContainer) {
                const cRect = desktopContainer.getBoundingClientRect();
                const lRect = link.getBoundingClientRect();
                desktopContainer.scrollBy({
                    top: lRect.top - cRect.top - (desktopContainer.clientHeight - lRect.height) / 2,
                    behavior: "smooth"
                });
            }
        });
    };

    const setActive = (id) => {
        if (lastActiveId === id) return;
        lastActiveId = id;
        menuLinks.forEach((link) => {
            const isActive = link.getAttribute("href") === `#${id}`;
            link.classList.toggle("active", isActive);
            if (isActive) scrollNavToLink(link);
        });
    };

    const updateOnScroll = () => {
        if (isClickScrolling) return;


        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 5) {
            setActive(menuSections[menuSections.length - 1].id);
            return;
        }

        const targetLine = getTargetLine();

        let activeId = menuSections[0].id;
        for (let i = menuSections.length - 1; i >= 0; i--) {
            if (menuSections[i].getBoundingClientRect().top <= targetLine) {
                activeId = menuSections[i].id;
                break;
            }
        }
        setActive(activeId);
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateOnScroll();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    menuLinks.forEach((link) => {
        link.addEventListener("click", () => {
            const href = link.getAttribute("href");
            if (!href) return;
            const targetId = href.substring(1);
            isClickScrolling = true;
            setActive(targetId);

            const unlock = () => {
                clearTimeout(clickScrollTimer);
                isClickScrolling = false;
            };

            clearTimeout(clickScrollTimer);



            if ('onscrollend' in window) {
                window.addEventListener('scrollend', unlock, { once: true });
                clickScrollTimer = setTimeout(unlock, 1500);
            } else {
                clickScrollTimer = setTimeout(unlock, 1000);
            }
        });
    });



    requestAnimationFrame(updateOnScroll);
}