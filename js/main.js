(() => {
  "use strict";
  document.addEventListener("DOMContentLoaded", () => {
    const state = createState();
    initActiveNavLink();
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
    initDishModal();
  });

  function createState() {
    const mqMobile = window.matchMedia("(max-width: 768px)");
    return {
      mqMobile,
      isMobile: mqMobile.matches,
      rafScrollPending: false,
    };
  }

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
  document.addEventListener("click", (e) => {
    // 1. Για τα πιάτα στο MENU PAGE (δυναμικά από Google Sheets)
    const li = e.target.closest(".menu-items li");
    if (li && !e.target.closest("a")) {
      const img = li.querySelector("img");
      if (!img) return;
      const title = li.querySelector(".dish h4") || li.querySelector("h3");
      const text = li.querySelector(".dish p") || li.querySelector("p");
      openModal({
        src: img.dataset.modalImg || img.src,
        title: title?.textContent || "",
        text: text?.textContent || "",
      });
      return;
    }
    const indexItem = e.target.closest(".menu-item");
    if (indexItem) {
      const img = indexItem.querySelector("img");
      const title = indexItem.querySelector("h3");
      const text = indexItem.querySelector("p");
      openModal({
        src: img?.src,
        title: title?.textContent || "",
        text: text?.textContent || "",
      });
      return;
    }
    const galleryImg = e.target.closest(".gallery-item img");
    if (galleryImg) {
      openModal({
        src: galleryImg.dataset.modalImg || galleryImg.src,
        title: galleryImg.alt,
        text: "",
      });
      return;
    }
    if (e.target.classList.contains("dish-modal") || e.target.classList.contains("modal-close")) {
      modal.classList.remove("open");
    }
  });
}
})();