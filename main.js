/* =========================
   Barko Tavern – main.js
   Clean & Grace UX
========================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     SMOOTH SCROLL
  ========================= */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", e => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });

  /* =========================
     SECTION REVEAL ON SCROLL
  ========================= */
  const sections = document.querySelectorAll(".section");

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("section-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15
  });

  sections.forEach(section => {
    section.classList.add("section-hidden");
    revealObserver.observe(section);
  });

  /* =========================
     ACTIVE NAV LINK (FIXED)
  ========================= */
  const navLinks = document.querySelectorAll(".header-nav a");
  const sectionsWithId = document.querySelectorAll("section[id]");

  window.addEventListener("scroll", () => {
    let current = "";

    sectionsWithId.forEach(section => {
      const sectionTop = section.offsetTop - 150;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach(link => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("active");
      }
    });
  });

  /* =========================
     HEADER SHRINK ON SCROLL
  ========================= */
  const header = document.querySelector("header");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 80) {
      header.classList.add("header-small");
    } else {
      header.classList.remove("header-small");
    }
  });

  /* =========================
     SCROLL TO TOP BUTTON
  ========================= */
  const topBtn = document.createElement("button");
  topBtn.innerHTML = "↑";
  topBtn.className = "scroll-top";
  document.body.appendChild(topBtn);

  topBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });

  window.addEventListener("scroll", () => {
    topBtn.style.display = window.scrollY > 400 ? "flex" : "none";
  });

  /* =========================
     BURGER MENU TOGGLE
  ========================= */
  const burger = document.getElementById("burger-menu");
  const mobileNav = document.getElementById("mobile-nav");

  if (burger && mobileNav) {
    burger.addEventListener("click", e => {
      e.stopPropagation();
      mobileNav.classList.toggle("open");
    });

    document.addEventListener("click", () => {
      mobileNav.classList.remove("open");
    });
  }

  /* =========================
     LANGUAGE DROPDOWN
  ========================= */
  document.querySelectorAll(".language-switcher").forEach(langSwitcher => {
    const langCurrent = langSwitcher.querySelector(".lang-current");
    const langOptions = langSwitcher.querySelector(".lang-options");

    if (!langCurrent || !langOptions) return;

    langCurrent.addEventListener("click", e => {
      e.stopPropagation();
      langSwitcher.classList.toggle("open");
    });
  });

  // Κλείσιμο dropdown αν κάνεις click εκτός
  document.addEventListener("click", () => {
    document.querySelectorAll(".language-switcher").forEach(ls => {
      ls.classList.remove("open");
    });
  });

});

  /* =========================
     LANGUAGE DETECTION
  ========================= */
document.addEventListener("DOMContentLoaded", () => {
  const userLang = navigator.language || navigator.userLanguage;
  const langCode = userLang.slice(0, 2).toLowerCase();

  const pages = {
    'el': 'index.html',
    'en': 'en/index-en.html',
    'it': 'it/index-it.html',
    'fr': 'fr/index-fr.html'
  };

  // Αντί να ξαναδηλώσεις με const, απλά κάνουμε assign
  let currentPath = window.location.pathname; // ή απλά χρήση χωρίς const

  if (pages[langCode] && !currentPath.includes(pages[langCode])) {
    window.location.href = pages[langCode];
  }
});
