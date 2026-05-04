<script>
  window.addEventListener("load", function () {
    const reviewsSection = document.querySelector('.reviews-section');
    let widgetLoaded = false;
    
    if (reviewsSection && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          // Φορτώνουμε ΜΟΝΟ αν ο χρήστης φτάσει στα reviews
          if (entry.isIntersecting && !widgetLoaded) {
            widgetLoaded = true;
            const script = document.createElement('script');
            script.src = "https://widgets.sociablekit.com/google-reviews/widget.js";
            script.defer = true;
            document.body.appendChild(script);
            observer.disconnect();
          }
        });
      }, { rootMargin: "200px" }); // Μικρότερο margin για να μην "τρέχει" νωρίς
      observer.observe(reviewsSection);
    }
  });
</script>

  <div class="sticky-cta">
  <a href="tel:+302287022660" class="cta-btn call">
    📞 Call
  </a>
  <a href="https://maps.google.com/?q=Barko+Tavern+Milos" 
     target="_blank" 
     class="cta-btn map">
    📍 Directions
  </a>
</div>