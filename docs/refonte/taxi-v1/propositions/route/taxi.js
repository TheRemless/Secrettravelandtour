/* VIP Taxi Lanta : le marquage jaune de la route avance quand on fait défiler la page.
   Une variable CSS (--drive) sur <html>, mise à jour une fois par image ; rien si l'utilisateur réduit les animations. */
(function () {
  if (!document.querySelector(".road")) return;
  var root = document.documentElement;
  var still = window.matchMedia("(prefers-reduced-motion: reduce)");
  var queued = false;
  function paint() {
    queued = false;
    if (still.matches) { root.style.removeProperty("--drive"); return; }
    root.style.setProperty("--drive", ((window.scrollY * 1.6) % 96).toFixed(1) + "px");
  }
  window.addEventListener("scroll", function () {
    if (!queued) { queued = true; requestAnimationFrame(paint); }
  }, { passive: true });
  paint();
})();
