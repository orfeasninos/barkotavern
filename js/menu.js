const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQRMulVCBy3lU3x0zVc8uwImpRSzGpphGdSrL-XC_vOz9c_-udsZuaFaka7d10xWCj731PnJTn_FQhj/pub?output=csv';

async function loadMenu() {
    try {
        const response = await fetch(SHEET_URL);
        const csvText = await response.text();

        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                console.log("Data from Google Sheets:", results.data); // Δες εδώ αν έρχονται τα δεδομένα
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

// Ορισμός εικόνων για τις κατηγορίες (μπορείς να τις αλλάξεις εδώ)
// Τα κλειδιά ΠΡΕΠΕΙ να είναι ίδια με την κολόνα "Category" του Excel
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

function renderMenu(data) {
    const menuContainer = document.getElementById('menu-container');
    const sidebarContainer = document.querySelector('.menu-links-list');

    const currentLang = document.documentElement.lang.toUpperCase() || 'EN';
    if (currentLang.length > 2) currentLang = 'EN';
    // 1. Ομαδοποίηση
    const grouped = data.reduce((acc, item) => {
        const cat = item.Category || "Other";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {});

    let menuHtml = '';
    let sidebarHtml = '';

for (const category in grouped) {
    const cleanKey = category.trim(); // "Ορεκτικά"
    // 1. Βρίσκει τη μετάφραση βάσει του ελληνικού κλειδιού
    const entry = categoryTranslations[cleanKey];
    const translatedCategory = (entry && entry[currentLang]) ? entry[currentLang] : cleanKey;

    // 2. Βρίσκει την εικόνα βάσει του ελληνικού κλειδιού
    const catImg = categoryImages[cleanKey] || '';

    // 3. Δημιουργεί ένα ID στα αγγλικά για το URL (προαιρετικό αλλά καλό για το SEO)
    // Αν το entry[EN] υπάρχει, το ID θα είναι "appetizers", αλλιώς "ορεκτικά"
    const catId = (entry && entry.EN) ? entry.EN.toLowerCase().replace(/\s+/g, '-') : cleanKey;

    sidebarHtml += `
        <li>
            <a href="#${catId}" class="category-card" style="background-image:url('${catImg}')">
                <span>${translatedCategory}</span>
            </a>
        </li>`;

    menuHtml += `
        <section class="menu-category" id="${catId}">
            <h3>${translatedCategory}</h3> <!-- Πρόσθεσα το h3 που έλειπε στο δικό σου snippet -->
            <ul class="menu-items">
                ${grouped[category].map(item => {
                    const name = item[`Name_${currentLang}`] || item.Name_EN;
                    const desc = item[`Description_${currentLang}`] || item.Description_EN;
                    const hasImage = item.Image && item.Image.trim() !== '';
                    const price = item.Price ? parseFloat(item.Price.toString().replace(',', '.')).toFixed(2) : "0.00";

                    return `
                        <li class="${hasImage ? '' : 'no-image'}">
                            ${hasImage ? `<img src="${item.Image}" data-modal-img="${item['Image-large'] || item.Image}" alt="${name}" loading="lazy">` : ''}
                            <div class="dish">
                                ${name}
                                ${desc ? `<p>${desc}</p>` : ''}
                            </div>
                            <span class="price">${price}€</span>
                        </li>`;
                }).join('')}
            </ul>
        </section>`;
}

    // Τοποθέτηση στα containers
    if (menuContainer) menuContainer.innerHTML = menuHtml;
    if (sidebarContainer) sidebarContainer.innerHTML = sidebarHtml;
}
loadMenu();
 /* =========================================================
     MENU PAGE: sidebar move on mobile
  ========================================================= */
  function initMenuSidebarLayout(state) {
    const wrapper = document.querySelector(".menu-grid-wrapper");
    const sidebar = document.querySelector(".menu-sidebar");
    const main = document.querySelector(".menu-main");
    if (!wrapper || !sidebar || !main) return;

    const apply = () => {
      const mobileNow = state.mqMobile.matches;
      sidebar.classList.toggle("menu-sidebar--mobile", mobileNow);

      // keep sidebar first (above menu) on mobile (and also consistent on desktop)
      if (sidebar.parentElement === wrapper && wrapper.firstElementChild !== sidebar) {
        wrapper.insertBefore(sidebar, main);
      }
    };

    apply();
    window.addEventListener("resize", apply, { passive: true });
  }

 /* =========================================================
      MENU PAGE: active category (Barko Optimized - No Reflow)
     ========================================================= */
  function initMenuCategoryActive(state) {
    const menuSections = document.querySelectorAll(".menu-category");
    const menuLinks = document.querySelectorAll(".menu-links-list a");
    const linksContainer = document.querySelector(".menu-links-list");

    if (!menuSections.length || !menuLinks.length || !("IntersectionObserver" in window)) return;

    let lastActiveId = null;

    const setActive = (id) => {
      if (lastActiveId === id) return;
      lastActiveId = id;

      menuLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${id}`;
        link.classList.toggle("active", isActive);

        // Scroll μόνο αν υπάρχει ανάγκη και πάντα μέσα σε requestAnimationFrame
if (isActive && linksContainer) {
  // Διπλό RAF για να βεβαιωθούμε ότι ο browser έχει τελειώσει με το στυλ
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const linkOffset = link.offsetLeft; 
      linksContainer.scrollTo({
        left: linkOffset - (linksContainer.clientWidth / 2),
        behavior: "smooth"
      });
    });
  });
}
      });
    };

    const menuObserver = new IntersectionObserver((entries) => {
      // Παίρνουμε το πρώτο στοιχείο που μπαίνει στο "οπτικό πεδίο"
      const visible = entries.find(e => e.isIntersecting);
      if (visible) {
        setActive(visible.target.id);
      }
    }, {
      // Αυξάνουμε το margin για να πιάνει το section πριν φτάσει τέρμα πάνω
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0.01
    });

    menuSections.forEach((sec) => menuObserver.observe(sec));
  }
