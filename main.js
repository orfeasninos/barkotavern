  // =======================
// SCROLL ANIMATION FOR SECTIONS & MENU ITEMS
// =======================
document.addEventListener('DOMContentLoaded', () => {
  const elements = document.querySelectorAll('.section, .menu-item');

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15 // εμφανίζεται όταν το 15% του element είναι ορατό
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Αν θέλουμε να εμφανιστεί μόνο μια φορά:
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  elements.forEach(el => observer.observe(el));
});

// =======================
// DYNAMIC HEADER ON SCROLL
// =======================
window.addEventListener('scroll', () => {
  const header = document.querySelector('header');
  if(window.scrollY > 50){
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});