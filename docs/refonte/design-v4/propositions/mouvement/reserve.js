/* Feuille de réservation : option, date, voyageurs, prise en charge, message WhatsApp.
   Un seul état partagé avec la page (calculateur, bande du bas) : ce qu'on change d'un côté se voit de l'autre. */
(function () {
  "use strict";
  var $ = M.$, $$ = M.$$;
  var R = (window.R = {});
  var KEY = "stt-mouvement-draft";

  R.state = function (p) {
    var st = { option: p.options[0].id, date: "", adults: 2, ages: [], pickup: "", name: "", kradan: false };
    try {
      var d = JSON.parse(localStorage.getItem(KEY) || "null");
      if (d && d.slug === p.slug && Date.now() - d.t < 7 * 864e5) Object.assign(st, d.st);
      if (st.date && st.date < M.today()) st.date = "";
    } catch (e) {}
    var subs = [];
    return {
      get: function () { return st; },
      opt: function () { return p.options.filter(function (o) { return o.id === st.option; })[0]; },
      set: function (patch, from) {
        Object.assign(st, patch);
        try { localStorage.setItem(KEY, JSON.stringify({ slug: p.slug, t: Date.now(), st: st })); } catch (e) {}
        subs.forEach(function (f) { f(st, from); });
      },
      on: function (f) { subs.push(f); f(st, "init"); }
    };
  };

  // Prix d'appel d'une option, lu dans ses lignes de prix
  R.optFrom = function (o) {
    if (o.priceOnRequest) return "Price on WhatsApp";
    var r = o.prices.filter(function (x) { return !x.supplement && x.amount; })[0];
    return r ? M.thb(r.amount) + " " + (r.group ? "per boat, " + r.label.toLowerCase() : r.label.toLowerCase() === "adult" ? "per adult" : r.label.toLowerCase()) : "";
  };

  // ---------- sélecteur de date : bande de jours + calendrier dépliable ----------
  R.datePicker = function (el, store, opts) {
    opts = opts || {};
    var today = M.today(), days = 21, month = (store.get().date || today).slice(0, 7);
    el.innerHTML = '<div class="days" role="listbox" aria-label="Pick a day"></div>' +
      '<div class="cal-bar"><span class="cal-sel" aria-live="polite"></span><button type="button" class="link cal-toggle" aria-expanded="false">Later date</button></div>' +
      '<div class="cal" hidden><div class="cal__head"><button type="button" class="arrow" data-m="-1" aria-label="Previous month">' + M.icon.left + '</button><b class="cal__title"></b><button type="button" class="arrow" data-m="1" aria-label="Next month">' + M.icon.right + '</button></div><div class="cal__grid" role="grid"></div></div>';
    var strip = $(".days", el), cal = $(".cal", el), grid = $(".cal__grid", el), tog = $(".cal-toggle", el);
    var html = "";
    for (var i = 0; i < days; i++) {
      var iso = M.addDays(today, i), d = new Date(iso + "T00:00:00Z");
      var top = i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-GB", { timeZone: "UTC", weekday: "short" });
      html += '<button type="button" role="option" data-d="' + iso + '"><small>' + top + "</small><b>" + d.getUTCDate() + "</b><small>" + d.toLocaleDateString("en-GB", { timeZone: "UTC", month: "short" }) + "</small></button>";
    }
    strip.innerHTML = html;
    function drawMonth(dir) {
      var y = +month.slice(0, 4), m = +month.slice(5, 7) - 1;
      var first = new Date(Date.UTC(y, m, 1)), start = (first.getUTCDay() + 6) % 7, n = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      $(".cal__title", el).textContent = first.toLocaleDateString("en-GB", { timeZone: "UTC", month: "long", year: "numeric" });
      var cells = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(function (w) { return '<span class="cal__w" aria-hidden="true">' + w.slice(0, 2) + "</span>"; }).join("");
      for (var k = 0; k < start; k++) cells += "<span></span>";
      for (var dd = 1; dd <= n; dd++) {
        var iso = y + "-" + String(m + 1).padStart(2, "0") + "-" + String(dd).padStart(2, "0");
        cells += '<button type="button" data-d="' + iso + '"' + (iso < today ? " disabled" : "") + (iso === today ? ' class="is-today"' : "") + ">" + dd + "</button>";
      }
      grid.innerHTML = cells;
      $('[data-m="-1"]', el).disabled = month <= today.slice(0, 7);
      mark();
      // Le mois glisse dans le sens de la flèche
      if (dir && !M.reduce.matches) grid.animate([{ transform: "translateX(" + dir * 24 + "px)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 260, easing: "cubic-bezier(.22,1,.36,1)" });
    }
    function mark() {
      var cur = store.get().date;
      $$("[data-d]", el).forEach(function (b) { b.setAttribute("aria-selected", b.dataset.d === cur ? "true" : "false"); });
      $(".cal-sel", el).textContent = cur ? M.dateLabel(cur, true) : "No date yet";
    }
    function choose(iso, from) {
      store.set({ date: iso }, "date");
      var b = $('.days [data-d="' + iso + '"]', el);
      if (b && from === "cal") b.scrollIntoView({ inline: "center", block: "nearest", behavior: M.reduce.matches ? "auto" : "smooth" });
      if (b && from === "strip") pulse(b);
    }
    function pulse(b) { if (!M.reduce.matches) b.animate([{ transform: "scale(.92)" }, { transform: "scale(1)" }], { duration: 300, easing: "cubic-bezier(.22,1,.36,1)" }); }
    strip.addEventListener("click", function (e) { var b = e.target.closest("[data-d]"); if (b) choose(b.dataset.d, "strip"); });
    grid.addEventListener("click", function (e) { var b = e.target.closest("[data-d]"); if (b && !b.disabled) { pulse(b); choose(b.dataset.d, "cal"); } });
    $$("[data-m]", el).forEach(function (b) {
      b.addEventListener("click", function () {
        var dir = +b.dataset.m, y = +month.slice(0, 4), m = +month.slice(5, 7) - 1 + dir;
        month = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7);
        drawMonth(dir);
      });
    });
    tog.addEventListener("click", function () {
      var open = cal.hidden;
      cal.hidden = !open;
      tog.setAttribute("aria-expanded", open);
      tog.textContent = open ? "Hide the calendar" : "Later date";
      if (open && !M.reduce.matches) cal.animate([{ opacity: 0, transform: "translateY(-6px)" }, { opacity: 1, transform: "none" }], { duration: 240, easing: "cubic-bezier(.22,1,.36,1)" });
    });
    store.on(function (st, from) { if (from === "date" || from === "init") mark(); });
    drawMonth();
  };

  // ---------- voyageurs : adultes, enfants avec l'âge de chacun ----------
  R.guests = function (el, store, adultFrom, idp) {
    idp = idp || "";
    var kidMax = adultFrom - 1;
    el.innerHTML = '<div class="g-row"><div><b>Adults</b><small>' + adultFrom + ' and over</small></div><div class="stepper"><button type="button" data-k="a" data-d="-1" aria-label="One adult less">−</button><output data-o="a"></output><button type="button" data-k="a" data-d="1" aria-label="One adult more">+</button></div></div>' +
      '<div class="g-row"><div><b>Children</b><small>0 to ' + kidMax + ', we ask each age</small></div><div class="stepper"><button type="button" data-k="c" data-d="-1" aria-label="One child less">−</button><output data-o="c"></output><button type="button" data-k="c" data-d="1" aria-label="One child more">+</button></div></div><div class="ages"></div>';
    var ages = $(".ages", el);
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-k]"); if (!b) return;
      var st = store.get(), d = +b.dataset.d;
      if (b.dataset.k === "a") store.set({ adults: M.clamp(st.adults + d, 1, 30) }, "guests");
      else {
        var a = st.ages.slice();
        if (d > 0 && a.length < 12) a.push(""); else if (d < 0) a.pop();
        store.set({ ages: a }, "guests");
      }
    });
    ages.addEventListener("change", function (e) {
      var s = e.target.closest("select"); if (!s) return;
      var a = store.get().ages.slice(); a[+s.dataset.i] = s.value === "" ? "" : +s.value;
      store.set({ ages: a }, "ages");
    });
    store.on(function (st, from) {
      $('[data-o="a"]', el).textContent = st.adults;
      $('[data-o="c"]', el).textContent = st.ages.length;
      $('[data-k="a"][data-d="-1"]', el).disabled = st.adults <= 1;
      $('[data-k="c"][data-d="-1"]', el).disabled = !st.ages.length;
      if (from === "ages") return;
      var have = $$(".field", ages).length;
      while (have > st.ages.length) { ages.lastChild.remove(); have--; }
      for (var i = have; i < st.ages.length; i++) {
        var f = document.createElement("div");
        f.className = "field age";
        f.innerHTML = '<label for="' + idp + 'age-' + i + '">Age of child ' + (i + 1) + '</label><select id="' + idp + 'age-' + i + '" data-i="' + i + '"><option value="">Choose</option>' +
          Array.from({ length: kidMax + 1 }, function (_, n) { return '<option value="' + n + '">' + (n === 0 ? "Under 1" : n) + "</option>"; }).join("") + "</select>";
        $("select", f).value = st.ages[i] === "" ? "" : String(st.ages[i]);
        ages.appendChild(f);
      }
    });
  };

  // Âge adulte : un an après le plus grand âge enfant des grilles de prix du produit (4 Islands : enfants 4 à 11, donc 12)
  R.adultFrom = function (p) {
    var max = 0;
    p.options.forEach(function (o) { o.prices.forEach(function (r) { if (r.ages && r.ages.max > max) max = r.ages.max; }); });
    return max ? max + 1 : 12;
  };

  // ---------- la feuille complète ----------
  R.mount = function (p, store) {
    var dlg = document.createElement("dialog");
    dlg.className = "sheet"; dlg.setAttribute("aria-labelledby", "sheet-h");
    dlg.innerHTML = '<div class="sheet__scrim"></div><div class="sheet__panel">' +
      '<div class="sheet__grab" aria-hidden="true"></div>' +
      '<div class="sheet__head"><h2 id="sheet-h">Book the ' + M.esc(p.name) + '</h2><button class="x" type="button" data-close aria-label="Close">' + M.icon.close + "</button></div>" +
      '<form class="sheet__body bk" novalidate>' +
      '<fieldset><legend>Boat</legend><div class="opts">' + p.options.map(function (o) {
        return '<label class="opt press"><input type="radio" name="opt" value="' + o.id + '"><span><b>' + M.esc(o.label) + "</b><small>" + M.esc(R.optFrom(o)) + "</small></span></label>";
      }).join("") + '</div><label class="kradan" hidden><input type="checkbox" name="kradan"> <span>Add Koh Kradan, <span class="kr-price"></span></span></label></fieldset>' +
      '<fieldset><legend>Date</legend><div class="dp"></div><p class="err" data-err="date" hidden>Pick a date.</p></fieldset>' +
      '<fieldset><legend>Who is coming</legend><div class="gs"></div><p class="err" data-err="ages" hidden>Choose the age of each child.</p></fieldset>' +
      '<fieldset><legend>Pickup and name</legend><div class="field"><label for="bk-pickup">Hotel or address on Koh Lanta</label><input id="bk-pickup" name="pickup" autocomplete="street-address"></div>' +
      '<div class="field"><label for="bk-name">Your first name</label><input id="bk-name" name="name" autocomplete="given-name"></div></fieldset>' +
      '<details class="preview"><summary>Read the message before you send it</summary><pre class="preview__msg"></pre></details>' +
      "</form>" +
      '<div class="sheet__foot"><div class="total"><small class="total__lbl">Estimated total</small><b><span class="odo" data-total></span> THB</b><small class="total__miss" hidden></small></div>' +
      '<a class="btn btn--lg press" data-send target="_blank" rel="noopener">' + M.icon.wa + "Open WhatsApp</a></div></div>";
    document.body.appendChild(dlg);
    var form = $("form", dlg), send = $("[data-send]", dlg);
    var kr = p.options.map(function (o) { return o.prices.filter(function (r) { return /Koh Kradan/.test(r.label) && r.supplement; })[0]; }).filter(Boolean)[0];
    if (kr) $(".kr-price", dlg).textContent = M.thb(kr.amount) + " " + kr.unit;
    R.datePicker($(".dp", dlg), store);
    R.guests($(".gs", dlg), store, R.adultFrom(p), "bk-");

    form.addEventListener("change", function (e) {
      if (e.target.name === "opt") store.set({ option: e.target.value, kradan: false }, "sheet");
      if (e.target.name === "kradan") store.set({ kradan: e.target.checked }, "sheet");
    });
    form.addEventListener("input", function (e) {
      if (e.target.name === "pickup" || e.target.name === "name") { var o = {}; o[e.target.name] = e.target.value; store.set(o, "text"); }
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); });

    store.on(function (st, from) {
      var opt = store.opt();
      $$('input[name="opt"]', dlg).forEach(function (i) { i.checked = i.value === st.option; });
      var priv = opt.kind === "private" && kr && opt.prices.indexOf(kr) > -1;
      $(".kradan", dlg).hidden = !priv;
      $('input[name="kradan"]', dlg).checked = !!st.kradan;
      if (from !== "text") { $("#bk-pickup", dlg).value = st.pickup; $("#bk-name", dlg).value = st.name; }
      var est = M.estimate(opt, st.adults, st.ages.filter(function (a) { return a !== ""; }), st.kradan && kr ? [kr.label] : []);
      var miss = $(".total__miss", dlg);
      if (est) { M.odo($("[data-total]", dlg), est.total); $(".total b", dlg).hidden = false; $(".total__lbl", dlg).textContent = est.per ? "Estimated total, per boat" : "Estimated total"; }
      else { $(".total b", dlg).hidden = true; $(".total__lbl", dlg).textContent = "Price on WhatsApp"; }
      miss.hidden = !(est && est.missing.length);
      if (est && est.missing.length) miss.textContent = "[DONNÉE À FOURNIR : " + est.missing.join(" ; ") + "]";
      var lines = M.message(p, opt, { date: st.date, adults: st.adults, ages: st.ages.filter(function (a) { return a !== ""; }), pickup: st.pickup.trim(), name: st.name.trim(), kradan: st.kradan });
      $(".preview__msg", dlg).textContent = lines.join("\n");
      send.href = M.wa(lines.join("\n"));
      if (from !== "init") $$("[data-err]", dlg).forEach(function (er) {
        if (er.dataset.err === "date" && st.date) er.hidden = true;
        if (er.dataset.err === "ages" && st.ages.every(function (a) { return a !== ""; })) er.hidden = true;
      });
    });

    // Envoi : si quelque chose manque, le bouton dit non (petit secouement) et la feuille montre le champ.
    send.addEventListener("click", function (e) {
      var st = store.get(), bad = null;
      if (!st.date) { $('[data-err="date"]', dlg).hidden = false; bad = bad || $(".dp", dlg); }
      if (st.ages.some(function (a) { return a === ""; })) { $('[data-err="ages"]', dlg).hidden = false; bad = bad || $(".ages select", dlg); }
      if (!bad) return;
      e.preventDefault();
      if (!M.reduce.matches) send.animate([{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(5px)" }, { transform: "translateX(-3px)" }, { transform: "none" }], { duration: 320 });
      bad.scrollIntoView({ block: "center", behavior: M.reduce.matches ? "auto" : "smooth" });
      var f = bad.matches("select") ? bad : $("button", bad); if (f) f.focus({ preventScroll: true });
    });

    var sheet = M.sheet(dlg);
    R.open = function () { sheet.open(); };
    return sheet;
  };
})();
