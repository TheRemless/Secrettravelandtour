/* Page 4 Islands : la journée et la carte suivent le bateau choisi dans le bloc « Choose your boat » (v4-product.js,
   événement stt-pick) ou au bouton Longtail / Speedboat de la journée. Sur bureau, l'étape pointée, touchée ou atteinte
   au clavier allume son île sur la carte. Les photos et leur visionneuse sont celles des fiches (v4-product.js). */
(function () {
  "use strict";
  var V = window.V4;
  var dataEl = document.getElementById("four-data");
  if (!V || !dataEl) return;
  var $ = V.$, $$ = V.$$;
  var D = JSON.parse(dataEl.textContent);
  var boatOf = function (id) { var o = D.options.filter(function (x) { return x.id === id; })[0]; return o ? o.boat : D.options[0].boat; };

  var map = $("[data-map]");
  var tls = $$("[data-tl]"), boatEl = map && $("[data-map-boat]", map);
  var seg = $("[data-boat-seg]");
  var boatNow = "";
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
    var steps = $$(".route__step", list), i = steps.indexOf(step), place = step.getAttribute("data-place");
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
  function drawDay(boat) {
    if (boat === boatNow) return;
    boatNow = boat;
    tls.forEach(function (l) { l.hidden = l.getAttribute("data-tl") !== boat; });
    $$("[data-day-for]").forEach(function (p) { p.hidden = p.getAttribute("data-day-for") !== boat; });
    if (seg) $$("button", seg).forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-day-btn") === boat)); });
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
    activate($('[data-tl="' + boat + '"] .route__step'));
    if (V.dayShort) V.dayShort();
  }

  // Étapes : sur bureau, chacune se pointe ou se rejoint au clavier pour allumer son île (la carte n'existe pas sur
  // téléphone : rien ne s'y allume).
  function steps() { $$(".route__step", $("#day")).forEach(function (s) { if (desk.matches) s.tabIndex = 0; else s.removeAttribute("tabindex"); }); }
  $$(".route__step", $("#day")).forEach(function (s) {
    s.addEventListener("pointerenter", function () { if (desk.matches) activate(s); });
    s.addEventListener("focus", function () { if (desk.matches) activate(s); });
    s.addEventListener("click", function () { if (desk.matches) activate(s); });
  });
  steps();
  if (desk.addEventListener) desk.addEventListener("change", steps);

  if (seg) {
    seg.hidden = false;
    seg.addEventListener("click", function (e) {
      var b = e.target.closest("[data-day-btn]");
      if (b) drawDay(b.getAttribute("data-day-btn"));
    });
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
})();
