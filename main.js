/* =========================
   Barko Tavern – main.js
   Mobile-safe & Smooth UX
   (single init; menu mobile chips + active centering)
========================= */

document.addEventListener("DOMContentLoaded", () => {
  // Mobile detection (used to avoid jank on Android Chrome/Brave)
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

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
if (!isMobile && menuSections.length && menuLinks.length && linksContainer) {
  let lastActiveId = null;
  let rafPending = false;

  const centerActiveChip = (linkEl) => {
    const left =
      linkEl.offsetLeft -
      linksContainer.clientWidth / 2 +
      linkEl.clientWidth / 2;
    linksContainer.scrollTo({
      left,
      behavior: isMobile ? "auto" : "smooth",
    });
  };

  const menuObserver = new IntersectionObserver(
    (entries) => {
      // βρες το πρώτο intersecting (συνήθως 1)
      const hit = entries.find((e) => e.isIntersecting);
      if (!hit) return;

      const id = hit.target.id;
      if (!id) return;

      // ✅ Αν δεν άλλαξε κατηγορία, μην ξανα-κεντράρεις (σταματάει το loop)
      if (id === lastActiveId) return;
      lastActiveId = id;

      menuLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${id}`;
        link.classList.toggle("active", isActive);

        if (isActive) {
          // ✅ Throttle σε 1 φορά ανά frame (πιο smooth, λιγότερο “σπρώξιμο”)
          if (!rafPending) {
            rafPending = true;
            requestAnimationFrame(() => {
              rafPending = false;
              centerActiveChip(link);
            });
          }
        }
      });
    },
    {
      rootMargin: "-40% 0px -50% 0px",
      threshold: 0.01,
    }
  );

  menuSections.forEach((sec) => menuObserver.observe(sec));
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
