/* Liste de sorties (chargée à la première ouverture) : plusieurs sorties sur plusieurs jours, un seul message WhatsApp
   classé par jour avec une référence par sortie. Alerte quand deux sorties d'une journée tombent le même jour ou
   quand une date sort de la saison écrite dans la fiche. Suppression annulable. Gardée dans localStorage (v4.js). */
(function () {
  "use strict";
  var V = window.V4, B = window.STT_BOOKING;
  if (!V || !B) return;
  var $ = V.$, $$ = V.$$;
  var ICON = {
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/></svg>',
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35M12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41Z"/></svg>',
    alert: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><path fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" d="M12 6.8v6.4M12 17.2v.01"/></svg>'
  };
  var dlg = document.createElement("dialog");
  dlg.className = "sheet trips";
  dlg.id = "trips";
  dlg.setAttribute("aria-labelledby", "trips-h");
  dlg.innerHTML = '<div class="sheet-grab" aria-hidden="true"></div><div class="sheet-screen"><div class="sheet-head"><div>' +
    '<h2 class="sheet-title" id="trips-h" tabindex="-1" data-focus>Your trip list</h2></div><button class="sheet-close" type="button" data-close>' + ICON.close + '<span class="sr">Close the trip list</span></button></div>' +
    '<div class="sheet-body" data-body></div><div class="sheet-foot" data-foot></div></div>';
  document.body.appendChild(dlg);
  var body = $("[data-body]", dlg), foot = $("[data-foot]", dlg);
  var cat = null, last = null;

  function close() { if (dlg.open) dlg.close(); }
  dlg.addEventListener("close", function () { document.documentElement.classList.remove("sheet-open"); if (last && last.focus && document.contains(last)) last.focus(); });
  dlg.addEventListener("click", function (e) {
    if (dlg.hasAttribute("data-dragged")) { dlg.removeAttribute("data-dragged"); if (e.target === dlg) return; }
    if (e.target === dlg || e.target.closest("[data-close]")) close();
  });
  V.dragSheet(dlg, close);

  function list() { return V.trips.get(); }
  function save(l) { V.trips.set(l); }
  function dayLabel(iso) { return V.date(iso, { weekday: "long", day: "numeric", month: "long" }); }
  function ageOptions(v) {
    return '<option value="">Age</option><option value="0"' + (v === 0 ? " selected" : "") + ">Under 1</option>" +
      Array.from({ length: 17 }, function (_, n) { return '<option value="' + (n + 1) + '"' + (v === n + 1 ? " selected" : "") + ">" + (n + 1) + "</option>"; }).join("");
  }
  function stepper(name, label, value, min, hint) {
    return '<div class="count"><label for="tl-' + name + '">' + label + (hint ? "<small>" + hint + "</small>" : "") + '</label><div class="stepper">' +
      '<button type="button" data-tstep="' + name + '" data-d="-1"' + (value <= min ? " disabled" : "") + ' aria-label="One less, ' + label.toLowerCase() + '">&minus;</button>' +
      '<input id="tl-' + name + '" type="number" inputmode="numeric" min="' + min + '" max="30" value="' + value + '" data-tnum="' + name + '">' +
      '<button type="button" data-tstep="' + name + '" data-d="1" aria-label="One more, ' + label.toLowerCase() + '">+</button></div></div>';
  }

  // ---------- Rendu complet (ouverture, ajout, suppression, changement de date qui reclasse les jours) ----------
  function render(focusId) {
    var l = list();
    var today = V.today();
    if (!l.items.length) {
      body.innerHTML = '<div class="trips__empty"><h3>No trips in your list yet</h3><p>Add trips from their cards or from a trip page. You choose a date for each one here, then send them all in one WhatsApp message.</p><p><a class="sheet-btn sheet-btn--quiet" href="/tours/">See the boat trips and activities</a></p></div>';
      foot.innerHTML = "";
      return;
    }
    // Une fiche à une seule option la prend d'office ; à plusieurs, le visiteur choisit (rien ne part sans).
    l.items.forEach(function (it) { var p = cat[it.slug]; if (p && !it.option && p.options.length === 1) it.option = p.options[0].id; });
    l.items = l.items.filter(function (it) { return cat[it.slug]; });
    var sorted = l.items.slice().sort(function (a, b) { return (a.date || "9999") < (b.date || "9999") ? -1 : (a.date || "9999") > (b.date || "9999") ? 1 : 0; });
    var groups = [];
    sorted.forEach(function (it) { var g = groups[groups.length - 1]; if (!g || g.date !== (it.date || "")) groups.push(g = { date: it.date || "", items: [] }); g.items.push(it); });
    var clashes = B.sameDayClashes(cat, l.items);
    body.innerHTML =
      '<fieldset class="f trips__who"><legend>Who is coming</legend><p class="f-hint">The same group for every trip in the list.</p>' + stepper("adults", "Adults", l.adults, 1) + stepper("children", "Children", l.childAges.length, 0) +
      '<div class="ages">' + l.childAges.map(function (a, i) {
        return '<div class="f"><label for="tl-age-' + i + '">Age of child ' + (i + 1) + '</label><span class="select"><select id="tl-age-' + i + '" data-tage="' + i + '" aria-describedby="tl-e-age-' + i + '">' + ageOptions(a === "" ? null : a) + '</select></span><p class="err" id="tl-e-age-' + i + '" hidden></p></div>';
      }).join("") + "</div></fieldset>" +
      groups.map(function (g) {
        var clash = clashes.filter(function (c) { return c.date === g.date; })[0];
        return '<section class="trips__day"><h3 class="trips__date">' + (g.date ? dayLabel(g.date) : "No date yet") + "</h3>" +
          (clash ? '<p class="trips__warn">' + ICON.alert + "<span>" + V.esc(listJoin(clash.names)) + " are both full-day trips on the same day. Move one of them to another day.</span></p>" : "") +
          g.items.map(function (it) {
            var p = cat[it.slug];
            var opts = p.options.length > 1 ? '<div class="f"><label class="f-label" for="tl-o-' + it.id + '">Option</label><span class="select"><select id="tl-o-' + it.id + '" data-topt="' + it.id + '" aria-describedby="tl-eo-' + it.id + '"><option value="">Choose an option</option>' + p.options.map(function (o) { return '<option value="' + o.id + '"' + (o.id === it.option ? " selected" : "") + ">" + V.esc(o.title) + "</option>"; }).join("") + '</select></span><p class="err" id="tl-eo-' + it.id + '" hidden></p></div>' : "";
            var season = p.season && it.date && p.season.months.indexOf(Number(it.date.slice(5, 7))) < 0;
            return '<div class="trips__item"><div class="trips__top"><a href="' + p.url + '">' + V.esc(p.name) + '</a><button type="button" data-trm="' + it.id + '">Remove<span class="sr"> ' + V.esc(p.name) + "</span></button></div>" +
              opts + dateField(it, today) +
              (optOf(p, it) ? subFields(it, optOf(p, it)) : "") +
              '<p class="trips__total" data-ttot="' + it.id + '" aria-live="polite"></p>' +
              (season ? '<p class="trips__warn">' + ICON.alert + "<span>" + V.esc(p.name) + " runs " + V.esc(p.season.text) + ". Pick a date in that season.</span></p>" : "") + "</div>";
          }).join("") + "</section>";
      }).join("") +
      '<div class="trips__who"><div class="f"><label for="tl-pickup">Hotel or address on Koh Lanta</label><input id="tl-pickup" type="text" autocomplete="street-address" value="' + V.esc(l.pickup || "") + '" data-ttext="pickup" aria-describedby="tl-e-pickup"><p class="err" id="tl-e-pickup" hidden></p></div>' +
      '<div class="f"><label for="tl-name">First name</label><input id="tl-name" type="text" autocomplete="given-name" value="' + V.esc(l.name || "") + '" data-ttext="name" aria-describedby="tl-e-name"><p class="err" id="tl-e-name" hidden></p></div></div>' +
      '<details><summary>Read the message before you send it</summary><pre class="trips__msg" data-tmsg></pre></details>';
    foot.innerHTML = '<p class="err trips__miss" role="alert" data-tmiss hidden></p><a class="sheet-btn" href="#" target="_blank" rel="noopener" data-tsend>' + ICON.wa + "<span>" + (l.items.length === 1 ? "Send this trip on WhatsApp" : "Send the " + l.items.length + " trips in one message") + "</span></a>" +
      '<p class="sheet-note">Nothing is booked until we confirm. Nothing is paid online.</p>';
    message();
    if (focusId) { var f = document.getElementById(focusId); if (f) f.focus(); }
  }
  // Date d'une sortie : mêmes puces que la feuille (Today, Tomorrow, Other date), le calendrier seulement pour une autre date.
  function dayChoice(it, today) {
    if (!it.date) return it.dc === "other" ? "other" : "";
    return it.date === today ? "today" : it.date === B.addDays(today, 1) ? "tomorrow" : "other";
  }
  function dateField(it, today) {
    var dc = dayChoice(it, today);
    var days = { today: B.shortDay(today), tomorrow: B.shortDay(B.addDays(today, 1)) };
    var chips = [["today", "Today"], ["tomorrow", "Tomorrow"], ["other", "Other date"]].map(function (c) {
      return '<label><input type="radio" name="tl-dc-' + it.id + '" value="' + c[0] + '" data-tdc="' + it.id + '"' + (dc === c[0] ? " checked" : "") + ' aria-describedby="tl-e-' + it.id + '"><span>' + c[1] + (days[c[0]] ? "<small data-day>" + days[c[0]] + "</small>" : "") + "</span></label>";
    }).join("");
    return '<fieldset class="f trips__when"><legend class="f-label">Date</legend><div class="choice choice--3">' + chips + "</div>" +
      '<div class="date-other"' + (dc === "other" ? "" : " hidden") + '><label class="f-label" for="tl-d-' + it.id + '">Other date</label><input type="date" id="tl-d-' + it.id + '" min="' + today + '" value="' + (dc === "other" ? it.date || "" : "") + '" data-tdate="' + it.id + '" aria-describedby="tl-e-' + it.id + '"></div>' +
      '<p class="err" id="tl-e-' + it.id + '" hidden></p></fieldset>';
  }
  // Total estimé de chaque sortie : même calcul que la feuille (v4-price.js), frais du parc à part, en espèces.
  function totals() {
    var l = list();
    l.items.forEach(function (it) {
      var el = $('[data-ttot="' + it.id + '"]', body), p = cat[it.slug];
      if (!el || !p) return;
      var o = optOf(p, it);
      if (!o || B.pendingPrice(o, it)) { el.hidden = true; el.textContent = ""; return; }
      var st = B.tripState(l, it), q = window.STT_PRICE ? B.quoteOf(o, st) : null;
      var cash = B.parkCash({ options: p.options, parkFee: p.parkFee }, { option: o.id, adults: l.adults, childAges: l.childAges });
      el.hidden = false;
      el.innerHTML = "<b>" + (q ? "Estimated total " + V.thb(q.total) : "Total confirmed on WhatsApp") + "</b>" +
        (cash ? "<span>Plus " + V.thb(cash.total) + " " + V.esc((cash.label || "fees").toLowerCase()) + ", in cash on the day</span>" : "");
    });
  }
  // Sous-variantes de l'option (créneau, cours, karts…), mêmes champs que la feuille de réservation.
  function optOf(p, it) {
    return p.options.filter(function (o) { return o.id === it.option; })[0] || (p.options.length === 1 ? p.options[0] : null);
  }
  function subFields(it, o) {
    var html = (o.choices || []).map(function (c) {
      var id = "tl-c-" + it.id + "-" + c.id, err = "tl-e-" + it.id + "-c-" + o.id + "-" + c.id;
      var val = (it.choices || {})[o.id + "/" + c.id] || "";
      var attrs = ' id="' + id + '" data-tch="' + it.id + '" data-opt="' + o.id + '" data-choice="' + c.id + '" aria-describedby="' + err + '"';
      var ctl = c.type === "text"
        ? '<input type="text"' + attrs + ' value="' + V.esc(val) + '">'
        : '<span class="select"><select' + attrs + '><option value="">Choose</option>' + c.values.map(function (v) { return '<option value="' + V.esc(v.id) + '"' + (v.id === val ? " selected" : "") + ">" + V.esc(v.label + (v.price ? ", " + v.price : "")) + "</option>"; }).join("") + "</select></span>";
      return '<div class="f"><label class="f-label" for="' + id + '">' + V.esc(c.label) + "</label>" + ctl + '<p class="err" id="' + err + '" hidden></p></div>';
    }).join("");
    if (o.counts) {
      html += '<fieldset class="f"><legend class="f-label">' + V.esc(o.counts.label) + "</legend>" + o.counts.rows.map(function (r, i) {
        var id = "tl-n-" + it.id + "-" + i;
        var v = Number((it.counts || {})[o.id + "/" + i]) || 0, lab = V.esc(r.toLowerCase());
        return '<div class="count"><label for="' + id + '">' + V.esc(r) + (o.counts.prices[i] ? "<small>" + V.esc(o.counts.prices[i]) + "</small>" : "") + '</label><div class="stepper">' +
          '<button type="button" data-tcd="-1" data-for="' + id + '"' + (v <= 0 ? " disabled" : "") + ' aria-label="One less, ' + lab + '">&minus;</button>' +
          '<input type="number" min="0" max="20" inputmode="numeric" id="' + id + '" value="' + v + '" data-tcnt="' + it.id + '" data-opt="' + o.id + '" data-row="' + i + '" aria-describedby="tl-e-' + it.id + "-n-" + o.id + '">' +
          '<button type="button" data-tcd="1" data-for="' + id + '" aria-label="One more, ' + lab + '">+</button></div></div>';
      }).join("") + '<p class="err" id="tl-e-' + it.id + "-n-" + o.id + '" hidden></p></fieldset>';
    }
    return html ? '<div class="trips__subs">' + html + "</div>" : "";
  }
  function listJoin(a) { return a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]; }
  function message() {
    var l = list();
    var text = B.buildTripList(cat, l);
    var pre = $("[data-tmsg]", body), send = $("[data-tsend]", foot);
    if (pre) pre.textContent = text;
    if (send) send.href = B.waUrl(text);
    totals();
    return text;
  }

  // ---------- Événements ----------
  body.addEventListener("click", function (e) {
    var st = e.target.closest("[data-tstep]"), rm = e.target.closest("[data-trm]"), cd = e.target.closest("[data-tcd]");
    if (cd) {
      var inp = document.getElementById(cd.getAttribute("data-for"));
      if (!inp) return;
      inp.value = V.clamp((parseInt(inp.value, 10) || 0) + Number(cd.getAttribute("data-tcd")), 0, 20);
      var less = $('[data-tcd="-1"][data-for="' + inp.id + '"]', body);
      if (less) less.disabled = Number(inp.value) <= 0;
      inp.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
    var l = list();
    if (st) {
      var d = Number(st.getAttribute("data-d"));
      if (st.getAttribute("data-tstep") === "adults") l.adults = V.clamp(l.adults + d, 1, 30);
      else if (d > 0 && l.childAges.length < 12) l.childAges = l.childAges.concat([""]);
      else if (d < 0) l.childAges = l.childAges.slice(0, -1);
      save(l); render();
      var again = $('[data-tstep="' + st.getAttribute("data-tstep") + '"][data-d="' + st.getAttribute("data-d") + '"]', body);
      if (again && !again.disabled) again.focus();
    }
    if (rm) {
      var id = rm.getAttribute("data-trm"), i = -1;
      l.items.forEach(function (it, k) { if (it.id === id) i = k; });
      if (i < 0) return;
      var gone = l.items.splice(i, 1)[0];
      save(l); render();
      $("#trips-h").focus();
      V.toast(cat[gone.slug].name + " removed from your trip list.", "Undo", function () {
        var l2 = list(); l2.items.splice(i, 0, gone); save(l2);
        if (dlg.open) { render(); var back = $('[data-trm="' + gone.id + '"]', body); (back || $("#trips-h")).focus(); }
      });
    }
  });
  body.addEventListener("change", function (e) {
    var t = e.target, l = list();
    if (t.hasAttribute("data-tdc")) {
      var di = l.items.filter(function (x) { return x.id === t.getAttribute("data-tdc"); })[0];
      if (!di) return;
      var today = V.today();
      di.dc = t.value;
      if (t.value === "today") di.date = today;
      else if (t.value === "tomorrow") di.date = B.addDays(today, 1);
      else if (di.date === today || di.date === B.addDays(today, 1)) di.date = "";
      save(l);
      render(t.value === "other" ? "tl-d-" + di.id : t.id);
    } else if (t.hasAttribute("data-tdate")) {
      var it = l.items.filter(function (x) { return x.id === t.getAttribute("data-tdate"); })[0];
      if (it) { it.date = t.value; it.dc = "other"; save(l); render(t.id); }
    } else if (t.hasAttribute("data-topt")) {
      l.items.forEach(function (x) { if (x.id === t.getAttribute("data-topt")) x.option = t.value; });
      save(l); render(t.id);
      var eo = $("#tl-eo-" + t.getAttribute("data-topt"));
      if (eo && t.value) { eo.hidden = true; t.removeAttribute("aria-invalid"); }
    } else if (t.hasAttribute("data-tch") || t.hasAttribute("data-tcnt")) {
      var item = l.items.filter(function (x) { return x.id === (t.getAttribute("data-tch") || t.getAttribute("data-tcnt")); })[0];
      if (!item) return;
      var o = t.getAttribute("data-opt");
      if (t.hasAttribute("data-tch")) { item.choices = item.choices || {}; item.choices[o + "/" + t.getAttribute("data-choice")] = t.value; }
      else { item.counts = item.counts || {}; item.counts[o + "/" + t.getAttribute("data-row")] = V.clamp(parseInt(t.value, 10) || 0, 0, 20); }
      save(l); message();
      var ed = $("#" + t.getAttribute("aria-describedby"));
      if (ed) { ed.hidden = true; t.removeAttribute("aria-invalid"); }
    } else if (t.hasAttribute("data-tage")) {
      l.childAges[Number(t.getAttribute("data-tage"))] = t.value === "" ? "" : Number(t.value);
      save(l); message();
      var er = $("#tl-e-age-" + t.getAttribute("data-tage"));
      if (er && t.value !== "") { er.hidden = true; t.removeAttribute("aria-invalid"); }
    } else if (t.hasAttribute("data-tnum")) {
      var k = t.getAttribute("data-tnum"), v = parseInt(t.value, 10);
      if (k === "adults") l.adults = V.clamp(isNaN(v) ? 1 : v, 1, 30);
      else { var c = V.clamp(isNaN(v) ? 0 : v, 0, 12); while (l.childAges.length < c) l.childAges.push(""); l.childAges.length = c; }
      save(l); render(t.id);
    }
  });
  body.addEventListener("input", function (e) {
    var t = e.target;
    if (!t.hasAttribute("data-ttext")) return;
    var l = list();
    l[t.getAttribute("data-ttext")] = t.value;
    save(l); message();
    if (t.value.trim()) { var er = $("#tl-e-" + t.getAttribute("data-ttext")); if (er) { er.hidden = true; t.removeAttribute("aria-invalid"); } }
  });
  foot.addEventListener("click", function (e) {
    var send = e.target.closest("[data-tsend]");
    if (!send) return;
    var l = list(), today = V.today(), first = null;
    var missing = [];
    var fail = function (el, errId, text) { var er = $("#" + errId); if (er) { er.textContent = text; er.hidden = false; } if (el) { el.setAttribute("aria-invalid", "true"); if (!first) first = el; } missing.push(text); };
    $$(".err", body).forEach(function (er) { er.hidden = true; });
    $$("[aria-invalid]", body).forEach(function (x) { x.removeAttribute("aria-invalid"); });
    // Mêmes règles que le test (booking.js validateTripList) : option quand la fiche en a plusieurs, date, âges, hôtel, prénom.
    var v = B.validateTripList(cat, l, today);
    l.items.forEach(function (it) {
      var e = v.items[it.id];
      if (!e) return;
      if (e.option) fail($("#tl-o-" + it.id), "tl-eo-" + it.id, e.option);
      if (e.date) { var dIn = $("#tl-d-" + it.id); fail(dIn && !dIn.closest("[hidden]") ? dIn : $('[data-tdc="' + it.id + '"]', body), "tl-e-" + it.id, e.date); }
      Object.keys(e).forEach(function (k) {
        if (k === "option" || k === "date") return;
        var m = /^c-(.+)-([^-]+)$/.exec(k);
        var el = m ? $("#tl-c-" + it.id + "-" + m[2]) : $("#tl-n-" + it.id + "-0");
        fail(el, "tl-e-" + it.id + "-" + k, e[k]);
      });
    });
    Object.keys(v.ages).forEach(function (i) { fail($("#tl-age-" + i), "tl-e-age-" + i, v.ages[i]); });
    if (v.pickup) fail($("#tl-pickup"), "tl-e-pickup", v.pickup);
    if (v.name) fail($("#tl-name"), "tl-e-name", v.name);
    var miss = $("[data-tmiss]", foot);
    if (miss) { miss.hidden = !missing.length; miss.textContent = missing.length === 1 ? "One thing is missing, see above." : missing.length + " things are missing, see above."; }
    if (first || v.count) {
      e.preventDefault();
      if (!V.reduce.matches) send.animate([{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(5px)" }, { transform: "translateX(-3px)" }, { transform: "none" }], { duration: 320 });
      if (first) first.focus();
      return;
    }
    send.href = B.waUrl(message());
  });
  document.addEventListener("trips-change", function () { if (dlg.open && !dlg.contains(document.activeElement)) render(); });

  window.V4_TRIPS = {
    open: function (trigger) {
      last = trigger || document.activeElement;
      return V.catalog().then(function (c) {
        cat = c;
        render();
        document.documentElement.classList.add("sheet-open");
        if (!dlg.open) dlg.showModal();
        $("#trips-h").focus();
      });
    }
  };
})();
