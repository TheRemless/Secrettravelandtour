/* Fiches v4 (bateaux, activités, 4 Islands, location, speedboat).
   1. Bloc « choisir et réserver » (#options) : l'option choisie, son détail, le groupe (adultes et âge de chaque enfant,
      ou les compteurs de l'option : pilotes, karts), le total estimé (v4-price.js) et les frais à payer sur place.
      Même état que la feuille de réservation (brouillon stt-book:<fiche> de booking.js) : on choisit d'un côté, on
      retrouve de l'autre.
   2. Bande du bas, téléphone seulement : là dès l'arrivée, elle s'efface devant le bloc de réservation, le pied de page
      et la feuille. Une fois le groupe touché, elle dit l'option et le total.
   La feuille s'ouvre seule sur chaque [data-book] (booking.js). */
(function () {
  "use strict";
  var V = window.V4;
  if (!V) return;
  var $ = V.$, $$ = V.$$;
  var B = window.STT_BOOKING, PR = window.STT_PRICE;
  var dock = $("[data-dock]"), ft = $("#ft"), calc = $("[data-calc]");
  var phone = matchMedia("(max-width: 899px)");
  var dataEl = document.getElementById("pick-data");
  var D = null;
  try { D = dataEl ? JSON.parse(dataEl.textContent) : null; } catch (e) { D = null; }

  // ---------- Bande du bas ----------
  // La bande n'arrive qu'une fois le prix et le bouton du haut sortis de l'écran ; en attendant, la liste de sorties
  // garde son propre bouton en bas (is-wait).
  var blockIn = false, footIn = false, buyIn = false;
  function dockState() {
    if (!dock) return;
    var on = phone.matches && !buyIn && !blockIn && !footIn;
    dock.classList.toggle("is-on", on);
    dock.classList.toggle("is-wait", phone.matches && buyIn);
    dock.setAttribute("aria-hidden", on ? "false" : "true");
    $$("a, button", dock).forEach(function (b) { b.tabIndex = on ? 0 : -1; });
  }
  if (dock) {
    var block = calc || $("#options"), buy = $(".phero__buy");
    if ("IntersectionObserver" in window) {
      if (buy) { buyIn = true; new IntersectionObserver(function (e) { buyIn = e[0].isIntersecting; dockState(); }).observe(buy); }
      if (ft) new IntersectionObserver(function (e) { footIn = e[0].isIntersecting; dockState(); }).observe(ft);
      if (block) new IntersectionObserver(function (e) { blockIn = e[0].isIntersecting; dockState(); }, calc ? { threshold: 0.25 } : { rootMargin: "-35% 0px -35% 0px" }).observe(block);
    }
    if (phone.addEventListener) phone.addEventListener("change", dockState);
    dockState();
  }
  // ---------- Location : une catégorie à la fois, choix gardé dans l'adresse (?cat=…) ; la bande du bas suit ----------
  // La bande ne répète pas la catégorie (déjà dans l'onglet) : « Scooters from 250 THB » passait sous le bouton à 390 px.
  var rentSeg = $('[data-seg="rent"]');
  if (rentSeg) {
    var rent = rentSeg.closest(".rent"), cats = $$("[data-cat]", rent);
    var dockP = dock && $("[data-dock-p]", dock), dockB = dock && $("[data-dock-book]", dock);
    var showCat = function (id, b) {
      cats.forEach(function (c) { c.hidden = c.getAttribute("data-cat") !== id; });
      if (dockP && b) dockP.innerHTML = "<span>from " + V.thb(Number(b.getAttribute("data-from"))) + "</span><small>" + V.esc(cats.filter(function (c) { return !c.hidden; })[0].querySelector(".rent__range small").textContent) + "</small>";
      if (dockB) dockB.setAttribute("data-book", id);
    };
    var wanted = new URLSearchParams(location.search).get("cat");
    var first = $$("button", rentSeg).filter(function (b) { return b.value === wanted; })[0] || $("button", rentSeg);
    rentSeg.hidden = false;
    rent.classList.add("is-tabs");
    var rs = V.seg(rentSeg, function (v, b) {
      showCat(v, b);
      // Changement d'onglet après avoir défilé : la nouvelle liste repart sous les onglets, pas au-dessus de l'écran.
      if (phone.matches && rent.getBoundingClientRect().top < 0) rent.scrollIntoView({ block: "start" });
      var u = new URLSearchParams(location.search);
      u.set("cat", v);
      history.replaceState(null, "", location.pathname + "?" + u);
    });
    rs.select(first.value, true);
    showCat(first.value, first);
  }
  // ---------- Speedboat : « From Koh Lanta » ou « To Koh Lanta », un sens à la fois ----------
  var sbSeg = $('[data-seg="sb"]');
  if (sbSeg) {
    var sbs = sbSeg.closest(".sbs"), boards = $$("[data-board]", sbs);
    var showDir = function (v) { boards.forEach(function (b) { b.hidden = b.getAttribute("data-board") !== v; }); };
    sbSeg.hidden = false;
    sbs.classList.add("is-tabs");
    V.seg(sbSeg, showDir);
    showDir("out");
  }
  if (!D || !calc || !PR || !B) return;

  // ---------- État : celui du brouillon de la feuille ----------
  var KEY = "stt-book:" + D.slug;
  var byId = function (id) { return D.options.filter(function (o) { return o.id === id; })[0] || null; };
  var st = { option: D.sel, adults: 2, childAges: [], addons: [], counts: [], choices: {} };
  var touched = false;
  function readDraft() {
    try { return B.restoreDraft(localStorage.getItem(KEY), new Date()); } catch (e) { return null; }
  }
  function fromDraft(s) {
    if (!s) return;
    if (s.option && byId(s.option)) st.option = s.option;
    if (s.adults > 0) st.adults = s.adults;
    if (Array.isArray(s.childAges)) st.childAges = s.childAges.slice();
    if (Array.isArray(s.addons)) st.addons = s.addons.slice();
    if (s.choices) st.choices = Object.assign({}, s.choices);
    var o = byId(st.option);
    if (o && o.counts && s.counts) st.counts = o.counts.map(function (_, i) { return Number(s.counts[o.id + "/" + i]) || 0; });
  }
  var saved = readDraft();
  if (saved) { fromDraft(saved); touched = true; }
  function writeDraft() {
    var draft = readDraft() || B.emptyState({});
    draft.option = st.option; draft.adults = st.adults; draft.childAges = st.childAges.slice(); draft.addons = st.addons.slice();
    draft.choices = Object.assign({}, draft.choices || {}, st.choices);
    draft.counts = draft.counts || {};
    // Mêmes lignes pour toutes les options à compteurs (ATV, karts) : le nombre suit le changement d'option.
    D.options.forEach(function (o) { if (o.counts) o.counts.forEach(function (_, i) { draft.counts[o.id + "/" + i] = st.counts[i] || 0; }); });
    try { localStorage.setItem(KEY, B.makeDraft(draft, new Date())); } catch (e) { /* stockage indisponible */ }
  }
  function set(patch, from) {
    Object.keys(patch).forEach(function (k) { st[k] = patch[k]; });
    touched = true;
    if (from !== "sheet") writeDraft();
    render(from);
  }
  document.addEventListener("stt-book-change", function (e) {
    var d = e.detail;
    if (!d || d.productId !== D.slug) return;
    fromDraft(d.state);
    touched = true;
    render("sheet");
  });

  // ---------- Commandes du bloc ----------
  var sec = $("#options");
  // Le choix touché reste sous le doigt : le détail de l'option quittée se replie au-dessus de lui.
  var heads = null;
  function markHeads() { heads = $$(".po__head", sec).map(function (h) { return [h, h.getBoundingClientRect().top]; }); }
  sec.addEventListener("pointerdown", markHeads);
  sec.addEventListener("keydown", markHeads);
  sec.addEventListener("change", function (e) {
    var t = e.target;
    if (t.name === "pick") {
      set({ option: t.value }, "pick");
      var h = t.closest(".po__head"), was = heads && heads.filter(function (x) { return x[0] === h; })[0];
      if (was) { var dy = h.getBoundingClientRect().top - was[1]; if (dy) scrollBy({ top: dy, behavior: "instant" }); }
      heads = null;
    }
    else if (t.hasAttribute("data-pick-row")) {
      var c = Object.assign({}, st.choices);
      c[st.option + "/" + t.getAttribute("data-choice")] = t.value;
      set({ choices: c }, "row");
    } else if (t.hasAttribute("data-addon")) {
      var a = st.addons.filter(function (x) { return x !== t.value; });
      if (t.checked) a.push(t.value);
      set({ addons: a }, "addon");
    }
  });
  // Grille ATV et karts : toucher un prix choisit sa colonne.
  sec.addEventListener("click", function (e) {
    var td = e.target.closest("td[data-col]");
    if (td && td.getAttribute("data-col") !== st.option) set({ option: td.getAttribute("data-col") }, "pick");
  });
  calc.addEventListener("click", function (e) {
    var b = e.target.closest("[data-step]");
    if (!b || b.disabled) return;
    var d = Number(b.getAttribute("data-d")), kind = b.getAttribute("data-step");
    if (kind === "adults") set({ adults: V.clamp(st.adults + d, 1, 30) }, "calc");
    else if (kind === "children") {
      var a = st.childAges.slice();
      if (d > 0 && a.length < 12) a.push(""); else if (d < 0) a.pop();
      set({ childAges: a }, "calc");
    } else if (kind === "n") {
      var n = st.counts.slice(), i = Number(b.getAttribute("data-i"));
      n[i] = V.clamp((n[i] || 0) + d, 0, 20);
      set({ counts: n }, "calc");
    }
  });
  var agesBox = $("[data-ages]", calc);
  if (agesBox) agesBox.addEventListener("change", function (e) {
    var s = e.target.closest("select");
    if (!s) return;
    var a = st.childAges.slice();
    a[Number(s.getAttribute("data-age"))] = s.value === "" ? "" : Number(s.value);
    set({ childAges: a }, "ages");
  });
  function drawAges(from) {
    if (!agesBox || from === "ages") return;
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
  function kids() { return st.childAges.filter(function (a) { return a !== "" && a !== null && a !== undefined; }).map(Number); }

  // Ligne choisie dans le détail (cours, site, programme de plongée) : celle de l'état, sinon aucune.
  function rowOf(o) {
    var r = $$('[data-po="' + o.id + '"] [data-pick-row]', sec).filter(function (x) { return st.choices[o.id + "/" + x.getAttribute("data-choice")] === x.value; })[0];
    return r ? r.getAttribute("data-pick-row") : "";
  }
  function addonsOf(o) {
    var labels = o.prices.map(function (r) { return r.label; });
    return st.addons.filter(function (a) { return labels.indexOf(a) > -1; });
  }
  function quoteOf(o) {
    if (o.counts) {
      var c = {};
      o.counts.forEach(function (label, i) { c[label] = st.counts[i] || 0; });
      return PR.quote(o, { counts: c });
    }
    var picks = $$('[data-po="' + o.id + '"] [data-pick-row]', sec).map(function (x) { return x.getAttribute("data-pick-row"); });
    var row = rowOf(o);
    // Lignes au même prix (Scuba Explorer, Discover Basic Diver) : le total ne dépend pas du choix, sauf pour l'âge des enfants.
    if (picks.length && !row && !st.childAges.length) {
      var amt = function (l) { return (o.prices.filter(function (r) { return r.label === l; })[0] || {}).amount; };
      if (typeof amt(picks[0]) === "number" && picks.every(function (l) { return amt(l) === amt(picks[0]); })) {
        // Rien n'est choisi à la place du client : la ligne du détail porte le nom de l'option.
        var q0 = PR.quote(o, { adults: st.adults, ages: [], addons: addonsOf(o), row: picks[0] });
        if (q0) q0.lines = q0.lines.map(function (l) { return [l[0].replace(picks[0], o.label), l[1]]; });
        return q0;
      }
    }
    if (picks.length && !row) return { needRow: true };
    return PR.quote(o, { adults: st.adults, ages: kids(), addons: addonsOf(o), row: row });
  }
  function unpricedText(u) { return u.length ? "Age " + u.map(function (a) { return a === 0 ? "under 1" : a; }).join(", ") + ": no price on the site for this option, we confirm it on WhatsApp." : ""; }
  function who() {
    var o = byId(st.option);
    if (o && o.counts) return o.counts.map(function (l, i) { return st.counts[i] ? st.counts[i] + " × " + l.toLowerCase() : ""; }).filter(Boolean).join(", ");
    return B.guestsLine(st.adults, kids());
  }

  // ---------- Rendu ----------
  var odo = $('[data-odo="total"]', calc);
  var dockP = dock ? $("[data-dock-p]", dock) : null;
  var dockFrom = dockP ? dockP.innerHTML : "";
  function render(from) {
    var o = byId(st.option) || D.options[0];
    $$('input[name="pick"]', sec).forEach(function (r) { r.checked = r.value === o.id; });
    $$("[data-po]", sec).forEach(function (p) { p.classList.toggle("is-sel", p.getAttribute("data-po") === o.id); });
    $$("[data-col]", sec).forEach(function (td) { td.classList.toggle("is-sel", td.getAttribute("data-col") === o.id); });
    $$("[data-pick-row]", sec).forEach(function (r) { var po = r.closest("[data-po]").getAttribute("data-po"); r.checked = st.choices[po + "/" + r.getAttribute("data-choice")] === r.value; });
    $$("[data-addon]", sec).forEach(function (x) { x.checked = st.addons.indexOf(x.value) > -1; });
    $("[data-calc-opt]", calc).textContent = o.label;

    if (o.counts) {
      o.counts.forEach(function (_, i) {
        var out = $('[data-out="n' + i + '"]', calc);
        if (out) out.textContent = st.counts[i] || 0;
        var minus = $('[data-step="n"][data-i="' + i + '"][data-d="-1"]', calc);
        if (minus) minus.disabled = !st.counts[i];
      });
    } else if ($('[data-out="adults"]', calc)) {
      $('[data-out="adults"]', calc).textContent = st.adults;
      $('[data-out="children"]', calc).textContent = st.childAges.length;
      $('[data-step="adults"][data-d="-1"]', calc).disabled = st.adults <= 1;
      $('[data-step="children"][data-d="-1"]', calc).disabled = !st.childAges.length;
      drawAges(from);
      var adv = $("[data-advice]", calc);
      if (adv) {
        var young = o.advice && kids().some(function (a) { return a < o.advice.under; });
        adv.hidden = !young;
        adv.textContent = young ? o.advice.text : "";
      }
    }

    var q = quoteOf(o);
    var est = q && !q.needRow ? q : null;
    $("[data-calc-lbl]", calc).textContent = est ? (est.perBoat ? "Estimated total, the whole boat" : "Estimated total") : "Total";
    $("[data-calc-sum]", calc).hidden = !est;
    if (est) V.odo(odo, est.total);
    var conf = $("[data-calc-confirm]", calc);
    conf.hidden = Boolean(est);
    conf.textContent = q && q.needRow ? "Choose a line above to see the total." : o.counts ? (o.priceOnRequest ? "We confirm the total on WhatsApp." : "Add who is coming to see the total.") : "We confirm the total on WhatsApp.";
    $("[data-calc-lines]", calc).innerHTML = est ? est.lines.map(function (l) { return "<li><span>" + V.esc(l[0]) + "</span><span>" + V.thb(l[1]) + "</span></li>"; }).join("") : "";
    var un = $("[data-calc-unpriced]", calc);
    un.hidden = !(est && est.unpriced.length);
    un.textContent = est ? unpricedText(est.unpriced) : "";
    // Frais sur place (parc national, village) : à part, en espèces, jamais dans le total.
    var cash = o.cash && !o.counts ? PR.parkCash(o.cash, st.adults, st.childAges) : null, ce = $("[data-calc-cash]", calc);
    ce.hidden = !cash;
    ce.textContent = cash ? "Plus the " + o.cash.label.toLowerCase() + ", in cash on the day: " + cash.text + "." : "";

    $$("[data-book-sel]").forEach(function (b) { b.setAttribute("data-book", o.id); });
    // Journées : celle de l'option choisie et les blocs communs ; une option sans journée n'en montre aucune autre.
    // Les faits de la sortie (îles, traversée, ponton) restent ; la section disparaît seulement s'il ne reste rien.
    var days = $$(".dayb[data-day-ids]");
    days.forEach(function (d) { var ids = d.getAttribute("data-day-ids"); d.hidden = Boolean(ids) && ids.split(" ").indexOf(o.id) < 0; });
    var daySec = days.length ? days[0].closest("section") : null;
    if (daySec) {
      var none = days.every(function (d) { return d.hidden; });
      var main = $(".day__main", daySec);
      if (main) main.hidden = none;
      daySec.hidden = none && !$(".sidef", daySec);
    }
    if (dockP) {
      // Le groupe seulement : le nom de l'option est déjà coché plus haut et coupait la ligne (« Private longtail to Koh Rok, 2 … »).
      dockP.innerHTML = touched && est && !est.unpriced.length ? "<small>" + V.esc(who() || o.label) + "</small><b>" + V.thb(est.total) + "</b>" : dockFrom;
    }
    if (typeof CustomEvent === "function") document.dispatchEvent(new CustomEvent("stt-pick", { detail: { option: o.id } }));
  }
  render("init");
})();
