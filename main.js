/* =========================
   Barko Tavern – main.js
   Mobile-safe & Smooth UX
   (single init; menu mobile chips + active centering)
========================= */

document.addEventListener("DOMContentLoaded", () => {
  // Mobile detection (used to avoid jank on Android Chrome/Brave)
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  // ===== Low-end detection (more accurate) =====
  const params = new URLSearchParams(location.search);
  const debugOn = params.has("debug");
  const forceLite = params.has("lite");
  const forceFull = params.has("full"); // optional override: ?full

  const prefersReducedMotion =
    !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const mem = navigator.deviceMemory || 0; // GB (not supported everywhere)
  const cores = navigator.hardwareConcurrency || 0;
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const saveData = !!(conn && conn.saveData);
  const effectiveType = (conn && conn.effectiveType) ? conn.effectiveType : "";

  let score = null;
  let shouldBenchmark = false;
  let frames = null;
  let longFrames = null;

  const finish = (finalLowEnd, reason) => {
    // toggle ensures footer/sections don't get stuck in a previous state
    document.body.classList.toggle("low-end", finalLowEnd);
    sessionStorage.setItem("barko_low_end", finalLowEnd ? "1" : "0");

    if (debugOn) {
      console.group("%c[Barko] Low-end decision", "color:#d4af37;font-weight:bold;");
      console.log("isMobile:", isMobile);
      console.log("memGB:", mem || "n/a", "cores:", cores || "n/a");
      console.log("effectiveType:", effectiveType || "n/a", "saveData:", saveData);
      console.log("prefersReducedMotion:", prefersReducedMotion);
      console.log("score:", score);
      console.log("benchmarkUsed:", shouldBenchmark);

      if (shouldBenchmark && typeof frames === "number" && typeof longFrames === "number") {
        console.log("benchmark frames:", frames);
        console.log("benchmark longFrames:", longFrames);
      }

      console.log("➡️ FINAL low-end:", finalLowEnd);
      console.log("reason:", reason);
      console.groupEnd();
    }
  };

  // If user forces full, never enable low-end
  if (forceFull) {
    finish(false, "forceFull(?full)");
    return;
  }

  // Manual override (super useful for testing)
  if (forceLite) {
    finish(true, "forceLite(?lite)");
    return;
  }

  // 1) Use cached decision if we have it (avoid reruns)
  const cached = sessionStorage.getItem("barko_low_end");
  if (cached === "1") {
    document.body.classList.add("low-end");
    if (debugOn) console.log("[Barko] cached: low-end ON");
    return;
  }
  if (cached === "0") {
    document.body.classList.remove("low-end");
    if (debugOn) console.log("[Barko] cached: low-end OFF");
    return;
  }

  // 2) Score-based heuristic (more precise than OR)
  score = 0;

  // Strong signals
  if (isMobile) score += 1;
  if (saveData) score += 3;
  if (effectiveType.includes("2g")) score += 3;

  // HardwareF: deviceMemory is often capped/lying on Android. Keep it conservative.
  // NOTE: deviceMemory typically returns 0.5/1/2/4/8. "mem < 1" targets 0.5 only.
  if (mem && mem < 1) score += 2;       // 0.5GB class
  else if (mem && mem <= 4) score += 1; // 1–4GB class (light weight)

  if (cores && cores <= 2) score += 3;
  else if (cores && cores <= 4) score += 1;

  // Preference signal (not always performance, so lighter weight)
  if (prefersReducedMotion) score += 1;

  // If score is already high, decide immediately
  const isLowEndByScore = score >= 4;

  // 3) Runtime smoothness test only when uncertain (score 2–3)
  shouldBenchmark = !isLowEndByScore && score >= 2 && score <= 3;

  if (!shouldBenchmark) {
    finish(isLowEndByScore, isLowEndByScore ? "score>=4" : "score<4");
    return;
  }

 // Benchmark branch (only if page is visible + focused)
if (document.visibilityState !== "visible" || !document.hasFocus()) {
  finish(false, "benchmark-skipped(not visible/focused)");
  return;
}

// Give the page a moment to settle (fonts/layout)
setTimeout(() => {
  const start = performance.now();
  frames = 0;
  longFrames = 0;
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

    // If frames are extremely low, benchmark was likely throttled -> invalid
    // (e.g., tab not truly active, power saver throttling, etc.)
    if (frames < 30) {
      // fall back to score decision instead of forcing low-end
      finish(false, `benchmark-invalid(frames=${frames}, long=${longFrames})`);
      return;
    }

    const lowByFrames = frames < 45;
    const lowByLongs = longFrames > 6;
    const finalLowEnd = lowByFrames || lowByLongs;

    finish(finalLowEnd, `benchmark(frames=${frames}, long=${longFrames})`);
  };

  requestAnimationFrame(tick);
}, 250);


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
   SECTION REVEAL (FAIL-SAFE)
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
  const sectionsWithId = document.querySelectorAll("section[id]");

  if (navLinks.length && sectionsWithId.length) {
    window.addEventListener(
      "scroll",
      () => {
        let current = "";
        const y = window.scrollY;

        sectionsWithId.forEach((section) => {
          if (y >= section.offsetTop - 150) current = section.id;
        });

        navLinks.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
        });
      },
      { passive: true }
    );
  }

  /* =========================
     HEADER SHRINK
  ========================= */
  const header = document.querySelector("header");
  if (header) {
    window.addEventListener(
      "scroll",
      () => {
        header.classList.toggle("header-small", window.scrollY > 80);
      },
      { passive: true }
    );
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
        }
      }
    });
  };

  const menuObserver = new IntersectionObserver(
    (entries) => {
      // πάρε το πιο “κεντρικό” intersecting entry
      const hits = entries.filter((e) => e.isIntersecting);
      if (!hits.length) return;

      // διαλέγουμε αυτό με το μεγαλύτερο intersection ratio
      hits.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      const id = hits[0].target.id;
      if (!id || id === lastActiveId) return;

      lastActiveId = id;
      setActive(id);
    },
    {
      // πιο “φυσικό” για sticky sidebar + header
      rootMargin: "-35% 0px -55% 0px",
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
   DISH MODAL (INDEX)
========================= */
const modal = document.getElementById("dishModal");
const modalImg = document.getElementById("modalImg");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");

if (modal && modalImg && modalTitle && modalText) {

  document.querySelectorAll(".menu-item").forEach(item => {
    item.addEventListener("click", () => {
      modalImg.src = item.dataset.img || "";
      modalTitle.textContent = item.dataset.title || "";
      modalText.textContent = item.dataset.text || "";
      modal.classList.add("open");
    });
  });

  modal.addEventListener("click", (e) => {
    if (
      e.target.classList.contains("dish-modal") ||
      e.target.classList.contains("modal-close")
    ) {
      modal.classList.remove("open");
    }
  });

}



