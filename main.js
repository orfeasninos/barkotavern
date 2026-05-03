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
    initActiveNavLink();
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
    initMenuSidebarLayout(state);
    initMenuCategoryActive(state);
    if (document.querySelector(".menu-grid-wrapper") || document.querySelector("[data-price]")) {
      loadPrices();
    }
    initDishModal();
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
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;

    gtag("js", new Date());
    gtag("config", GA_ID);
  }

  /* =========================================================
     ACTIVE NAV LINK (one-page)
  ========================================================= */
  function initActiveNavLink() {
    const navLinks = document.querySelectorAll(
      ".header-nav ul > li:not(.nav-controls) > a"
    );
    if (!navLinks.length) return;
    const normPath = (p) => String(p || "").replace(/\/+$/, ""); // κόβει trailing "/"
    const path = normPath(location.pathname); // "/el/" -> "/el"
    navLinks.forEach(link => {
      const href = link.getAttribute("href");
      const linkPage = normPath(href).split("/").pop();
      link.classList.toggle("active", linkPage === path.split("/").pop());
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
      // Αντί για .style.display, παίζουμε με class
      document.body.classList.toggle("is-scrolled", window.scrollY > 400);
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
        const modalSrc = img.dataset.modalImg || img.src;
        openModal({ src: modalSrc, title: img.alt, text: "" });
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
})();