/* Page 4 Islands : la journée et la carte suivent le bateau choisi dans le bloc « Choose your boat » (v4-product.js,
   événement stt-pick). Sur bureau, la carte suit la lecture de la journée. La visionneuse se charge au premier geste
   sur la galerie. */
(function () {
  "use strict";
  var V = window.V4;
  var dataEl = document.getElementById("four-data");
  if (!V || !dataEl) return;
  var $ = V.$, $$ = V.$$;
  var D = JSON.parse(dataEl.textContent);
  var boatOf = function (id) { var o = D.options.filter(function (x) { return x.id === id; })[0]; return o ? o.boat : D.options[0].boat; };

  // ---------- La journée et la carte ----------
  var map = $("[data-map]");
  var tls = $$("[data-tl]"), boatEl = map && $("[data-map-boat]", map);
  var boatNow = "", io = null;
  var desk = matchMedia("(min-width: 900px)");
  function stopXY(place) {
    var g = $('[data-map-route="' + boatNow + '"]', map);
    var c = place && $('[data-stop="' + place + '"]', g);
    if (c) return [c.getAttribute("cx"), c.getAttribute("cy")];
    // Hors des îles, le bateau attend à son départ : Lanta Old Town, ou le bord nord de la carte (Koh Lanta Noi, Ao Nang).
    return [g.getAttribute("data-start-x"), g.getAttribute("data-start-y")];
  }
  function activate(step) {
    if (!step) return;
    var list = $('[data-tl="' + boatNow + '"]');
    var steps = $$(".tl__step", list), i = steps.indexOf(step), place = step.getAttribute("data-place");
    steps.forEach(function (s, k) { s.classList.toggle("is-on", k === i); });
    if (!map) return;
    var g = $('[data-map-route="' + boatNow + '"]', map);
    var stops = $$("[data-stop]", g).map(function (c) { return c.getAttribute("data-stop"); });
    var at = stops.indexOf(place);
    var lit = at > -1 ? at + 1 : (i === steps.length - 1 && i > 0 ? stops.length + 1 : 0);
    $$(".map__lit", g).forEach(function (p, k) { p.classList.toggle("is-on", k < lit); });
    $$("[data-stop]", g).forEach(function (c) { c.classList.toggle("is-on", c.getAttribute("data-stop") === place); });
    $$(".map__lbl", map).forEach(function (t) { t.classList.toggle("is-on", t.getAttribute("data-lbl") === place); });
    var xy = at > -1 ? stopXY(place) : stopXY(null);
    boatEl.setAttribute("transform", "translate(" + xy[0] + " " + xy[1] + ")");
  }
  // L'étape lue est la dernière dont le haut a passé le milieu de l'écran, sur bureau seulement (la carte n'est pas
  // montrée sur téléphone : aucune étape ne s'allume sans raison).
  var onStep = null, ticking = false;
  function pickStep() {
    ticking = false;
    if (!desk.matches) { $$(".tl__step.is-on").forEach(function (s) { s.classList.remove("is-on"); }); onStep = null; return; }
    var steps = $$('[data-tl="' + boatNow + '"] .tl__step');
    var mid = innerHeight * 0.55, cur = steps[0];
    steps.forEach(function (s) { if (s.getBoundingClientRect().top < mid) cur = s; });
    if (cur && cur !== onStep) { onStep = cur; activate(cur); }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(pickStep); } }
  function watchDay() {
    onStep = null;
    pickStep();
    if (io || !("IntersectionObserver" in window)) return;
    io = new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) { addEventListener("scroll", onScroll, { passive: true }); pickStep(); }
      else removeEventListener("scroll", onScroll);
    });
    io.observe($("#day"));
  }
  function drawDay(boat) {
    if (boat === boatNow) return;
    boatNow = boat;
    tls.forEach(function (l) { l.hidden = l.getAttribute("data-tl") !== boat; });
    $$("[data-day-for]").forEach(function (p) { p.hidden = p.getAttribute("data-day-for") !== boat; });
    if (map) {
      $$("[data-map-route]", map).forEach(function (g) { if (g.getAttribute("data-map-route") === boat) g.removeAttribute("hidden"); else g.setAttribute("hidden", ""); });
      var names = D.islands[boat].map(function (x) { return x.name; });
      ["Koh Ma", "Koh Kradan"].forEach(function (n) { var t = $('.map__lbl[data-lbl="' + n + '"]', map); if (t) t.classList.toggle("is-gone", names.indexOf(n) < 0); });
      // Départ de chaque bateau : Lanta Old Town (longtails), Koh Lanta Noi au nord (speedboat), Ao Nang (catamaran).
      var g = $('[data-map-route="' + boat + '"]', map), pier = $("[data-pier]", map);
      var sx = g.getAttribute("data-start-x"), sy = g.getAttribute("data-start-y");
      var atPier = pier && pier.getAttribute("cx") === sx && pier.getAttribute("cy") === sy;
      if (pier) pier.classList.toggle("is-gone", !atPier);
      var old = $('.map__lbl[data-lbl="Lanta Old Town"]', map);
      if (old) old.classList.toggle("is-gone", !atPier);
      var noi = $('.map__lbl[data-lbl="To Koh Lanta Noi pier"]', map), an = $('.map__lbl[data-lbl="To Ao Nang"]', map);
      var away = boat === "catamaran" || D.options.some(function (o) { return o.boat === boat && /catamaran/.test(o.boat); });
      if (an) an.classList.toggle("is-gone", !(away && !atPier));
      if (noi) noi.classList.toggle("is-gone", away || atPier);
    }
    activate($('[data-tl="' + boat + '"] .tl__step'));
    watchDay();
  }

  // Ligne « On a private boat » de « Included » : mise en avant quand le bateau privé est choisi.
  function onPick(id) {
    var priv = /^private/.test(id);
    $$("[data-private]").forEach(function (li) { li.classList.toggle("is-lit", priv); });
    drawDay(boatOf(id));
  }
  document.addEventListener("stt-pick", function (e) { if (e.detail) onPick(e.detail.option); });
  var cur = $('#options input[name="pick"]:checked');
  onPick(cur ? cur.value : D.options[0].id);
  if (desk.addEventListener) desk.addEventListener("change", pickStep);

  // ---------- Galerie : la visionneuse arrive au premier geste ----------
  var gal = $("[data-gal]");
  if (gal) {
    var warm = function () { V.load("/js/v4-lightbox.js"); };
    gal.addEventListener("pointerenter", warm, { once: true });
    gal.addEventListener("touchstart", warm, { once: true, passive: true });
    gal.addEventListener("click", function (e) {
      var a = e.target.closest("[data-gal-i]");
      if (!a || e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      V.load("/js/v4-lightbox.js").then(function () { window.V4_LIGHTBOX(gal).open(Number(a.getAttribute("data-gal-i"))); });
    });
  }
})();
