if (localStorage.getItem("barko_theme") === "dark") document.documentElement.classList.add("dark");

(() => {
  "use strict";
  document.addEventListener("DOMContentLoaded", () => {
    initActiveNavLink();
    initBurgerMenu();
    initLanguageDropdown();
    initConsent();
    initScrollProgress();
    initHeaderScroll();
    initScrollAnimations();
    initCountUp();
    initHeroParallax();
    initCustomCursor();
    initCardTilt();
    const btn = document.getElementById("openCookieSettings");
    if (btn) {
      btn.addEventListener("click", () => {
        const banner = document.getElementById("consentBanner");
        if (banner) banner.classList.add("show");
      });
    }
    initDishModal();
    initThemeToggle();
  });

  function initConsent() {
    const KEY = "barko_cookie_choice";
    const banner = document.getElementById("consentBanner");
    const accept = document.getElementById("consentAccept");
    const reject = document.getElementById("consentReject");

    if (!banner || !accept || !reject) return;

    const choice = localStorage.getItem(KEY);
    if (!choice) {
      setTimeout(() => {
        banner.classList.add("show");
      }, 8000);
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
    window["ga-disable-G-W5LVLHN94F"] = false;
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=G-W5LVLHN94F";
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", "G-W5LVLHN94F");
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
      const isOpen = mobileNav.classList.toggle("open");
      burger.setAttribute("aria-expanded", isOpen);
    });
    mobileNav.addEventListener("click", (e) => e.stopPropagation());
    document.addEventListener("click", (e) => {
      if (!mobileNav.contains(e.target) && !burger.contains(e.target)) {
        mobileNav.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
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

  function initScrollProgress() {
    const bar = document.createElement('div');
    bar.id = 'scroll-progress';
    document.body.prepend(bar);
    window.addEventListener('scroll', () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    }, { passive: true });
  }

  function initHeroParallax() {
    const inner = document.querySelector('.hero-inner');
    const hero = document.querySelector('.hero');
    if (!inner || !hero) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(max-width: 768px)').matches) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          if (scrollY <= hero.offsetHeight) {
            inner.style.transform = `translateY(${scrollY * 0.16}px)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  function initHeaderScroll() {
    const header = document.querySelector('header');
    if (!header) return;
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initScrollAnimations() {
    if (!('IntersectionObserver' in window)) return;

    const sections = document.querySelectorAll('.section');
    if (sections.length) {
      const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.remove('section-hidden');
            entry.target.classList.add('section-visible');
            sectionObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.07, rootMargin: '0px 0px -40px 0px' });

      sections.forEach(el => {
        if (el.querySelector('.home-grid')) return;
        el.classList.add('section-hidden');
        sectionObserver.observe(el);
      });
    }

    const grid = document.querySelector('.home-grid');
    if (grid) {
      const cards = Array.from(grid.querySelectorAll('.menu-item'));
      cards.forEach(card => { card.style.opacity = '0'; });

      const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          cards.forEach((card, i) => {
            setTimeout(() => {
              card.style.opacity = '';
              card.classList.add('card-visible');
            }, i * 80);
          });
          cardObserver.unobserve(entry.target);
        });
      }, { threshold: 0.05 });

      cardObserver.observe(grid);
    }

    const bandDark = document.querySelector('.band-dark');
    if (bandDark) {
      const bandObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('band-reveal');
            bandObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      bandDark.style.opacity = '0';
      bandObserver.observe(bandDark);
      bandDark.addEventListener('animationstart', () => { bandDark.style.opacity = ''; }, { once: true });
    }
  }

  function initCountUp() {
    if (!('IntersectionObserver' in window)) return;
    const stats = document.querySelectorAll('.stat-number');
    if (!stats.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const original = el.textContent.trim();
        const match = original.match(/^([^\d]*)(\d[\d.]*)(.*)$/);
        if (!match) return;
        const [, prefix, numStr, suffix] = match;
        const target = parseFloat(numStr);
        if (isNaN(target)) return;
        const isDecimal = numStr.includes('.');
        const duration = 1300;
        const startTime = performance.now();

        const tick = (now) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = target * eased;
          el.textContent = prefix + (isDecimal ? current.toFixed(1) : Math.round(current)) + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        observer.unobserve(el);
      });
    }, { threshold: 0.6 });

    stats.forEach(el => observer.observe(el));
  }

  function initCustomCursor() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.append(dot, ring);
    document.body.classList.add('custom-cursor');

    let mx = -100, my = -100;
    let rx = -100, ry = -100;
    let rafId = null;

    const lerp = (a, b, t) => a + (b - a) * t;

    const loop = () => {
      rx = lerp(rx, mx, 0.12);
      ry = lerp(ry, my, 0.12);
      dot.style.transform = `translate(calc(${mx}px - 50%), calc(${my}px - 50%))`;
      ring.style.transform = `translate(calc(${rx}px - 50%), calc(${ry}px - 50%))`;
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });

    const hoverTargets = 'a, button, .menu-item, .hero-cta, .stat-item, .category-card, [role="button"]';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverTargets)) {
        dot.classList.add('cursor-hover');
        ring.classList.add('cursor-hover');
      }
    }, { passive: true });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverTargets)) {
        dot.classList.remove('cursor-hover');
        ring.classList.remove('cursor-hover');
      }
    }, { passive: true });
  }

  function initCardTilt() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    document.querySelectorAll('.menu-item').forEach(card => {
      let rafId = null;
      let pendingX = 0, pendingY = 0, pendingW = 1, pendingH = 1;

      card.addEventListener('mouseenter', () => {
        card.style.animation = 'none';
        card.style.transition = 'box-shadow 0.32s, border-color 0.32s, opacity 0.32s';
      });
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        pendingX = e.clientX - rect.left;
        pendingY = e.clientY - rect.top;
        pendingW = rect.width;
        pendingH = rect.height;

        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          const W = pendingW, H = pendingH;
          const rawNx = (pendingX - W / 2) / (W / 2);
          const rawNy = (pendingY - H / 2) / (H / 2);
          // Tilt fades to 0 in the outer 25% so the card is flat at the border —
          // prevents the perspective-shrunk hit area from triggering mouseleave loops
          const absMax = Math.max(Math.abs(rawNx), Math.abs(rawNy));
          const edgeT = Math.max(0, (Math.min(1, absMax) - 0.75) / 0.25);
          const scale = 1 - edgeT * edgeT;
          card.style.transform = `perspective(900px) rotateX(${rawNy * scale * -7}deg) rotateY(${rawNx * scale * 7}deg)`;
          card.style.setProperty('--sp-x', `${(pendingX / W * 100).toFixed(1)}%`);
          card.style.setProperty('--sp-y', `${(pendingY / H * 100).toFixed(1)}%`);
        });
      });
      card.addEventListener('mouseleave', () => {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        card.style.transition = 'transform 0.55s cubic-bezier(0.23,1,0.32,1), box-shadow 0.32s, border-color 0.32s, opacity 0.32s';
        card.style.transform = '';
      });
    });
  }

  function initThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const html = document.documentElement;
    const isDark = () => html.classList.contains('dark');
    const apply = (dark) => {
      html.classList.toggle('dark', dark);
      localStorage.setItem('barko_theme', dark ? 'dark' : 'light');
      btn.setAttribute('aria-pressed', String(dark));
    };
    btn.addEventListener('click', () => apply(!isDark()));
    btn.setAttribute('aria-pressed', String(isDark()));
  }

  function initDishModal() {
  const modal = document.getElementById("dishModal");
  const modalImg = document.getElementById("modalImg");
  const modalTitle = document.getElementById("modalTitle");
  const modalText = document.getElementById("modalText");
  
  if (!modal || !modalImg || !modalTitle || !modalText) return;

  const openModal = ({ src, title = "", text = "" }) => {
    modalImg.src = src || "";
    modalImg.alt = title || "";
    modalTitle.textContent = title || "";
    modalText.textContent = text || "";
    modalText.style.display = text ? "" : "none";
    modal.classList.add("open");
    
    if (typeof gtag === 'function') {
      gtag('event', 'view_dish', {
        'dish_name': title,
        'content_type': 'food_item'
      });
    }
  };

  // Event Listener για το κλείσιμο με το Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      modal.classList.remove('open');
    }
  });

  document.addEventListener("click", (e) => {
    const li = e.target.closest(".menu-items li");
    if (li && !e.target.closest("a")) {
      const img = li.querySelector("img");
      if (!img) return;
      const title = li.querySelector(".dish");
      openModal({
        src: img.dataset.modalImg || img.src,
        title: title?.textContent || "",
        text: "",
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