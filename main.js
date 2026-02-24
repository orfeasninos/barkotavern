/* =========================================================
   Barko main.js — CLEAN / SINGLE INIT
   - One DOMContentLoaded
   - No scope leaks / no ReferenceError
   - Runs safely on all pages (checks DOM existence)
========================================================= */
(() => {
  "use strict";
  document.addEventListener("DOMContentLoaded", () => {
    const state = createState();

    // INIT ONCE (1 φορά)
    initTheme(state);
    initSmoothAnchors(state);
    initSectionReveal(state);
    initActiveNavLink(state);
    initScrollTop(state);
    initBurgerMenu(state);
    initLanguageDropdown(state);
    initConsent();
    const btn = document.getElementById("openCookieSettings");
    if (btn) {
      btn.addEventListener("click", () => {
        const banner = document.getElementById("consentBanner");
        if (banner) banner.classList.add("show");
      });
    }

    // Menu page only
    initMenuSidebarLayout(state);
    initMenuCategoryActive(state);

    // Extras
    if (document.querySelector(".menu-grid-wrapper") || document.querySelector("[data-price]")) {
      loadPrices();
    }              // 1 φορά (async fetch) — safe on all pages
    initDishModal();                // 1 φορά (bind clicks) — safe on all pages
    initVisualViewportBgSync();     // “continuous” via events — safe if .page-bg exists
  });

  /* =========================
     STATE
  ========================= */
  function createState() {
    const mqMobile = window.matchMedia("(max-width: 768px)");
    return {
      mqMobile,
      isMobile: mqMobile.matches,
      rafScrollPending: false,
    };
  }
  /* =========================
     COOKIE CONSENT
  ========================= */
  function initConsent() {
    const KEY = "barko_cookie_choice";
    const banner = document.getElementById("consentBanner");
    const accept = document.getElementById("consentAccept");
    const reject = document.getElementById("consentReject");

    if (!banner || !accept || !reject) return;

    const choice = localStorage.getItem(KEY);

    if (!choice) {
      banner.classList.add("show");
    }

    accept.addEventListener("click", () => {
      localStorage.setItem(KEY, "accepted");
      banner.classList.remove("show");
      loadAnalytics();
    });

    reject.addEventListener("click", () => {
      localStorage.setItem(KEY, "rejected");
      disableAnalytics();
      banner.classList.remove("show");
    });


    if (choice === "accepted") {
      loadAnalytics();
    } else if (choice === "rejected") {
      disableAnalytics();
    }

  }

  function disableAnalytics() {
    const GA_ID = "G-W5LVLHN94F";
    window["ga-disable-" + GA_ID] = true;
  }

  function loadAnalytics() {
    
    if (window.__gaLoaded) return;
    window.__gaLoaded = true;

    const GA_ID = "G-W5LVLHN94F";
    window["ga-disable-" + GA_ID] = false;
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=G-W5LVLHN94F";
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;

    gtag("js", new Date());
    gtag("config", GA_ID);
  }

  /* =========================================================
     THEME
  ========================================================= */
  function initTheme(state) {
    const themeToggle = document.getElementById("theme-toggle");

    // System auto-dark (only if user has NOT chosen)
    if (!localStorage.getItem("theme") &&
      window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.body.classList.add("dark");
      if (themeToggle) themeToggle.textContent = "☀️";
    }

    // Persisted choice
    if (localStorage.getItem("theme") === "dark") {
      document.body.classList.add("dark");
      if (themeToggle) themeToggle.textContent = "☀️";
    }

    // Toggle
    if (!themeToggle) return;

    themeToggle.addEventListener("click", () => {
      const y = window.scrollY;

      document.body.classList.toggle("dark");
      const isDark = document.body.classList.contains("dark");
      themeToggle.textContent = isDark ? "☀️" : "🌙";
      localStorage.setItem("theme", isDark ? "dark" : "light");

      // keep scroll stable on mobile
      requestAnimationFrame(() => window.scrollTo(0, y));
    });

    // keep state.isMobile updated on rotate/resizes
    state.mqMobile.addEventListener?.("change", (e) => {
      state.isMobile = e.matches;
    });
  }

  /* =========================================================
     SMOOTH ANCHORS
  ========================================================= */
  function initSmoothAnchors(state) {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        if (!href || href === "#") return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        const header = document.querySelector("header");
        const offset = header ? header.offsetHeight : 0;
        const y = target.getBoundingClientRect().top + window.pageYOffset - offset;

        window.scrollTo({ top: y, behavior: state.isMobile ? "auto" : "smooth" });
      });
    });
  }

  /* =========================================================
     SECTION REVEAL (fail-safe)
  ========================================================= */
  function initSectionReveal(state) {
    const sections = document.querySelectorAll(".section");
    if (!sections.length) return;

    // Mobile: show immediately
    if (state.isMobile) {
      sections.forEach((sec) => sec.classList.add("section-visible"));
      return;
    }

    if (!("IntersectionObserver" in window)) {
      sections.forEach((sec) => sec.classList.add("section-visible"));
      return;
    }

    const revealNowIfInView = (el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92) el.classList.add("section-visible");
    };

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("section-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -10% 0px" });

    sections.forEach((sec) => {
      sec.classList.add("section-hidden");
      revealNowIfInView(sec);
      revealObserver.observe(sec);
    });

    requestAnimationFrame(() => sections.forEach(revealNowIfInView));
    setTimeout(() => sections.forEach(revealNowIfInView), 250);
  }

  /* =========================================================
     ACTIVE NAV LINK (one-page)
  ========================================================= */
  function initActiveNavLink() {
  // Μόνο κανονικά links (όχι flags / controls)
  const navLinks = document.querySelectorAll(
    ".header-nav ul > li:not(.nav-controls) > a"
  );
  if (!navLinks.length) return;

  const normPath = (p) => String(p || "")
    .split("#")[0]
    .replace(/\/+$/, ""); // κόβει trailing "/"

  const path = normPath(location.pathname); // "/el/" -> "/el"
  const langRoot = path.split("/").filter(Boolean)[0] || "";
  const homeA = `/${langRoot}`;    // "/el"
  const homeB = `/${langRoot}/`;   // "/el/"

  const isHome = path === homeA;

  // βρίσκει link που είναι είτε "/el" είτε "/el/"
  const findHomeLink = () => {
    return [...navLinks].find(a => {
      const href = a.getAttribute("href") || "";
      return normPath(href) === homeA;
    });
  };

  // βρίσκει link contact που είναι είτε "/el#contact" είτε "/el/#contact"
  const findContactLink = () => {
    return [...navLinks].find(a => {
      const href = a.getAttribute("href") || "";
      const base = normPath(href);
      const hash = (href.split("#")[1] || "");
      return base === homeA && hash === "contact";
    });
  };

  if (isHome) {
    const contactSection = document.getElementById("contact");
    const homeLink = findHomeLink();
    const contactLink = findContactLink();

    const setActive = (el) => {
      navLinks.forEach(l => l.classList.remove("active"));
      el?.classList.add("active");
    };

    if (!contactSection) {
      setActive(homeLink);
      return;
    }

    const onScroll = () => {
      const r = contactSection.getBoundingClientRect();
      const inContact =
        r.top < window.innerHeight * 0.4 &&
        r.bottom > window.innerHeight * 0.4;

      setActive(inContact ? contactLink : homeLink);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return;
  }

  // OTHER PAGES → filename compare
  const currentPage = path.split("/").pop();

  navLinks.forEach(link => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#")) return;

    const linkPage = normPath(href).split("/").pop();
    link.classList.toggle("active", linkPage === currentPage);
  });
}




  /* =========================================================
     SCROLL TO TOP
  ========================================================= */
  function initScrollTop(state) {
    const topBtn = document.createElement("button");
    topBtn.className = "scroll-top";
    topBtn.type = "button";
    topBtn.textContent = "↑";
    document.body.appendChild(topBtn);

    topBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: state.isMobile ? "auto" : "smooth" });
    });

    const update = () => {
      state.rafScrollPending = false;
      topBtn.style.display = window.scrollY > 400 ? "flex" : "none";
    };

    window.addEventListener("scroll", () => {
      if (state.rafScrollPending) return;
      state.rafScrollPending = true;
      requestAnimationFrame(update);
    }, { passive: true });

    update();
  }

  /* =========================================================
     BURGER MENU
  ========================================================= */
  function initBurgerMenu() {
    const burger = document.getElementById("burger-menu");
    const mobileNav = document.getElementById("mobile-nav");
    if (!burger || !mobileNav) return;

    burger.addEventListener("click", (e) => {
      e.stopPropagation();
      mobileNav.classList.toggle("open");
    });

    mobileNav.addEventListener("click", (e) => e.stopPropagation());

    document.addEventListener("click", (e) => {
      if (!mobileNav.contains(e.target) && !burger.contains(e.target)) {
        mobileNav.classList.remove("open");
      }
    }, { passive: true });
  }

  /* =========================================================
     LANGUAGE DROPDOWN
  ========================================================= */
  function initLanguageDropdown() {
    document.querySelectorAll(".language-switcher").forEach((ls) => {
      const current = ls.querySelector(".lang-current");
      if (!current) return;

      current.addEventListener("click", (e) => {
        e.stopPropagation();
        ls.classList.toggle("open");
      });
    });

    document.addEventListener("click", () => {
      document.querySelectorAll(".language-switcher")
        .forEach((ls) => ls.classList.remove("open"));
    });
  }

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
     MENU PAGE: active category (IntersectionObserver)
  ========================================================= */
  function initMenuCategoryActive(state) {
    const sidebar = document.querySelector(".menu-sidebar");
    const menuSections = document.querySelectorAll(".menu-category");
    const menuLinks = document.querySelectorAll(".menu-links-list a");
    const linksContainer = document.querySelector(".menu-links-list");

    if (!menuSections.length || !menuLinks.length || !("IntersectionObserver" in window)) return;

    let lastActiveId = null;
    let rafPending = false;

    const setActive = (id) => {
      menuLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${id}`;
        link.classList.toggle("active", isActive);

        if (!isActive) return;

        const mobileNow =
          state.mqMobile.matches || sidebar?.classList.contains("menu-sidebar--mobile");

        if (!linksContainer || rafPending) return;

        rafPending = true;
        requestAnimationFrame(() => {
          rafPending = false;

          if (mobileNow) {
            // center horizontal chips
            const left =
              link.offsetLeft - linksContainer.clientWidth / 2 + link.clientWidth / 2;
            linksContainer.scrollTo({ left, behavior: "smooth" });
          } else {
            // center vertical list
            const cRect = linksContainer.getBoundingClientRect();
            const lRect = link.getBoundingClientRect();
            const current = linksContainer.scrollTop;
            const offset = lRect.top - cRect.top - cRect.height / 2 + lRect.height / 2;

            linksContainer.scrollTo({
              top: Math.max(0, current + offset),
              behavior: "smooth",
            });
          }
        });
      });
    };

    const menuObserver = new IntersectionObserver((entries) => {
      const hits = entries.filter((e) => e.isIntersecting);
      if (!hits.length) return;

      // near-bottom lock (avoid wrong last highlight)
      const nearBottom =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 40;

      if (nearBottom) {
        const lastId = "drinks"; // άλλαξε αν το τελευταίο σου section έχει άλλο id
        if (lastActiveId !== lastId) {
          lastActiveId = lastId;
          setActive(lastId);
        }
        return;
      }

      // choose closest to focus point
      const focusY = window.innerHeight * 0.35;
      hits.sort((a, b) => {
        const da = Math.abs(a.boundingClientRect.top - focusY);
        const db = Math.abs(b.boundingClientRect.top - focusY);
        return da - db;
      });

      const id = hits[0].target.id;
      if (!id || id === lastActiveId) return;

      lastActiveId = id;
      setActive(id);
    }, {
      rootMargin: "-30% 0px -55% 0px",
      threshold: [0.01, 0.08, 0.15],
    });

    menuSections.forEach((sec) => menuObserver.observe(sec));

    // initial (refresh mid-page)
    const initial = [...menuSections]
      .map((s) => ({ s, top: s.getBoundingClientRect().top }))
      .filter((x) => x.top < window.innerHeight * 0.55)
      .sort((a, b) => b.top - a.top)[0];

    if (initial?.s?.id) setActive(initial.s.id);
  }



  /* =========================================================
     PRICES JSON (1 φορά)
  ========================================================= */
  async function loadPrices() {
    const PRICES_URL = "/assets/json/prices.json?v=1";

    try {
      const res = await fetch(PRICES_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const prices = await res.json();
      let updatedCount = 0;

      document.querySelectorAll("[data-price]").forEach((el) => {
        const key = el.getAttribute("data-price");
        if (!key) return;

        const val = prices[key];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          el.textContent = String(val);
          updatedCount++;
        }
      });

      console.log(`[Barko] Prices loaded successfully (${updatedCount} items updated)`);
    } catch (err) {
      console.log("[Barko] prices.json not loaded:", err);
      // fallback: keep HTML prices
    }
  }

  /* =========================================================
     DISH MODAL (index + menu + gallery) — safe on all pages
  ========================================================= */
  function initDishModal() {
    const modal = document.getElementById("dishModal");
    const modalImg = document.getElementById("modalImg");
    const modalTitle = document.getElementById("modalTitle");
    const modalText = document.getElementById("modalText");

    if (!modal || !modalImg || !modalTitle || !modalText) return;

    const openModal = ({ src, title = "", text = "" }) => {
      modalImg.src = src || "";
      modalImg.alt = title || "Φωτογραφία πιάτου στο Barko Tavern";
      modalTitle.textContent = title || "";
      modalText.textContent = text || "";
      modalText.style.display = text ? "" : "none";
      modal.classList.add("open");
    };

    // INDEX cards
    document.querySelectorAll(".menu-item").forEach((item) => {
      item.addEventListener("click", () => {
        const img = item.querySelector("img");
        const title = item.querySelector("h3");
        const text = item.querySelector("p");

        openModal({
          src: img?.src,
          title: title?.textContent || "",
          text: text?.textContent || "",
        });
      });
    });

    // MENU PAGE items (li click) — only if li has img
    document.querySelectorAll(".menu-items li").forEach((li) => {
      li.addEventListener("click", (e) => {
        if (e.target.closest("a")) return; // allow links

        const img = li.querySelector("img");
        if (!img) return;

        const modalSrc = img.dataset.modalImg || img.src;
        openModal({ src: modalSrc, title: "", text: "" });


      });
    });

    // GALLERY images
    document.querySelectorAll(".gallery-item img").forEach((img) => {
      img.addEventListener("click", () => {
        openModal({
          src: img.src,
          title: img.alt || "Φωτογραφία",
          text: "",
        });
      });
    });

    // close modal
    modal.addEventListener("click", (e) => {
      if (
        e.target.classList.contains("dish-modal") ||
        e.target.classList.contains("modal-close")
      ) {
        modal.classList.remove("open");
      }
    });
  }

  /* =========================================================
     VISUAL VIEWPORT BG SYNC (fix address bar gaps)
  ========================================================= */
  function initVisualViewportBgSync() {
    const bg = document.querySelector(".page-bg");
    if (!bg || !window.visualViewport) return;

    const vv = window.visualViewport;
    const sync = () => {
      bg.style.height = vv.height + "px";
      bg.style.width = vv.width + "px";
      bg.style.top = vv.offsetTop + "px";
    };

    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
  }
})();