/* Page 4 Islands v4 : un seul état (option, adultes, âge de chaque enfant, Koh Kradan) partagé entre le parcours,
   le calculateur, le comparateur, la bande du bas et la feuille de réservation (même brouillon que booking.js).
   La carte suit la lecture de la journée. La visionneuse se charge au premier geste sur la galerie. */
(function () {
  "use strict";
  var V = window.V4, B = window.STT_BOOKING, PR = window.STT_PRICE;
  var dataEl = document.getElementById("four-data");
  if (!V || !B || !PR || !dataEl) return;
  var $ = V.$, $$ = V.$$;
  var D = JSON.parse(dataEl.textContent);
  var KEY = "stt-book:" + D.slug;
  var byId = function (id) { return D.options.filter(function (o) { return o.id === id; })[0] || D.options[0]; };

  // ---------- État : lu dans le brouillon de la feuille, écrit au même endroit ----------
  var st = { option: D.options[0].id, adults: 2, childAges: [], addons: [] };
  var touched = false;
  function readDraft() {
    try { return B.restoreDraft(localStorage.getItem(KEY), new Date()); } catch (e) { return null; }
  }
  var saved = readDraft();
  if (saved) {
    if (saved.option) st.option = byId(saved.option).id;
    if (saved.adults > 0) st.adults = saved.adults;
    if (Array.isArray(saved.childAges)) st.childAges = saved.childAges;
    if (Array.isArray(saved.addons)) st.addons = saved.addons;
    touched = true;
  }
  function writeDraft() {
    var draft = readDraft() || B.emptyState({});
    draft.option = st.option; draft.adults = st.adults; draft.childAges = st.childAges.slice(); draft.addons = st.addons.slice();
    try { localStorage.setItem(KEY, B.makeDraft(draft, new Date())); } catch (e) { /* stockage indisponible */ }
  }
  function set(patch, from) {
    Object.assign(st, patch);
    touched = true;
    if (from !== "sheet") writeDraft();
    render(from);
  }
  document.addEventListener("stt-book-change", function (e) {
    var d = e.detail;
    if (!d || d.productId !== D.slug) return;
    set({ option: d.state.option ? byId(d.state.option).id : st.option, adults: d.state.adults > 0 ? d.state.adults : st.adults, childAges: d.state.childAges || [], addons: d.state.addons || [] }, "sheet");
  });

  // ---------- Longtail ou speedboat : segment, parcours qui se réorganise, Koh Kradan ----------
  var seg = V.seg($('[data-seg="opt"]'), function (v) { set({ option: v, addons: [] }, "seg"); });
  var route = $("[data-route]");
  var kr = $("[data-kradan]");
  if (kr) $("input", kr).addEventListener("change", function (e) { set({ addons: e.target.checked ? [D.kradan] : [] }, "kradan"); });
  function routeHTML(opt) {
    var list = D.islands[opt.boat].slice();
    if (opt.kind === "private" && st.addons.indexOf(D.kradan) > -1) list.push({ name: "Koh Kradan", tag: "" });
    var nodes = [{ name: "Koh Lanta", tag: opt.pier || "", end: true, id: "isl-start" }]
      .concat(list.map(function (i) { return { name: i.name, tag: i.tag, lunch: i.name === D.lunch[opt.boat], id: "isl-" + i.name.toLowerCase().replace(/[^a-z]+/g, "-") }; }))
      .concat([{ name: "Koh Lanta", tag: "Back to your hotel", end: true, id: "isl-end" }]);
    return nodes.map(function (n) {
      return '<li data-vt-n="' + n.id + '"' + (n.end ? ' class="is-end"' : "") + "><b>" + V.esc(n.name) + "</b>" + (n.tag ? "<small>" + V.esc(n.tag) + "</small>" : "") + (n.lunch ? '<span class="lunch">Lunch</span>' : "") + "</li>";
    }).join("");
  }
  var lastRoute = null;
  function drawRoute(opt) {
    var html = routeHTML(opt);
    if (lastRoute === null) { lastRoute = route.innerHTML.replace(/\s+/g, " "); }
    if (html === lastRoute) return;
    lastRoute = html;
    var name = function (on) { route.classList.toggle("is-morph", on); $$("li", route).forEach(function (li) { li.style.viewTransitionName = on ? li.getAttribute("data-vt-n") : ""; }); };
    if (!$("li[data-vt-n]", route)) { route.innerHTML = html; return; }
    name(true);
    V.vt(function () { route.innerHTML = html; name(true); }).then(function () { name(false); });
  }

  // ---------- Calculateur : adultes, âge de chaque enfant, total ligne par ligne, parc en espèces à part ----------
  var calc = $("[data-calc]");
  var agesBox = $("[data-ages]", calc);
  calc.addEventListener("click", function (e) {
    var b = e.target.closest("[data-step]");
    if (!b) return;
    var d = Number(b.getAttribute("data-d"));
    if (b.getAttribute("data-step") === "adults") set({ adults: V.clamp(st.adults + d, 1, 30) }, "calc");
    else {
      var a = st.childAges.slice();
      if (d > 0 && a.length < 12) a.push(""); else if (d < 0) a.pop();
      set({ childAges: a }, "calc");
    }
  });
  agesBox.addEventListener("change", function (e) {
    var s = e.target.closest("select");
    if (!s) return;
    var a = st.childAges.slice();
    a[Number(s.getAttribute("data-age"))] = s.value === "" ? "" : Number(s.value);
    set({ childAges: a }, "ages");
  });
  function drawAges(from) {
    if (from === "ages") return;
    while (agesBox.children.length > st.childAges.length) agesBox.lastElementChild.remove();
    for (var i = agesBox.children.length; i < st.childAges.length; i++) {
      var l = document.createElement("label");
      l.className = "agesel";
      l.innerHTML = "Age of child " + (i + 1) + '<select data-age="' + i + '"><option value="">Choose</option>' +
        Array.from({ length: D.adultFrom }, function (_, n) { return '<option value="' + n + '">' + (n === 0 ? "Under 1" : n) + "</option>"; }).join("") + "</select>";
      agesBox.appendChild(l);
    }
    $$("select", agesBox).forEach(function (s, k) { s.value = st.childAges[k] === "" || st.childAges[k] == null ? "" : String(st.childAges[k]); });
  }
  function kids() { return st.childAges.filter(function (a) { return a !== "" && a !== null && a !== undefined; }); }
  function unpricedText(u) { return u.length ? "Age " + u.map(function (a) { return a === 0 ? "under 1" : a; }).join(", ") + ": no price on the site for this boat, we confirm it on WhatsApp." : ""; }

  // ---------- Comparateur : la ligne « For … » suit le calculateur ----------
  var cmp = $("[data-cmp]");
  cmp.addEventListener("click", function (e) {
    var b = e.target.closest("[data-pick]");
    if (!b) return;
    set({ option: b.getAttribute("data-pick"), addons: [] }, "compare");
    V.toast(byId(st.option).label + " selected. Your total is updated.", innerWidth < 900 ? "See the total" : "", function () { calc.scrollIntoView({ behavior: V.reduce.matches ? "auto" : "smooth", block: "center" }); });
  });

  // ---------- La journée et la carte ----------
  var map = $("[data-map]"), fold = $("[data-map-fold]");
  var tls = $$("[data-tl]"), boatEl = $("[data-map-boat]", map);
  var boatNow = "longtail", io = null;
  function stopXY(place) {
    var c = place && $('[data-map-route="' + boatNow + '"] [data-stop="' + place + '"]', map);
    if (c) return [c.getAttribute("cx"), c.getAttribute("cy")];
    var p = $(".map__stop--pier", map);
    return [p.getAttribute("cx"), p.getAttribute("cy")];
  }
  function activate(step) {
    var list = $('[data-tl="' + boatNow + '"]');
    var steps = $$(".tl__step", list), i = steps.indexOf(step), place = step.getAttribute("data-place");
    steps.forEach(function (s, k) { s.classList.toggle("is-on", k === i); });
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
  // L'étape lue est la dernière dont le haut a passé le milieu de l'écran ; écoute du défilement seulement
  // quand la journée est à l'écran.
  var onStep = null, ticking = false;
  function pickStep() {
    ticking = false;
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
    if (boat === boatNow && io) return;
    boatNow = boat;
    tls.forEach(function (l) { l.hidden = l.getAttribute("data-tl") !== boat; });
    $("[data-day-for]").hidden = boat !== "longtail";
    $("[data-day-speed]").hidden = boat === "longtail";
    $$("[data-map-route]", map).forEach(function (g) { if (g.getAttribute("data-map-route") === boat) g.removeAttribute("hidden"); else g.setAttribute("hidden", ""); });
    var names = D.islands[boat].map(function (x) { return x.name; });
    ["Koh Ma", "Koh Kradan"].forEach(function (n) { var t = $('.map__lbl[data-lbl="' + n + '"]', map); if (t) t.classList.toggle("is-gone", names.indexOf(n) < 0); });
    activate($('[data-tl="' + boat + '"] .tl__step'));
    watchDay();
  }
  fold.addEventListener("click", function () {
    var open = !map.classList.contains("is-open");
    map.classList.toggle("is-open", open);
    fold.setAttribute("aria-expanded", open ? "true" : "false");
    $("span", fold).textContent = open ? "Hide the route map" : "Show the route map";
  });

  // ---------- Rendu de tout ce qui suit l'état ----------
  var odoTotal = $('[data-odo="total"]');
  var dockP = $("[data-dock-p]");
  function render(from) {
    var opt = byId(st.option);
    seg.select(opt.id, true);
    drawRoute(opt);
    var priv = opt.kind === "private";
    if (kr) { kr.hidden = !priv; $("input", kr).checked = st.addons.indexOf(D.kradan) > -1; }
    $("[data-opt-note]").textContent = opt.note || opt.stub || "";
    $("[data-boat-ph]").classList.toggle("is-off", opt.boat !== "longtail");
    $$("[data-private]").forEach(function (li) { li.classList.toggle("is-lit", priv); li.classList.toggle("is-dim", !priv); });

    $('[data-out="adults"]', calc).textContent = st.adults;
    $('[data-out="children"]', calc).textContent = st.childAges.length;
    $('[data-step="adults"][data-d="-1"]', calc).disabled = st.adults <= 1;
    $('[data-step="children"][data-d="-1"]', calc).disabled = !st.childAges.length;
    drawAges(from);
    var addons = priv ? st.addons : [];
    var est = PR.estimate(opt, st.adults, kids(), addons);
    $("[data-calc-opt]", calc).textContent = opt.label + (addons.length ? ", with Koh Kradan" : "");
    $("[data-calc-lbl]", calc).textContent = est ? (est.perBoat ? "Estimated total, the whole boat" : "Estimated total") : "Price on WhatsApp for this group";
    $(".calc__total > b", calc).hidden = !est;
    if (est) V.odo(odoTotal, est.total);
    $("[data-calc-lines]", calc).innerHTML = est ? est.lines.map(function (l) { return "<li><span>" + V.esc(l[0]) + "</span><span>" + V.thb(l[1]) + "</span></li>"; }).join("") : "";
    var un = $("[data-calc-unpriced]", calc);
    un.hidden = !(est && est.unpriced.length);
    un.textContent = est ? unpricedText(est.unpriced) : "";
    var park = PR.parkCash(D.fee, st.adults, st.childAges), pk = $("[data-calc-park]", calc);
    if (pk) { pk.hidden = !park; if (park) pk.textContent = "Plus the national park fee, in cash on the island: " + park.text + "."; }
    $$("[data-calc-book], [data-dock-book]").forEach(function (b) { b.setAttribute("data-book", opt.id); });

    var who = B.guestsLine(st.adults, kids());
    $$("[data-cmp-who]", cmp).forEach(function (w) { w.textContent = who; });
    $$(".cmp4__col", cmp).forEach(function (col) {
      var o = byId(col.getAttribute("data-opt")), sel = o.id === opt.id;
      var e = PR.estimate(o, st.adults, kids(), sel && o.kind === "private" ? addons : []);
      $("[data-cmp-total]", col).innerHTML = e ? "<b>" + V.thb(e.total) + "</b>" + (e.unpriced.length ? "<small>" + V.esc(unpricedText(e.unpriced)) + "</small>" : "") : "Price on WhatsApp";
      col.classList.toggle("is-sel", sel);
      $("[data-pick]", col).setAttribute("aria-pressed", sel ? "true" : "false");
    });

    dockP.innerHTML = est && touched ? "<span>" + V.esc(who) + "</span><b>" + V.thb(est.total) + "</b>" : dockP.innerHTML;
    drawDay(opt.boat);
  }
  render("init");

  // ---------- Bande du bas : quand le bouton du haut est sorti de l'écran, jamais devant le calculateur ni le pied ----------
  var dock = $("[data-dock]"), heroOut = false, footIn = false, calcIn = false;
  function dockState() {
    var on = heroOut && !footIn && !calcIn;
    dock.classList.toggle("is-on", on);
    dock.setAttribute("aria-hidden", on ? "false" : "true");
    $("[data-dock-book]").tabIndex = on ? 0 : -1;
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e) { heroOut = !e[0].isIntersecting && e[0].boundingClientRect.top < 0; dockState(); }).observe($("[data-cta]"));
    new IntersectionObserver(function (e) { footIn = e[0].isIntersecting; dockState(); }).observe($("#ft"));
    new IntersectionObserver(function (e) { calcIn = e[0].isIntersecting; dockState(); }, { threshold: 0.3 }).observe(calc);
  }

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
