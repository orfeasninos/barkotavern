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
    initLowEndMode(state);          // async-ish but non-blocking (applies class when ready)
    initTheme(state);
    initSmoothAnchors(state);
    initSectionReveal(state);
    initActiveNavLink(state);
    initScrollTop(state);
    initBurgerMenu(state);
    initLanguageDropdown(state);
    autoRedirectByBrowserLang();


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

  /* =========================================================
     LOW-END MODE (score + optional benchmark)
  ========================================================= */
  function initLowEndMode(state) {
const isMobile = window.matchMedia("(max-width: 768px)").matches;

  // ===== Low-end detection =====
  const params = new URLSearchParams(location.search);
  const debugOn = params.has("debug");
  const forceLite = params.has("lite");
  const forceFull = params.has("full");

  const prefersReducedMotion =
    !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const mem = navigator.deviceMemory || 0;
  const cores = navigator.hardwareConcurrency || 0;
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const saveData = !!(conn && conn.saveData);
  const effectiveType = (conn && conn.effectiveType) ? conn.effectiveType : "";

  const logDecision = (finalLowEnd, reason, extra = {}) => {
    if (!debugOn) return;
    console.group("%c[Barko] Low-end decision", "color:#d4af37;font-weight:bold;");
    console.log("isMobile:", isMobile);
    console.log("memGB:", mem || "n/a", "cores:", cores || "n/a");
    console.log("effectiveType:", effectiveType || "n/a", "saveData:", saveData);
    console.log("prefersReducedMotion:", prefersReducedMotion);
    Object.entries(extra).forEach(([k, v]) => console.log(k + ":", v));
    console.log("➡️ FINAL low-end:", finalLowEnd);
    console.log("reason:", reason);
    console.groupEnd();
  };

  const decideLowEnd = () => {
    // 0) forced
    if (forceFull) return { lowEnd: false, reason: "forceFull(?full)" };
    if (forceLite) return { lowEnd: true, reason: "forceLite(?lite)" };

    // 1) cached
    const cached = sessionStorage.getItem("barko_low_end");
    if (cached === "1") return { lowEnd: true, reason: "cached=1" };
    if (cached === "0") return { lowEnd: false, reason: "cached=0" };

    // 2) benchmark only if visible+focused
    if (document.visibilityState !== "visible" || !document.hasFocus()) {
      return { lowEnd: false, reason: "benchmark-skipped(not visible/focused)" };
    }

    // 3) run benchmark (after a short settle delay)
    return new Promise((resolve) => {
      setTimeout(() => {
        const start = performance.now();
        let frames = 0;
        let longFrames = 0;
        let last = start;

        const tick = (t) => {
          frames++;
          const dt = t - last;
          if (dt > 34) longFrames++;
          last = t;

          if (t - start < 1000) {
            requestAnimationFrame(tick);
            return;
          }

          if (frames < 35) {
            const finalLowEnd = (frames <= 30) || (longFrames >= 8);
            resolve({
              lowEnd: finalLowEnd,
              reason: `benchmark-low(frames=${frames}, long=${longFrames})`,
              extra: { frames, longFrames }
            });
            return;
          }


          const lowByFrames = frames <= 48;
          const lowByLongs = longFrames >= 8;
          const finalLowEnd = lowByFrames || lowByLongs;

          resolve({
            lowEnd: finalLowEnd,
            reason: `benchmark(frames=${frames}, long=${longFrames})`,
            extra: { frames, longFrames },
          });
        };

        requestAnimationFrame(tick);
      }, 350);
    });
  };

    // apply result safely (works for object OR promise)
    Promise.resolve(decideLowEnd()).then((result) => {
      const finalLowEnd = !!result.lowEnd;

      document.body.classList.toggle("low-end", finalLowEnd);
      sessionStorage.setItem("barko_low_end", finalLowEnd ? "1" : "0");
      logDecision(finalLowEnd, result.reason, result.extra || {});
    });
  }
/* =========================================================
   LANGUAGE AUTO-REDIRECT (browser language)
   - Default: English
   - Supported: el, en, it, fr
   - Skips redirect if already in /el|/en|/it|/fr/
   - Optional: respects user's manual choice via localStorage
========================================================= */
function autoRedirectByBrowserLang(options = {}) {
  const {
    supported = ["el", "en", "it", "fr"],
    defaultLang = "en",
    rememberKey = "barko_lang_choice", // set this when user picks a language manually
    rootDomain = "", // leave "" to keep same host; use e.g. "https://barkotavernmilos.com" if needed
  } = options;

  // If user manually chose a language, respect it
  const saved = localStorage.getItem(rememberKey);
  if (saved && supported.includes(saved)) return;

  const path = location.pathname; // e.g. /el/menu.html or / (root)
  const inLangFolder = path.match(/^\/(el|en|it|fr)(\/|$)/i);
  if (inLangFolder) return; // already localized

  // Detect browser language(s)
  const langs = (navigator.languages && navigator.languages.length)
    ? navigator.languages
    : [navigator.language || defaultLang];

  // Pick first supported language
  let chosen = defaultLang;
  for (const l of langs) {
    const code = String(l).toLowerCase().split("-")[0]; // "en-US" -> "en"
    if (supported.includes(code)) { chosen = code; break; }
  }

  // Keep same page name if it exists (index root -> /{lang}/)
  // Examples:
  //  - / -> /en/
  //  - /menu.html -> /en/menu.html
  //  - /restaurant.html -> /en/restaurant.html
  const file = path === "/" ? "" : path.replace(/^\//, ""); // remove leading "/"
  const targetPath = file ? `/${chosen}/${file}` : `/${chosen}/`;

  // Avoid loops
  if (location.pathname === targetPath) return;

  location.replace(rootDomain + targetPath);
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
  // ✅ Μόνο τα “κανονικά” menu links (όχι σημαίες / controls)
  const navLinks = document.querySelectorAll(
    ".header-nav ul > li:not(.nav-controls) > a"
  );
  if (!navLinks.length) return;

  const path = location.pathname.replace(/\/$/, "");
  const langRoot = path.split("/").filter(Boolean)[0] || "";
  const isHome = path === `/${langRoot}`; // /el, /en, /it, /fr

  /* =========================
     HOME PAGE → scroll logic
  ========================= */
  if (isHome) {
    const contactSection = document.getElementById("contact");
    if (!contactSection) {
      // αν δεν υπάρχει contact section, απλά βάλε active στο Home
      navLinks.forEach(l => l.classList.remove("active"));
      navLinks[0]?.classList.add("active");
      return;
    }

    const homeLink = [...navLinks].find(a => a.getAttribute("href") === `/${langRoot}`);
    const contactLink = [...navLinks].find(a => a.getAttribute("href") === `/${langRoot}#contact`);

    const onScroll = () => {
      const r = contactSection.getBoundingClientRect();
      const inContact =
        r.top < window.innerHeight * 0.4 &&
        r.bottom > window.innerHeight * 0.4;

      navLinks.forEach(l => l.classList.remove("active"));
      if (inContact) contactLink?.classList.add("active");
      else homeLink?.classList.add("active");
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return;
  }

  /* =========================
     OTHER PAGES → filename
  ========================= */
  const currentPage = path.split("/").pop();

  navLinks.forEach(link => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#")) return;

    const linkPage = href.split("/").pop();
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

        openModal({ src: img.src, title: "", text: "" });
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
