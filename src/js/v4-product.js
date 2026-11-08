/* Pages produit v4 (bateaux, activités, location, speedboat) : la bande du bas apparaît quand le bouton du haut
   est sorti de l'écran, et s'efface devant les options (leurs boutons font le même travail) et le pied de page.
   La feuille de réservation (booking.js) s'ouvre seule sur chaque [data-book]. */
(function () {
  "use strict";
  var V = window.V4;
  if (!V) return;
  var $ = V.$;
  var dock = $("[data-dock]"), cta = $("[data-cta]"), opts = $("#options"), ft = $("#ft");
  if (!dock || !cta || !("IntersectionObserver" in window)) return;
  var heroOut = false, footIn = false, optsIn = false;
  function state() {
    var on = heroOut && !footIn && !optsIn;
    dock.classList.toggle("is-on", on);
    dock.setAttribute("aria-hidden", on ? "false" : "true");
    $("[data-dock-book]", dock).tabIndex = on ? 0 : -1;
  }
  new IntersectionObserver(function (e) { heroOut = !e[0].isIntersecting && e[0].boundingClientRect.top < 0; state(); }).observe(cta);
  if (ft) new IntersectionObserver(function (e) { footIn = e[0].isIntersecting; state(); }).observe(ft);
  if (opts) new IntersectionObserver(function (e) { optsIn = e[0].isIntersecting; state(); }, { rootMargin: "-35% 0px -35% 0px" }).observe(opts);
})();
