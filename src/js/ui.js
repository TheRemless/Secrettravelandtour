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

  // Saisons à l'heure de Koh Lanta : mois en cours souligné sur la réglette, « Runs today » sur le tableau
  // des départs quand le jour tombe dans la saison, sinon « From 1 Dec ». Sans script, la période reste écrite.
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var bkk = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  var part = function (t) { return Number(bkk.filter(function (p) { return p.type === t; })[0].value); };
  var month = part("month"), md = month * 100 + part("day");
  Array.prototype.forEach.call(document.querySelectorAll(".season-months [data-month]"), function (li) {
    if (Number(li.getAttribute("data-month")) === month) li.classList.add("is-now");
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-season-from]"), function (chip) {
    var f = chip.getAttribute("data-season-from").split("-").map(Number);
    var t = chip.getAttribute("data-season-to").split("-").map(Number);
    var a = f[0] * 100 + f[1], b = t[0] * 100 + t[1];
    var inSeason = a <= b ? md >= a && md <= b : md >= a || md <= b;
    if (inSeason) { chip.textContent = "Runs today"; chip.classList.add("is-today"); }
    else chip.textContent = "From " + f[1] + " " + MONTHS[f[0] - 1];
  });

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
    // En fin de piste, deux photos sont visibles sur desktop : la dernière ne peut pas venir à gauche.
    // Le compteur passe alors au total, pour qu'il soit juste jusqu'à la dernière photo.
    function update() {
      var end = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      var i = end ? items.length - 1 : current();
      if (index) index.textContent = i + 1;
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = end;
    }
    function go(step) {
      var end = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      var from = end && step < 0 ? Math.max(0, items.length - 1 - Math.round(track.clientWidth / items[0].offsetWidth) + 1) : current();
      var i = Math.max(0, Math.min(items.length - 1, from + step));
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
