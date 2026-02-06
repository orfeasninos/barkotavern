document.addEventListener("DOMContentLoaded", async () => {

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

  let score = 0;

  const logDecision = (finalLowEnd, reason, extra = {}) => {
    if (!debugOn) return;
    console.group("%c[Barko] Low-end decision", "color:#d4af37;font-weight:bold;");
    console.log("isMobile:", isMobile);
    console.log("memGB:", mem || "n/a", "cores:", cores || "n/a");
    console.log("effectiveType:", effectiveType || "n/a", "saveData:", saveData);
    console.log("prefersReducedMotion:", prefersReducedMotion);
    console.log("score:", score);
    Object.entries(extra).forEach(([k, v]) => console.log(k + ":", v));
    console.log("➡️ FINAL low-end:", finalLowEnd);
    console.log("reason:", reason);
    console.groupEnd();
  };

  const decideLowEnd = () => {
    // 0) forced
    if (forceFull) return { lowEnd: false, reason: "forceFull(?full)" };
    if (forceLite) return { lowEnd: true, reason: "forceLite(?lite)" };

    // 1) cached (IMPORTANT: no return from DOMContentLoaded!)
    const cached = sessionStorage.getItem("barko_low_end");
    if (cached === "1") return { lowEnd: true, reason: "cached=1" };
    if (cached === "0") return { lowEnd: false, reason: "cached=0" };

    // 2) score
    score = 0;
    if (saveData) score += 3;
    if (effectiveType.includes("2g")) score += 3;

    if (mem && mem < 1) score += 2;
    else if (mem && mem <= 4) score += 1;

    if (cores && cores <= 2) score += 3;
    else if (cores && cores <= 4) score += 1;

    if (prefersReducedMotion) score += 1;
    if (isMobile && score > 0) score += 1;
    const isLowEndByScore = score >= 4;
    const shouldBenchmark = !isLowEndByScore && score >= 2 && score <= 3;

    if (!shouldBenchmark) return { lowEnd: isLowEndByScore, reason: isLowEndByScore ? "score>=4" : "score<4" };

    // 3) benchmark only if visible+focused
    if (document.visibilityState !== "visible" || !document.hasFocus()) {
      return { lowEnd: false, reason: "benchmark-skipped(not visible/focused)" };
    }

    // return a promise result
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

          if (t - start < 900) {
            requestAnimationFrame(tick);
            return;
          }

          if (frames < 30) {
            resolve({ lowEnd: false, reason: `benchmark-invalid(frames=${frames}, long=${longFrames})`, extra: { frames, longFrames } });
            return;
          }

          const lowByFrames = frames < 45;
          const lowByLongs = longFrames > 6;
          const finalLowEnd = lowByFrames || lowByLongs;

          resolve({ lowEnd: finalLowEnd, reason: `benchmark(frames=${frames}, long=${longFrames})`, extra: { frames, longFrames } });
        };

        requestAnimationFrame(tick);
      }, 250);
    });
  };

  const result = await decideLowEnd();
  const finalLowEnd = result.lowEnd;

  document.body.classList.toggle("low-end", finalLowEnd);
  sessionStorage.setItem("barko_low_end", finalLowEnd ? "1" : "0");
  logDecision(finalLowEnd, result.reason, result.extra || {});

  // ✅ Από εδώ και κάτω τρέχουν ΟΛΑ κανονικά (dark mode, scroll, burger, κλπ)
  // ...
  /* =========================
     AUTO DARK MODE (SYSTEM)
  ========================= */
  const themeToggle = document.getElementById("theme-toggle");

  if (
    !localStorage.getItem("theme") &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    document.body.classList.add("dark");
    if (themeToggle) themeToggle.textContent = "☀️";
  }

  /* =========================
     DARK MODE TOGGLE
  ========================= */
  if (themeToggle) {
    if (localStorage.getItem("theme") === "dark") {
      document.body.classList.add("dark");
      themeToggle.textContent = "☀️";
    }

    themeToggle.addEventListener("click", () => {
      // keep scroll position stable on mobile
      const y = window.scrollY;

      document.body.classList.toggle("dark");
      const isDark = document.body.classList.contains("dark");
      themeToggle.textContent = isDark ? "☀️" : "🌙";
      localStorage.setItem("theme", isDark ? "dark" : "light");

      requestAnimationFrame(() => window.scrollTo(0, y));
    });
  }

  /* =========================
     SMOOTH SCROLL (ANCHORS)
  ========================= */
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

      window.scrollTo({ top: y, behavior: isMobile ? "auto" : "smooth" });
    });
  });

  /* =========================
     SECTION REVEAL (FAIL-SAFE)**************************************************************************************************************************************************
  ========================= */
  const sections = document.querySelectorAll(".section");

  if (sections.length) {
    // Mobile: reveal immediately (no observers/animations)
    if (isMobile) {
      sections.forEach((sec) => sec.classList.add("section-visible"));
    } else {
      // Αν δεν υποστηρίζεται IntersectionObserver, δείξε τα πάντα.
      if (!("IntersectionObserver" in window)) {
        sections.forEach(sec => sec.classList.add("section-visible"));
      } else {
        const revealNowIfInView = (el) => {
          const r = el.getBoundingClientRect();
          // αν είναι ήδη “στο περίπου” μέσα στο viewport στο load, δείξ' το άμεσα
          if (r.top < window.innerHeight * 0.92) el.classList.add("section-visible");
        };

        const revealObserver = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add("section-visible");
              revealObserver.unobserve(entry.target);
            }
          });
        }, { threshold: 0.08, rootMargin: "0px 0px -10% 0px" });

        sections.forEach(sec => {
          sec.classList.add("section-hidden");
          revealNowIfInView(sec);      // ✅ fail-safe για refresh
          revealObserver.observe(sec);
        });

        // άλλο ένα fail-safe μετά το πρώτο paint
        requestAnimationFrame(() => sections.forEach(revealNowIfInView));
        setTimeout(() => sections.forEach(revealNowIfInView), 250);
      }
    }
  }


  /* =========================
     ACTIVE NAV LINK (one-page sections)
  ========================= */
  const navLinks = document.querySelectorAll(".header-nav a");
  const contactSection = document.getElementById("contact");

  if (navLinks.length && contactSection) {
    const homeLink = document.querySelector('.header-nav a[href="/el"]');
    const contactLink = document.querySelector('.header-nav a[href="/el#contact"]');

    const onScroll = () => {
      const r = contactSection.getBoundingClientRect();
      const inContact =
        r.top < window.innerHeight * 0.4 &&
        r.bottom > window.innerHeight * 0.4;

      // reset
      navLinks.forEach(l => l.classList.remove("active"));

      if (inContact) {
        contactLink?.classList.add("active");
      } else {
        homeLink?.classList.add("active");
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // initial
  }



  /* =========================
     SCROLL TO TOP
  ========================= */
  const topBtn = document.createElement("button");
  topBtn.className = "scroll-top";
  topBtn.type = "button";
  topBtn.textContent = "↑";
  document.body.appendChild(topBtn);

  topBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: isMobile ? "auto" : "smooth" });
  });

  window.addEventListener(
    "scroll",
    () => {
      topBtn.style.display = window.scrollY > 400 ? "flex" : "none";
    },
    { passive: true }
  );

  /* =========================
     BURGER MENU
  ========================= */
  const burger = document.getElementById("burger-menu");
  const mobileNav = document.getElementById("mobile-nav");

  if (burger && mobileNav) {
    burger.addEventListener("click", (e) => {
      e.stopPropagation();
      mobileNav.classList.toggle("open");
    });

    mobileNav.addEventListener("click", (e) => e.stopPropagation());

    document.addEventListener(
      "click",
      (e) => {
        if (!mobileNav.contains(e.target) && !burger.contains(e.target)) {
          mobileNav.classList.remove("open");
        }
      },
      { passive: true }
    );
  }

  /* =========================
     LANGUAGE DROPDOWN
  ========================= */
  document.querySelectorAll(".language-switcher").forEach((ls) => {
    const current = ls.querySelector(".lang-current");
    if (!current) return;

    current.addEventListener("click", (e) => {
      e.stopPropagation();
      ls.classList.toggle("open");
    });
  });

  document.addEventListener("click", () => {
    document.querySelectorAll(".language-switcher").forEach((ls) => ls.classList.remove("open"));
  });

  /* =========================================================
     MENU PAGE: MOBILE SIDEBAR TRANSFORM + ACTIVE (NO JUMP)
  ========================================================= */
  const wrapper = document.querySelector(".menu-grid-wrapper");
  const sidebar = document.querySelector(".menu-sidebar");
  const main = document.querySelector(".menu-main");

  const menuSections = document.querySelectorAll(".menu-category");
  const menuLinks = document.querySelectorAll(".menu-links-list a");
  const linksContainer = document.querySelector(".menu-links-list");

  // On mobile: move sidebar above menu and mark it for mobile styling
  const makeMobileSidebar = () => {
    if (!wrapper || !sidebar || !main) return;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    if (isMobile) {
      sidebar.classList.add("menu-sidebar--mobile");
      if (sidebar.parentElement === wrapper && wrapper.firstElementChild !== sidebar) {
        wrapper.insertBefore(sidebar, main);
      }
    } else {
      sidebar.classList.remove("menu-sidebar--mobile");
      if (sidebar.parentElement === wrapper && wrapper.firstElementChild !== sidebar) {
        wrapper.insertBefore(sidebar, main);
      }
    }
  };

  makeMobileSidebar();
  window.addEventListener("resize", makeMobileSidebar, { passive: true });

  // Highlight active category; on mobile, auto-center active chip (NO JUMP / NO LOOP)
  // Highlight active category (desktop + mobile). On mobile: center active chip.
  if (menuSections.length && menuLinks.length) {
    let lastActiveId = null;
    let rafPending = false;

    const setActive = (id) => {
      menuLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${id}`;
        link.classList.toggle("active", isActive);

        // center only on mobile (chips)
        if (isActive) {
          const mobileNow =
            window.matchMedia("(max-width: 768px)").matches ||
            sidebar?.classList.contains("menu-sidebar--mobile");

          if (mobileNow && linksContainer && !rafPending) {
            rafPending = true;
            requestAnimationFrame(() => {
              rafPending = false;
              const left =
                link.offsetLeft -
                linksContainer.clientWidth / 2 +
                link.clientWidth / 2;

              linksContainer.scrollTo({ left, behavior: "smooth" });
            });
          } else if (!mobileNow && linksContainer && !rafPending) {
            rafPending = true;
            requestAnimationFrame(() => {
              rafPending = false;
              const cRect = linksContainer.getBoundingClientRect();
              const lRect = link.getBoundingClientRect();
              const current = linksContainer.scrollTop;
              const offset =
                lRect.top - cRect.top - cRect.height / 2 + lRect.height / 2;

              linksContainer.scrollTo({
                top: Math.max(0, current + offset),
                behavior: "smooth",
              });
            });
          }
        }
      });
    };

    const menuObserver = new IntersectionObserver(
      (entries) => {
        const hits = entries.filter((e) => e.isIntersecting);
        if (!hits.length) return;

        // ✅ FIX 1: near-bottom lock (για να μην ανάβει λάθος το προτελευταίο/τελευταίο)
        const nearBottom =
          window.scrollY + window.innerHeight >=
          document.documentElement.scrollHeight - 40;

        if (nearBottom) {
          const lastId = "drinks"; // 🔁 άλλαξε αν το τελευταίο section σου έχει άλλο id
          if (lastActiveId !== lastId) {
            lastActiveId = lastId;
            setActive(lastId);
          }
          return;
        }

        // ✅ FIX 2: διάλεξε αυτό που είναι πιο “κοντά” σε σημείο εστίασης (όχι με ratio)
        const focusY = window.innerHeight * 0.35; // 0.30–0.45 είναι συνήθως τέλειο
        hits.sort((a, b) => {
          const da = Math.abs(a.boundingClientRect.top - focusY);
          const db = Math.abs(b.boundingClientRect.top - focusY);
          return da - db;
        });

        const id = hits[0].target.id;
        if (!id || id === lastActiveId) return;

        lastActiveId = id;
        setActive(id);
      },
      {
        // λίγο πιο “ήπιο” για sticky header/sidebar
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0.01, 0.08, 0.15],
      }
    );


    menuSections.forEach((sec) => menuObserver.observe(sec));

    // initial state (σε refresh στη μέση της σελίδας)
    const initial = [...menuSections]
      .map((s) => ({ s, top: s.getBoundingClientRect().top }))
      .filter((x) => x.top < window.innerHeight * 0.55)
      .sort((a, b) => b.top - a.top)[0];

    if (initial?.s?.id) setActive(initial.s.id);
  }

  /* =========================
     MENU ITEMS ANIMATION
  ========================= */
  const items = document.querySelectorAll(".menu-items li");
  if (!isMobile && items.length) {
    items.forEach((item, i) => {
      if (i % 2 !== 0) item.classList.add("from-right");
    });

    const itemsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("show");
            itemsObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    items.forEach((item) => itemsObserver.observe(item));
  }
});

/* =========================
PRICES JSON (Menu prices)
Put this inside main.js (inside the main DOMContentLoaded)
========================= */
(async function loadPrices() {
  // Always fetch from site root (works for /el/, /en/, /it/, /fr/)
  const PRICES_URL = "/assets/json/prices.json?v=1";

  try {
    const res = await fetch(PRICES_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const prices = await res.json();

    document.querySelectorAll("[data-price]").forEach((el) => {
      const key = el.getAttribute("data-price");
      if (!key) return;

      const val = prices[key];
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        el.textContent = String(val);
      }
    });
  } catch (err) {
    console.log("[Barko] prices.json not loaded:", err);
    // fallback: keep the HTML prices as-is
  }
})();
/* =========================
   DISH MODAL (INDEX)
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("dishModal");
  const modalImg = document.getElementById("modalImg");
  const modalTitle = document.getElementById("modalTitle");
  const modalText = document.getElementById("modalText");

  // ✅ αν λείπει το modal, μην κάνεις τίποτα (άρα δεν σπάει άλλες σελίδες)
  if (!modal || !modalImg || !modalTitle || !modalText) return;

  const openModal = ({ src, title = "", text = "" }) => {
    modalImg.src = src || "";
    modalTitle.textContent = title || "";
    modalText.textContent = text || "";

    // αν είμαστε gallery (δεν έχουμε πάντα κείμενο), κρύψε το p όταν είναι άδειο
    modalText.style.display = text ? "" : "none";

    modal.classList.add("open");
  };

  // ✅ INDEX cards (.menu-item)
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

  // ✅ GALLERY images (.gallery-item img)
  document.querySelectorAll(".gallery-item img").forEach((img) => {
    img.addEventListener("click", () => {
      openModal({
        src: img.src,
        title: img.alt || "Φωτογραφία",
        text: "", // δεν έχει περιγραφή στη gallery
      });
    });
  });

  // ✅ close modal
  modal.addEventListener("click", (e) => {
    if (
      e.target.classList.contains("dish-modal") ||
      e.target.classList.contains("modal-close")
    ) {
      modal.classList.remove("open");
    }
  });
});
