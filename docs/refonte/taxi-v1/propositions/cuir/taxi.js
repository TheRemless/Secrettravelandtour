// Barre du bas au téléphone : cachée tant que le bouton de l'en-tête est à l'écran ou pas encore dépassé.
(function () {
  var dock = document.querySelector(".dock");
  var cta = document.querySelector(".panel .btn");
  if (!dock || !cta || !("IntersectionObserver" in window)) return;
  dock.classList.add("is-off");
  new IntersectionObserver(function (entries) {
    var e = entries[0];
    dock.classList.toggle("is-off", e.isIntersecting || e.boundingClientRect.top > 0);
  }).observe(cta);
})();
