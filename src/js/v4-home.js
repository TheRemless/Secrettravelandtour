/* Accueil v4 : les trois sorties du haut sont des liens ; sur bureau, survoler ou parcourir au clavier une ligne montre
   sa photo. Rail des activités. Tout le contenu est déjà rendu au build. */
(function () {
  "use strict";
  var V = window.V4;
  if (!V) return;
  var $ = V.$, $$ = V.$$;

  // ---------- Hero : la photo suit la ligne survolée ou parcourue au clavier (bureau seulement) ----------
  var rows = $$("[data-hero-i]"), stack = $("[data-hero-stack]");
  var fine = matchMedia("(hover: hover) and (min-width: 900px)");
  if (rows.length && stack) {
    var cur = 0, loaded = false, hov;
    // Les deux autres photos n'arrivent qu'à la première intention : rien de plus au chargement.
    var hydrate = function () {
      if (loaded) return;
      loaded = true;
      $$("template[data-hero-tpl]", stack).forEach(function (t) {
        var node = t.content.firstElementChild.cloneNode(true);
        node.setAttribute("data-i", t.getAttribute("data-hero-tpl"));
        stack.appendChild(node);
      });
      V.bindImgs(stack);
    };
    var show = function (i) {
      if (i === cur) return;
      cur = i;
      rows.forEach(function (r, j) { if (j === i) r.setAttribute("aria-current", "true"); else r.removeAttribute("aria-current"); });
      $$(".ph", stack).forEach(function (p) { p.classList.toggle("is-on", Number(p.getAttribute("data-i") || 0) === i); });
    };
    rows.forEach(function (r, i) {
      r.addEventListener("pointerenter", function (e) {
        if (e.pointerType !== "mouse" || !fine.matches) return;
        hydrate(); clearTimeout(hov); hov = setTimeout(function () { show(i); }, 90);
      });
      r.addEventListener("pointerleave", function () { clearTimeout(hov); });
      r.addEventListener("focus", function () { if (fine.matches) { hydrate(); show(i); } });
    });
  }

  // ---------- Rail des activités : flèches, barre de progression, glisser-lancer à la souris ----------
  var rail = $("[data-rail]");
  if (rail) {
    var ctl = $("[data-rail-ctl]"), prev = $("[data-rail-prev]"), next = $("[data-rail-next]");
    ctl.hidden = false;
    var page = function (d) { rail.scrollBy({ left: d * rail.clientWidth * 0.9, behavior: V.reduce.matches ? "auto" : "smooth" }); };
    var state = function () {
      var max = rail.scrollWidth - rail.clientWidth;
      prev.disabled = rail.scrollLeft < 4;
      next.disabled = rail.scrollLeft > max - 4;
      if (!CSS.supports("animation-timeline: scroll()")) $(".rail-bar i").style.setProperty("--p", 0.2 + 0.8 * (max ? rail.scrollLeft / max : 1));
    };
    prev.addEventListener("click", function () { page(-1); });
    next.addEventListener("click", function () { page(1); });
    rail.addEventListener("scroll", state, { passive: true });
    addEventListener("resize", state);
    state();
    var d = null;
    rail.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || e.button) return;
      d = { x: e.clientX, s: rail.scrollLeft, t: e.timeStamp, v: 0, moved: false, id: e.pointerId };
    });
    rail.addEventListener("pointermove", function (e) {
      if (!d) return;
      var dx = e.clientX - d.x;
      if (!d.moved && Math.abs(dx) > 6) { d.moved = true; rail.classList.add("is-dragging"); rail.setPointerCapture(d.id); }
      if (!d.moved) return;
      var dt = Math.max(1, e.timeStamp - d.t);
      d.v = (rail.scrollLeft - (d.s - dx)) / dt; d.t = e.timeStamp;
      rail.scrollLeft = d.s - dx;
    });
    var end = function () {
      if (!d) return;
      var moved = d.moved, v = d.v;
      d = null;
      if (!moved) return;
      rail.classList.remove("is-dragging");
      rail.scrollTo({ left: rail.scrollLeft + v * -220, behavior: V.reduce.matches ? "auto" : "smooth" });
      // Un glisser n'ouvre pas la carte sous le curseur
      rail.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); }, { capture: true, once: true });
    };
    rail.addEventListener("pointerup", end);
    rail.addEventListener("pointercancel", end);
  }

})();
