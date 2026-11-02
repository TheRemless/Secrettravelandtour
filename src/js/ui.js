/* Refonte : menu plein écran (mobile) et galeries balayables avec compteur. Sans script, le menu reste
   accessible par le header desktop et la galerie se fait défiler au doigt ou au clavier. */
(function () {
  "use strict";

  // Menu : un <dialog> modal, fermé par le bouton, Échap ou un lien.
  var menu = document.getElementById("menu");
  if (menu && typeof menu.showModal === "function") {
    var opener = null;
    document.addEventListener("click", function (e) {
      var open = e.target.closest("[data-menu-open]");
      if (open) { opener = open; menu.showModal(); return; }
      if (e.target.closest("[data-menu-close]") || (menu.open && e.target.closest("#menu a"))) menu.close();
    });
    menu.addEventListener("close", function () { if (opener) opener.focus(); });
    // Repasser en desktop ferme le menu.
    var wide = window.matchMedia("(min-width: 64rem)");
    var onWide = function () { if (wide.matches && menu.open) menu.close(); };
    if (wide.addEventListener) wide.addEventListener("change", onWide);
  }

  // Galeries : compteur « 1/5 » et boutons précédent / suivant.
  Array.prototype.forEach.call(document.querySelectorAll("[data-gallery]"), function (g) {
    var track = g.querySelector(".gallery-track");
    var items = track ? track.children : [];
    var index = g.querySelector("[data-gallery-index]");
    var prev = g.querySelector("[data-gallery-prev]");
    var next = g.querySelector("[data-gallery-next]");
    if (!track || items.length < 2) return;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function current() {
      var left = track.scrollLeft;
      var best = 0;
      var min = Infinity;
      for (var i = 0; i < items.length; i++) {
        var d = Math.abs(items[i].offsetLeft - track.offsetLeft - left);
        if (d < min) { min = d; best = i; }
      }
      return best;
    }
    function update() {
      var i = current();
      if (index) index.textContent = i + 1;
      var end = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = end;
    }
    function go(step) {
      var i = Math.max(0, Math.min(items.length - 1, current() + step));
      track.scrollTo({ left: items[i].offsetLeft - track.offsetLeft, behavior: reduced ? "auto" : "smooth" });
    }
    var raf = 0;
    track.addEventListener("scroll", function () {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    }, { passive: true });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    });
    if (prev) prev.addEventListener("click", function () { go(-1); });
    if (next) next.addEventListener("click", function () { go(1); });
    update();
  });
})();
