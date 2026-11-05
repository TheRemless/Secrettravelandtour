/* Moteur commun des prototypes « reservation » : prix calculés depuis data.js, message WhatsApp,
   groupe mémorisé d'une page à l'autre, liste de sorties envoyée en un seul message, événements mesurés. */
(function () {
  "use strict";
  var D = window.STT;
  var IMG = "../../../../../src/images/";
  var WA = D.site.whatsapp;
  var PAGE_BASE = D.site.url;

  // ---------- Outils ----------
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  function thb(n) { return fmt(n) + " THB"; }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }
  function listJoin(a) { return a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]; }
  function bySlug(slug) { for (var i = 0; i < D.products.length; i++) if (D.products[i].slug === slug) return D.products[i]; return null; }
  function optById(p, id) { for (var i = 0; i < p.options.length; i++) if (p.options[i].id === id) return p.options[i]; return null; }
  function fact(p, label) { for (var i = 0; i < p.facts.length; i++) if (p.facts[i].label === label) return p.facts[i].value; return null; }
  function img(photo, cls, eager) {
    if (!photo) return '<div class="ph-missing ' + (cls || "") + '">[DONNÉE À FOURNIR : photo]</div>';
    return '<img src="' + IMG + photo.file + '" alt="' + esc(photo.alt) + '" style="object-position:' + (photo.position || "50% 50%") + '"' + (eager ? ' fetchpriority="high"' : ' loading="lazy"') + (cls ? ' class="' + cls + '"' : "") + ">";
  }

  // ---------- Dates : heure de Koh Lanta ----------
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function todayIso() {
    var p = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    return p;
  }
  function toDate(iso) { var p = iso.split("-").map(Number); return new Date(Date.UTC(p[0], p[1] - 1, p[2])); }
  function toIso(d) { return d.toISOString().slice(0, 10); }
  function addDays(iso, n) { var d = toDate(iso); d.setUTCDate(d.getUTCDate() + n); return toIso(d); }
  function longDate(iso) { var d = toDate(iso); return DAYS[d.getUTCDay()] + " " + d.getUTCDate() + " " + MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear(); }
  function shortDate(iso) { var d = toDate(iso); return DAYS[d.getUTCDay()].slice(0, 3) + " " + d.getUTCDate() + " " + MONTHS[d.getUTCMonth()].slice(0, 3); }
  function monthOf(iso) { return toDate(iso).getUTCMonth() + 1; }

  // ---------- Saison ----------
  // Renvoie true / false / null (inconnu : aucune donnée de saison pour ce produit).
  function runsInMonth(p, m) {
    if (!p.season || !p.season.months) return null;
    return p.season.months.indexOf(m) !== -1;
  }

  // ---------- Prix pour un groupe ----------
  function rows(opt) { return (opt.prices || []).filter(function (r) { return typeof r.amount === "number"; }); }
  function adultRow(rs) {
    for (var i = 0; i < rs.length; i++) if (!rs[i].ages && !rs[i].group && !rs[i].supplement && rs[i].unit === "per person") return rs[i];
    var open = rs.filter(function (r) { return r.ages && r.ages.max == null && r.ages.min != null && !r.group; });
    open.sort(function (a, b) { return b.ages.min - a.ages.min; });
    return open[0] || null;
  }
  function childRow(rs, age) {
    var m = rs.filter(function (r) { return r.ages && !r.group && (r.ages.min == null || r.ages.min <= age) && (r.ages.max == null || age <= r.ages.max); });
    m.sort(function (a, b) { return ((b.ages.min == null ? -1 : b.ages.min) - (a.ages.min == null ? -1 : a.ages.min)) || ((a.ages.max == null) - (b.ages.max == null)); });
    return m[0] || null;
  }
  function maxChildAge(rs) {
    var mx = -1;
    rs.forEach(function (r) { if (r.ages && r.ages.max != null) mx = Math.max(mx, r.ages.max); });
    return mx;
  }
  function pushLine(lines, label, qty, amount, ages) {
    for (var i = 0; i < lines.length; i++) if (lines[i].label === label && lines[i].amount === amount) { lines[i].qty += qty; if (ages) lines[i].ages = (lines[i].ages || []).concat(ages); return; }
    lines.push({ label: label, qty: qty, amount: amount, ages: ages || null });
  }
  function extraRow(opt) { return rows(opt).filter(function (r) { return r.supplement && /extra person/i.test(r.label); })[0] || null; }
  function addOns(opt) { return rows(opt).filter(function (r) { return r.supplement && !/extra person/i.test(r.label); }); }

  // g = { adults, ages: [..], addOns: [labels] }
  // Résultat : { status: "ok" | "partial" | "request" | "ask" | "unit", total, lines[], notes[], unpriced[] }
  function quote(opt, g) {
    var ages = (g.ages || []).filter(function (a) { return a !== "" && a != null; }).map(Number);
    var adults = g.adults || 0;
    var n = adults + ages.length;
    var rs = rows(opt);
    if (opt.priceOnRequest || !rs.length) return { status: "request", lines: [], notes: [], unpriced: [] };
    var lines = [], notes = [], unpriced = [];
    // Prix « au bateau » : lignes de groupe facturées par bateau ou radeau. « For 2 people » à côté d'un prix
    // par personne n'est qu'un rappel du même prix, on garde le prix par personne.
    var groups = rs.filter(function (r) { return r.group; });
    if (!groups.some(function (r) { return r.unit === "per boat" || r.unit === "per raft"; })) groups = [];
    var kidRows = rs.filter(function (r) { return r.ages && !r.group; });
    var mxc = maxChildAge(kidRows);
    var personRs = rs.filter(function (r) { return !r.group || groups.indexOf(r) === -1; });

    if (groups.length) {
      var gr = groups.filter(function (r) { return (r.group.min || 1) <= n && n <= (r.group.max == null ? Infinity : r.group.max); })[0];
      if (gr && gr.unit === "per person") {
        if (adults) pushLine(lines, gr.label, adults, gr.amount);
        ages.forEach(function (a) {
          var cr = childRow(kidRows, a);
          if (cr) pushLine(lines, cr.label, 1, cr.amount, [a]);
          else if (a > mxc) { pushLine(lines, gr.label, 1, gr.amount, [a]); notes.push("Age " + a + " counted at the " + gr.label.toLowerCase() + " rate."); }
          else unpriced.push(a);
        });
      } else if (gr) {
        pushLine(lines, gr.label + " (" + plural(n, "person", "people") + ")", 1, gr.amount);
      } else {
        var top = groups.filter(function (r) { return r.group.max != null; }).sort(function (a, b) { return b.group.max - a.group.max; })[0];
        var ex = extraRow(opt);
        if (top && ex && n > top.group.max) {
          pushLine(lines, top.label, 1, top.amount);
          pushLine(lines, ex.label, n - top.group.max, ex.amount);
        } else {
          return { status: "ask", lines: [], notes: [], unpriced: [], reason: "No published price for " + plural(n, "person", "people") + " on this option." };
        }
      }
      (g.addOns || []).forEach(function (label) {
        addOns(opt).forEach(function (r) { if (r.label === label) pushLine(lines, r.label, 1, r.amount); });
      });
    } else {
      var ar = adultRow(personRs.filter(function (r) { return !r.group; }));
      if (!ar) return { status: "unit", lines: [], notes: [], unpriced: [] };
      if (adults) pushLine(lines, ar.label, adults, ar.amount);
      ages.forEach(function (a) {
        var cr = childRow(kidRows, a);
        if (cr) pushLine(lines, cr.label, 1, cr.amount, [a]);
        else if (!kidRows.length) pushLine(lines, ar.label, 1, ar.amount, [a]);
        else if (a > mxc) { pushLine(lines, ar.label, 1, ar.amount, [a]); notes.push("Age " + a + " counted at the " + ar.label.toLowerCase() + " rate."); }
        else unpriced.push(a);
      });
    }
    var total = lines.reduce(function (s, l) { return s + l.qty * l.amount; }, 0);
    return { status: unpriced.length ? "partial" : "ok", total: total, lines: lines, notes: notes, unpriced: unpriced };
  }

  // Frais payés en espèces sur place (parc national, entrée du village). Null si l'option n'en a pas.
  function cashFees(opt, g, q, p) {
    var fees = (opt.notIncludedFees || []).filter(function (f) { return typeof f.amount === "number" && !/Thai national|insurance|snorkeller|passenger/i.test(f.label); });
    if (!fees.length) return null;
    var ages = (g.ages || []).filter(function (a) { return a !== "" && a != null; }).map(Number);
    var adultFee = fees.filter(function (f) { return /adult/i.test(f.label); })[0];
    var childFee = fees.filter(function (f) { return /child/i.test(f.label); })[0];
    var label = fees[0].label.replace(/,? ?(diver )?(adult|child)$/i, "");
    if (!adultFee && !childFee) {
      var n = (g.adults || 0) + ages.length;
      return { label: label, total: n * fees[0].amount, text: n + " × " + fmt(fees[0].amount) + " = " + thb(n * fees[0].amount), note: fees[0].note || "" };
    }
    // Tranche enfant : celle de l'option, sinon celle des autres options du produit (bateau privé sans tarif enfant).
    var kidRows = rows(opt).filter(function (r) { return r.ages && !r.group && r.amount > 0; });
    if (!kidRows.length && p) p.options.forEach(function (o2) { if (!kidRows.length) kidRows = rows(o2).filter(function (r) { return r.ages && !r.group && r.amount > 0; }); });
    var minChild = kidRows.reduce(function (m, r) { return Math.min(m, r.ages.min == null ? 0 : r.ages.min); }, 99);
    var mxc = maxChildAge(kidRows);
    var adultsN = g.adults || 0, kidsN = 0, unknown = [];
    ages.forEach(function (a) {
      if (a > mxc && mxc >= 0) adultsN++;
      else if (a >= minChild) kidsN++;
      else unknown.push(a);
    });
    var parts = [], total = 0;
    if (adultsN && adultFee) { parts.push(adultsN + " × " + fmt(adultFee.amount)); total += adultsN * adultFee.amount; }
    if (kidsN && childFee) { parts.push(kidsN + " × " + fmt(childFee.amount)); total += kidsN * childFee.amount; }
    if (!parts.length && !unknown.length) return null;
    return {
      label: label, total: total, text: parts.join(" + ") + " = " + thb(total),
      note: (adultFee && adultFee.note) || "",
      unknown: unknown,
    };
  }

  // Option de référence : celle qui porte le prix d'appel du produit (price.from).
  function refOption(p) {
    if (p.price) {
      for (var i = 0; i < p.options.length; i++) {
        var rs = rows(p.options[i]);
        for (var j = 0; j < rs.length; j++) if ((!rs[j].ages || rs[j].ages.max == null) && rs[j].amount === p.price.from) return p.options[i];
      }
    }
    return p.options[0] || null;
  }
  // Option la moins chère qui donne un prix complet pour le groupe.
  function bestFor(p, g) {
    var best = null;
    p.options.forEach(function (o) {
      if (o.kind === "extra" || o.kind === "vehicle") return;
      var q = quote(o, g);
      if (q.status !== "ok" && q.status !== "partial") return;
      if (!best || (q.status === "ok" && best.q.status !== "ok") || (q.status === best.q.status && q.total < best.q.total)) best = { opt: o, q: q };
    });
    return best;
  }

  function breakdown(q) {
    var paid = q.lines.filter(function (l) { return l.amount > 0; }).map(function (l) { return l.qty + " × " + fmt(l.amount); }).join(" + ");
    var free = [];
    q.lines.forEach(function (l) { if (l.amount === 0) free = free.concat(l.ages || []); });
    return paid + (free.length ? ", age " + listJoin(free.map(String)) + " free" : "");
  }
  function lineLabel(l) {
    return (l.qty > 1 && !/\(/.test(l.label) ? l.qty + " × " : "") + l.label + (l.ages ? " (age" + (l.ages.length > 1 ? "s " : " ") + listJoin(l.ages.map(String)) + ")" : "");
  }
  function priceRowsText(opt) {
    return (opt.prices || []).map(function (r) { return r.label + ": " + (typeof r.amount === "number" ? (r.amount === 0 ? "free" : thb(r.amount)) : r.text); }).join(" / ");
  }

  // ---------- Groupe mémorisé d'une page à l'autre ----------
  var GKEY = "stt-v4-res-group";
  function loadGroup() {
    try { var g = JSON.parse(localStorage.getItem(GKEY)); if (g && typeof g.adults === "number") return g; } catch (e) {}
    return { adults: 2, ages: [], month: null, date: null, pickup: "", name: "" };
  }
  function saveGroup(g) { try { localStorage.setItem(GKEY, JSON.stringify(g)); } catch (e) {} }
  function guestsLine(adults, ages) {
    var parts = [];
    var a = (ages || []).filter(function (x) { return x !== "" && x != null; });
    if (adults) parts.push(plural(adults, "adult", "adults"));
    if (a.length === 1) parts.push("1 child (age " + a[0] + ")");
    else if (a.length > 1) parts.push(a.length + " children (ages " + listJoin(a.map(String)) + ")");
    return parts.join(", ");
  }

  // ---------- Événements mesurés (le prototype les affiche dans sa barre) ----------
  var events = [];
  function track(name, props) {
    events.push({ t: new Date().toISOString().slice(11, 19), name: name, props: props || {} });
    var c = $("#ev-count"); if (c) c.textContent = events.length;
    var log = $("#ev-log"); if (log) log.textContent = events.map(function (e) { return e.t + "  " + e.name + "  " + JSON.stringify(e.props); }).join("\n");
    if (window.console) console.log("[track]", name, props || {});
  }

  // ---------- Message WhatsApp ----------
  function makeRef(prefix, iso, adults, kids) {
    if (!prefix || !iso) return "";
    var d = iso.split("-");
    return prefix + "-" + d[2] + d[1] + "-" + (adults || 0) + "A" + (kids ? kids + "C" : "");
  }
  // item = { slug, option, date, addOns }, g = groupe, who = { name, pickup }
  function itemParts(item, g) {
    var p = bySlug(item.slug), o = optById(p, item.option);
    var gg = { adults: g.adults, ages: g.ages, addOns: item.addOns || [] };
    var q = o ? quote(o, gg) : null;
    var r = { title: p.name + (o ? " – " + o.label : ""), q: q, url: PAGE_BASE + p.url,
      ref: makeRef(p.refPrefix, item.date, g.adults, (g.ages || []).length),
      extras: item.addOns && item.addOns.length ? "Extras: " + item.addOns.join(", ") : "",
      date: "Date: " + (item.date ? longDate(item.date) : "to agree"), price: "", fee: "" };
    if (q && (q.status === "ok" || q.status === "partial")) {
      r.price = "Total on the website: " + thb(q.total) + " (" + breakdown(q) + ")" + (q.unpriced.length ? ", plus age " + listJoin(q.unpriced.map(String)) + " to confirm" : "");
    } else if (q && (q.status === "request" || q.status === "ask")) r.price = "Price: please send it for our group";
    else if (o) r.price = "Price on website: " + priceRowsText(o);
    var f = o ? cashFees(o, gg, q, p) : null;
    if (f && f.total) r.fee = f.label + ", cash on the day: " + f.text;
    return r;
  }
  function buildMessage(items, g, who) {
    var L = [];
    function push(x) { if (x) L.push(x); }
    if (items.length === 1) {
      var r = itemParts(items[0], g);
      if (r.ref) L.push("Ref: " + r.ref);
      L.push("Booking request: " + r.title);
      push(r.extras); push(r.date);
      L.push("Guests: " + guestsLine(g.adults, g.ages));
      if (who.pickup) L.push("Pickup: " + who.pickup);
      if (who.name) L.push("Name: " + who.name);
      push(r.price); push(r.fee);
      L.push("Page: " + r.url);
      return L.join("\n");
    }
    L.push("Booking request: " + items.length + " trips");
    L.push("Guests: " + guestsLine(g.adults, g.ages));
    if (who.pickup) L.push("Pickup: " + who.pickup);
    if (who.name) L.push("Name: " + who.name);
    var sum = 0, allPriced = true;
    items.forEach(function (it, i) {
      var r = itemParts(it, g);
      L.push("");
      L.push((i + 1) + ". " + r.title);
      push(r.extras); push(r.date); push(r.price); push(r.fee);
      if (r.ref) L.push("Ref: " + r.ref);
      L.push("Page: " + r.url);
      if (r.q && (r.q.status === "ok" || r.q.status === "partial")) sum += r.q.total;
      if (!r.q || r.q.status !== "ok") allPriced = false;
    });
    L.push("");
    L.push((allPriced ? "Total of the list on the website: " : "Total so far on the website, some prices to confirm: ") + thb(sum));
    return L.join("\n");
  }
  function waUrl(message) { return "https://wa.me/" + WA.number + "?text=" + encodeURIComponent(message); }

  // ---------- Liste de sorties ----------
  var LKEY = "stt-v4-res-list";
  function loadList() { try { var l = JSON.parse(localStorage.getItem(LKEY)); if (Array.isArray(l)) return l; } catch (e) {} return []; }
  function saveList(l) { try { localStorage.setItem(LKEY, JSON.stringify(l)); } catch (e) {} updateCount(); }
  function addToList(item) {
    var l = loadList();
    var same = l.filter(function (x) { return x.slug === item.slug && x.option === item.option && x.date === item.date; })[0];
    if (same) { toast(bySlug(item.slug).name + " is already in your trip list."); return false; }
    l.push(item);
    saveList(l);
    track("triplist_add", { product: item.slug, option: item.option, date: item.date || null, size: l.length });
    toast(bySlug(item.slug).name + " added to your trip list.", "Open list", function () { openList(); });
    return true;
  }
  function updateCount() {
    var n = loadList().length;
    $$("[data-tl-count]").forEach(function (el) { el.textContent = n; el.setAttribute("data-n", n); });
  }

  // Deux sorties d'une journée entière le même jour : conflit signalé.
  function conflicts(list) {
    var out = [];
    var byDate = {};
    list.forEach(function (it) {
      var p = bySlug(it.slug);
      if (!it.date || !p.duration) return;
      if (p.duration.tags.length === 1 && p.duration.tags[0] === "full") (byDate[it.date] = byDate[it.date] || []).push(p.name);
    });
    Object.keys(byDate).forEach(function (d) { if (byDate[d].length > 1) out.push({ date: d, names: byDate[d] }); });
    return out;
  }

  // ---------- Toast ----------
  var tTimer;
  function toast(text, actionLabel, action) {
    var t = $("#toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); t.setAttribute("aria-live", "polite"); document.body.appendChild(t); }
    t.innerHTML = "<span>" + esc(text) + "</span>" + (actionLabel ? '<button type="button">' + esc(actionLabel) + "</button>" : "");
    if (actionLabel) $("button", t).onclick = function () { t.classList.remove("show"); action(); };
    t.classList.add("show");
    clearTimeout(tTimer);
    tTimer = setTimeout(function () { t.classList.remove("show"); }, 4500);
  }

  // ---------- Icônes ----------
  var ICON = {
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.73 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.85 9.85 0 0 0 12.04 2zm0 18.15h-.01a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.2 8.2 0 0 1 5.83 2.42 8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 5l14 14M19 5L5 19"/></svg>',
    list: '<svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>',
  };

  // ---------- En-tête, pied de page, barre de prototype ----------
  function chrome(opts) {
    opts = opts || {};
    var proto = document.createElement("div");
    proto.innerHTML =
      '<div class="proto"><span><b>Prototype</b> reservation, ' + esc(opts.title || "") + '</span>' +
      '<button type="button" id="ev-toggle" aria-expanded="false">Events measured: <span id="ev-count">0</span></button>' +
      '<a href="home.html">home</a><a href="tours.html">tours</a><a href="4-islands.html">4-islands</a><a href="variantes.html">variantes</a>' +
      '<button type="button" id="reset-proto">Reset saved group and list</button></div>' +
      '<div class="ev-log" id="ev-log" aria-live="off"></div>';
    document.body.insertBefore(proto, document.body.firstChild);
    $("#ev-toggle").onclick = function () { var o = $("#ev-log").classList.toggle("open"); this.setAttribute("aria-expanded", o); };
    $("#reset-proto").onclick = function () { try { localStorage.removeItem(GKEY); localStorage.removeItem(LKEY); localStorage.removeItem("stt-v4-res-draft"); } catch (e) {} location.reload(); };

    var h = document.createElement("header");
    h.className = "hdr";
    h.innerHTML =
      '<a class="skip" href="#main">Skip to content</a><div class="wrap">' +
      '<a class="brand" href="home.html"><img src="' + IMG + 'secret/emblem.webp" alt="" width="51" height="42"><span>Secret Travel &amp; Tour</span></a>' +
      '<nav class="nav" aria-label="Main"><a href="tours.html#type=boat"' + (opts.current === "boat" ? ' aria-current="page"' : "") + '>Boat trips</a><a href="tours.html#type=activity"' + (opts.current === "activity" ? ' aria-current="page"' : "") + '>Activities</a><a href="/taxi/">Transfers</a><a href="#rental">Rental</a></nav>' +
      '<button type="button" class="tl-btn" data-open-list aria-haspopup="dialog">' + ICON.list + '<span class="label">Trip list</span><span class="count num" data-tl-count data-n="0">0</span><span class="vh"> trips</span></button>' +
      '<a class="btn wa" href="' + WA.link + '" target="_blank" rel="noopener" data-track="header_whatsapp">' + ICON.wa + '<span class="label">WhatsApp</span></a>' +
      "</div>";
    proto.parentNode.insertBefore(h, proto.nextSibling);

    var f = document.createElement("footer");
    f.className = "ftr";
    var boats = D.products.filter(function (p) { return p.kind === "boat"; });
    var acts = D.products.filter(function (p) { return p.kind === "activity"; });
    var link = function (p) { return '<li><a href="' + (p.slug === "4-islands" ? "4-islands.html" : "tours.html#q=" + p.slug) + '">' + esc(p.name) + "</a></li>"; };
    f.innerHTML = '<div class="wrap"><div class="cols">' +
      '<div><div class="brand-f"><img src="' + IMG + 'secret/emblem.webp" alt="" width="53" height="44"><span>Secret Travel &amp; Tour</span></div>' +
      '<ul><li><a href="' + WA.link + '" target="_blank" rel="noopener">WhatsApp ' + esc(WA.display) + "</a></li><li>Pay on the day, in cash or by bank transfer. Nothing online.</li></ul></div>" +
      "<div><h2>Boat trips</h2><ul>" + boats.map(link).join("") + "</ul></div>" +
      "<div><h2>Activities</h2><ul>" + acts.map(link).join("") + "</ul></div>" +
      '<div><h2>More</h2><ul><li><a href="/taxi/">Private transfers, VIP Taxi Lanta</a></li><li><a href="#rental">Car and scooter rental</a></li><li><a href="/terms/">Terms</a></li></ul></div>' +
      '</div><div class="base"><span>© 2026 ' + esc(D.site.operator.name) + "</span><span>TAT licence " + esc(D.site.licence) + '</span><a href="/terms/">Terms</a></div></div>';
    document.body.appendChild(f);

    $$("[data-open-list]").forEach(function (b) { b.addEventListener("click", function () { openList(b); }); });
    document.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest("[data-track]");
      if (t) track(t.getAttribute("data-track"), { href: t.getAttribute("href") || null });
    });
    updateCount();
    track("page_view", { page: opts.title || location.pathname.split("/").pop() });
  }

  // ---------- Contrôle « qui vient » réutilisable ----------
  // mount(el, g, onChange) : adultes, enfants et l'âge de chaque enfant.
  function groupControl(el, g, onChange, idp) {
    idp = idp || "g";
    function ageOptions(v) {
      var s = '<option value="">Age</option>';
      for (var a = 0; a <= 17; a++) s += '<option value="' + a + '"' + (String(v) === String(a) ? " selected" : "") + ">" + (a === 0 ? "Under 1" : a + (a === 1 ? " year" : " years")) + "</option>";
      return s;
    }
    function render() {
      el.innerHTML =
        '<div class="stepper"><div class="who"><span class="lbl" id="' + idp + '-al">Adults</span></div><div class="ctl">' +
        '<button type="button" data-d="a-" aria-label="Remove an adult"' + (g.adults <= 1 ? " disabled" : "") + '>−</button><output aria-live="polite" aria-labelledby="' + idp + '-al">' + g.adults + '</output>' +
        '<button type="button" data-d="a+" aria-label="Add an adult"' + (g.adults >= 20 ? " disabled" : "") + ">+</button></div></div>" +
        '<div class="stepper"><div class="who"><span class="lbl" id="' + idp + '-cl">Children</span><small>Under 18, we ask each age</small></div><div class="ctl">' +
        '<button type="button" data-d="c-" aria-label="Remove a child"' + (!g.ages.length ? " disabled" : "") + '>−</button><output aria-live="polite" aria-labelledby="' + idp + '-cl">' + g.ages.length + '</output>' +
        '<button type="button" data-d="c+" aria-label="Add a child"' + (g.ages.length >= 10 ? " disabled" : "") + ">+</button></div></div>" +
        (g.ages.length ? '<div class="ages">' + g.ages.map(function (a, i) {
          return '<div class="field" data-age-field="' + i + '"><label for="' + idp + "-age-" + i + '">Child ' + (i + 1) + '</label><select class="input" id="' + idp + "-age-" + i + '" data-age="' + i + '">' + ageOptions(a) + '</select><span class="err" id="' + idp + "-age-err-" + i + '"></span></div>';
        }).join("") + "</div>" : "");
    }
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-d]"); if (!b) return;
      var d = b.getAttribute("data-d");
      if (d === "a-" && g.adults > 1) g.adults--;
      if (d === "a+") g.adults++;
      if (d === "c+") g.ages.push("");
      if (d === "c-") g.ages.pop();
      render();
      var again = $('[data-d="' + d + '"]', el);
      if (again && !again.disabled) again.focus();
      if (d === "c+") { var s = $('[data-age="' + (g.ages.length - 1) + '"]', el); if (s) s.focus(); }
      onChange("group");
    });
    el.addEventListener("change", function (e) {
      var s = e.target.closest("[data-age]"); if (!s) return;
      g.ages[+s.getAttribute("data-age")] = s.value === "" ? "" : Number(s.value);
      var f = s.closest(".field"); f.classList.remove("invalid"); s.removeAttribute("aria-invalid"); $(".err", f).textContent = "";
      onChange("age");
    });
    render();
    return { render: render, validate: function () {
      var first = null;
      g.ages.forEach(function (a, i) {
        if (a === "" || a == null) {
          var f = $('[data-age-field="' + i + '"]', el); f.classList.add("invalid");
          var s = $("select", f); s.setAttribute("aria-invalid", "true"); s.setAttribute("aria-describedby", idp + "-age-err-" + i);
          $(".err", f).textContent = "Choose the age of child " + (i + 1) + ". Prices depend on it.";
          if (!first) first = s;
        }
      });
      return first;
    } };
  }

  // ---------- Tiroir « Trip list » ----------
  var listDlg;
  function openList(trigger) {
    if (!listDlg) buildList();
    renderList();
    listDlg.showModal();
    track("triplist_open", { size: loadList().length });
  }
  function buildList() {
    listDlg = document.createElement("dialog");
    listDlg.className = "drawer";
    listDlg.setAttribute("aria-labelledby", "tl-title");
    listDlg.innerHTML = '<div class="dr-in"><div class="dr-head"><h2 id="tl-title">Your trip list</h2><button type="button" class="x" data-close aria-label="Close the trip list">' + ICON.x + '</button></div><div class="dr-body" id="tl-body"></div><div class="dr-foot" id="tl-foot"></div></div>';
    document.body.appendChild(listDlg);
    listDlg.addEventListener("click", function (e) { if (e.target === listDlg || e.target.closest("[data-close]")) listDlg.close(); });
  }
  function renderList() {
    var old = $("#tl-body"), body = old.cloneNode(false); old.parentNode.replaceChild(body, old);
    var foot = $("#tl-foot");
    var l = loadList();
    var g = loadGroup();
    if (!l.length) {
      body.innerHTML = '<div style="display:grid;gap:14px"><h3>No trips yet</h3><p class="mute">Add trips from any page with “Add to trip list”. You choose a date for each one here, then send them all in one WhatsApp message.</p><p><a class="btn line" href="tours.html">Browse boat trips and activities</a></p></div>';
      foot.innerHTML = "";
      return;
    }
    var today = todayIso();
    body.innerHTML =
      '<div><h3 style="font-size:22px;margin-bottom:6px">Who is coming</h3><p class="tiny mute" style="margin-bottom:6px">The same group for every trip in the list.</p><div id="tl-group"></div></div>' +
      '<ol style="list-style:none;margin:0;padding:0;display:grid;gap:0" id="tl-items">' + l.map(function (it, i) {
        var p = bySlug(it.slug);
        var opts = p.options.filter(function (o) { return o.kind !== "extra"; }).map(function (o) { return '<option value="' + o.id + '"' + (o.id === it.option ? " selected" : "") + ">" + esc(o.label) + "</option>"; }).join("");
        return '<li style="border-top:1px solid var(--line);padding:16px 0;display:grid;gap:10px" data-i="' + i + '">' +
          '<div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline"><h3 style="font-size:23px">' + (i + 1) + ". " + esc(p.name) + '</h3><button type="button" class="link" data-rm="' + i + '">Remove</button></div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div class="field"><label for="tl-o-' + i + '">Option</label><select class="input" id="tl-o-' + i + '" data-opt="' + i + '">' + opts + "</select></div>" +
          '<div class="field" data-date-field="' + i + '"><label for="tl-d-' + i + '">Date</label><input class="input" type="date" id="tl-d-' + i + '" min="' + today + '" value="' + (it.date || "") + '" data-date="' + i + '" aria-describedby="tl-de-' + i + '"></div></div>' +
          '<span class="err" id="tl-de-' + i + '"></span>' +
          '<p class="small" data-q="' + i + '"></p></li>';
      }).join("") + "</ol>" +
      '<div id="tl-conf"></div>' +
      '<div style="display:grid;gap:12px;border-top:1px solid var(--line);padding-top:16px">' +
      '<div class="field" id="tl-pf"><label for="tl-pickup">Hotel or address on Koh Lanta</label><input class="input" id="tl-pickup" autocomplete="street-address" value="' + esc(g.pickup || "") + '" aria-describedby="tl-pe"><span class="err" id="tl-pe"></span></div>' +
      '<div class="field" id="tl-nf"><label for="tl-name">Your first name</label><input class="input" id="tl-name" autocomplete="given-name" value="' + esc(g.name || "") + '" aria-describedby="tl-ne"><span class="err" id="tl-ne"></span></div></div>' +
      '<details style="border-top:1px solid var(--line);padding-top:12px"><summary class="msg-h" style="cursor:pointer;min-height:44px;align-items:center">' + ICON.wa + ' See the message you will send</summary><div class="msg" id="tl-msg" style="margin-top:10px"></div></details>';
    var gc = groupControl($("#tl-group"), g, function () { saveGroup(g); refresh(); }, "tl");
    function refresh() {
      var l2 = loadList();
      l2.forEach(function (it, i) {
        var p = bySlug(it.slug), o = optById(p, it.option);
        var q = quote(o, { adults: g.adults, ages: g.ages });
        var el = $('[data-q="' + i + '"]', body);
        var season = it.date ? runsInMonth(p, monthOf(it.date)) : null;
        var s = "";
        if (q.status === "ok" || q.status === "partial") s = '<b class="num">' + thb(q.total) + '</b> <span class="mute">' + esc(breakdown(q)) + "</span>" + (q.unpriced.length ? '<br><span class="mute">Age ' + q.unpriced.join(", ") + ": price to confirm on WhatsApp.</span>" : "");
        else if (q.status === "unit") s = '<span class="mute">Price per kart, chosen on the day: ' + esc(priceRowsText(o)) + "</span>";
        else s = '<span class="mute">' + esc(q.reason || "Price on WhatsApp.") + "</span>";
        if (season === false) s += '<br><b>' + esc(p.name) + " runs " + esc(p.season.text) + ". Pick another date.</b>";
        el.innerHTML = s;
      });
      var cf = conflicts(l2);
      $("#tl-conf").innerHTML = cf.map(function (c) { return '<p class="err">' + esc(listJoin(c.names)) + " are both full-day trips on " + shortDate(c.date) + ". Move one of them to another day.</p>"; }).join("");
      var who = { pickup: $("#tl-pickup").value.trim(), name: $("#tl-name").value.trim() };
      $("#tl-msg").textContent = buildMessage(l2, g, who);
      var sum = 0, all = true;
      l2.forEach(function (it) { var q = quote(optById(bySlug(it.slug), it.option), g); if (q.status === "ok" || q.status === "partial") sum += q.total; if (q.status !== "ok") all = false; });
      $("#tl-total").innerHTML = '<span class="mute small">' + (all ? "Total for the list" : "Total so far, some prices to confirm") + '</span><b class="num" style="font:600 28px/1 var(--serif)">' + thb(sum) + "</b>";
    }
    foot.innerHTML = '<div id="tl-total" style="display:flex;justify-content:space-between;align-items:baseline;gap:12px"></div>' +
      '<button type="button" class="btn big block" id="tl-send">' + ICON.wa + " Send " + (l.length === 1 ? "this trip" : "the " + l.length + " trips") + " in one WhatsApp message</button>" +
      '<p class="tiny mute">Nothing to pay now. You pay on the day, in cash or by bank transfer.</p>';
    body.addEventListener("change", onChange);
    body.addEventListener("input", function (e) { if (e.target.id === "tl-pickup" || e.target.id === "tl-name") { g.pickup = $("#tl-pickup").value; g.name = $("#tl-name").value; saveGroup(g); refresh(); } });
    body.addEventListener("click", function (e) {
      var rm = e.target.closest("[data-rm]"); if (!rm) return;
      var l2 = loadList(); var i = +rm.getAttribute("data-rm"); var removed = l2.splice(i, 1)[0]; saveList(l2);
      track("triplist_remove", { product: removed.slug });
      renderList();
      toast(bySlug(removed.slug).name + " removed.", "Undo", function () { var l3 = loadList(); l3.splice(i, 0, removed); saveList(l3); renderList(); });
    });
    function onChange(e) {
      var l2 = loadList();
      var t = e.target;
      if (t.hasAttribute("data-opt")) { l2[+t.getAttribute("data-opt")].option = t.value; saveList(l2); }
      if (t.hasAttribute("data-date")) {
        var i = +t.getAttribute("data-date"); l2[i].date = t.value || null; saveList(l2);
        var f = $('[data-date-field="' + i + '"]', body); f.classList.remove("invalid"); t.removeAttribute("aria-invalid"); $("#tl-de-" + i).textContent = "";
      }
      refresh();
    }
    $("#tl-send").onclick = function () {
      var l2 = loadList(); var first = null;
      l2.forEach(function (it, i) {
        if (!it.date) {
          var el = $("#tl-d-" + i); el.setAttribute("aria-invalid", "true"); $('[data-date-field="' + i + '"]', body).classList.add("invalid");
          $("#tl-de-" + i).textContent = "Pick a date for " + bySlug(it.slug).name + ".";
          if (!first) first = el;
        } else if (it.date < todayIso()) {
          $("#tl-de-" + i).textContent = "That date has passed. Pick another one."; if (!first) first = $("#tl-d-" + i);
        }
      });
      var a = gc.validate(); if (a && !first) first = a;
      [["tl-pickup", "tl-pe", "Add your hotel or address so we can plan the pickup."], ["tl-name", "tl-ne", "Add your first name."]].forEach(function (x) {
        var el = $("#" + x[0]);
        if (!el.value.trim()) { el.setAttribute("aria-invalid", "true"); $("#" + x[1]).textContent = x[2]; if (!first) first = el; }
        else { el.removeAttribute("aria-invalid"); $("#" + x[1]).textContent = ""; }
      });
      if (first) { first.focus(); track("triplist_error", { field: first.id }); return; }
      var who = { pickup: $("#tl-pickup").value.trim(), name: $("#tl-name").value.trim() };
      var msg = buildMessage(l2, g, who);
      track("whatsapp_open", { from: "triplist", trips: l2.length, products: l2.map(function (x) { return x.slug; }).join(",") });
      window.open(waUrl(msg), "_blank", "noopener");
      sentScreen(body, foot, msg);
    };
    refresh();
  }
  // Écran après ouverture de WhatsApp.
  function sentScreen(body, foot, msg) {
    body.innerHTML = '<div style="display:grid;gap:14px"><h3>WhatsApp should now be open with your message</h3>' +
      '<p class="mute">Press send in WhatsApp. The request only reaches us once you send it. We reply there with the confirmation. Reply time: <span class="data-todo">[DONNÉE À FOURNIR : délai de réponse]</span></p>' +
      '<p class="mute">WhatsApp did not open? Copy the message and send it to <b class="num">' + esc(WA.display) + "</b>.</p>" +
      '<div class="msg">' + esc(msg) + "</div></div>";
    foot.innerHTML = '<button type="button" class="btn line block" id="copy-msg">Copy the message</button><a class="btn block" href="' + waUrl(msg) + '" target="_blank" rel="noopener">' + ICON.wa + " Open WhatsApp again</a>";
    $("#copy-msg").onclick = function () { copy(msg, this); };
  }
  function copy(text, btn) {
    function done() { btn.textContent = "Message copied"; track("message_copy", {}); setTimeout(function () { btn.textContent = "Copy the message"; }, 2500); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { fallback(); done(); });
    else { fallback(); done(); }
    function fallback() { var ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (e) {} ta.remove(); }
  }

  // ---------- Carte produit ----------
  // opts : { group, month, showAdd, eager, compare }
  function card(p, o) {
    o = o || {};
    var dur = p.duration ? fact(p, p.duration.from) : null;
    var boat = fact(p, "Boat");
    var factsLine = [p.duration && p.duration.from === "Duration" ? dur : null, boat].filter(Boolean).join(", ");
    if (!factsLine && dur) factsLine = p.duration.from + ": " + dur;
    var price = p.priceOnRequest ? '<span class="amt">Price on WhatsApp</span>'
      : '<span class="u">from</span><span class="amt num">' + thb(p.price.from) + '</span><span class="u">' + esc(p.price.unit) + "</span>";
    var grp = "", flag = "", off = false;
    if (o.group) {
      var ro = refOption(p); var rq = ro ? quote(ro, o.group) : null;
      var b = rq && (rq.status === "ok" || rq.status === "partial") ? { opt: ro, q: rq } : null;
      if (b) {
        grp = '<p class="group">For ' + esc(guestsLine(o.group.adults, o.group.ages)) + ': <b class="num">' + thb(b.q.total) + '</b><br><span class="mute">' + esc(b.opt.label) + "</span>" +
          (b.q.unpriced.length ? '<br><span class="flag">Age ' + b.q.unpriced.join(", ") + ": no published price, we ask for you</span>" : "") + "</p>";
      } else if (!p.priceOnRequest) {
        var r = refOption(p); var q = r ? quote(r, o.group) : null;
        grp = '<p class="group mute">' + (q && q.status === "unit" ? "Priced per kart, not per person." : "Price for your group on WhatsApp.") + "</p>";
      }
    }
    if (o.month) {
      var run = runsInMonth(p, o.month);
      if (run === false) { off = true; flag = '<p class="flag">Not running in ' + MONTHS[o.month - 1] + ". Season: " + esc(p.season.text) + ".</p>"; }
    }
    var href = p.slug === "4-islands" ? "4-islands.html" : "#p-" + p.slug;
    return '<article class="pc' + (off ? " off" : "") + '" data-slug="' + p.slug + '"><div class="ph">' + img(p.photo, "", o.eager) + "</div>" +
      '<div class="body"><h3><a class="cover" href="' + href + '">' + esc(p.name) + "</a></h3>" +
      (p.promise ? '<p class="promise">' + esc(p.promise) + "</p>" : "") +
      (factsLine ? '<p class="facts">' + esc(factsLine) + (p.season ? ". Season: " + esc(p.season.text) : "") + "</p>" : "") +
      '<p class="price">' + price + "</p>" + grp + flag +
      '<div class="acts">' + (o.showAdd !== false ? '<button type="button" class="btn line" data-add="' + p.slug + '">Add to trip list</button>' : "") +
      (o.compare ? '<label class="tg" style="display:inline-flex;gap:8px;align-items:center"><input type="checkbox" data-cmp="' + p.slug + '"' + (o.compareOn ? " checked" : "") + "> Compare</label>" : "") +
      "</div></div></article>";
  }
  // Ajout depuis une carte : option de référence, date de la page si elle existe.
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-add]"); if (!b) return;
    var p = bySlug(b.getAttribute("data-add"));
    var g = loadGroup();
    var opt = refOption(p);
    addToList({ slug: p.slug, option: opt ? opt.id : null, date: g.date || null, addOns: [] });
  });

  window.R = {
    D: D, IMG: IMG, WA: WA, ICON: ICON, $: $, $$: $$, esc: esc, fmt: fmt, thb: thb, plural: plural, listJoin: listJoin,
    bySlug: bySlug, optById: optById, fact: fact, img: img, todayIso: todayIso, addDays: addDays, longDate: longDate, shortDate: shortDate, monthOf: monthOf, MONTHS: MONTHS, DAYS: DAYS, toDate: toDate,
    runsInMonth: runsInMonth, quote: quote, cashFees: cashFees, refOption: refOption, bestFor: bestFor, breakdown: breakdown, lineLabel: lineLabel, priceRowsText: priceRowsText, addOns: addOns,
    loadGroup: loadGroup, saveGroup: saveGroup, guestsLine: guestsLine, track: track, buildMessage: buildMessage, waUrl: waUrl,
    loadList: loadList, saveList: saveList, addToList: addToList, openList: openList, conflicts: conflicts, toast: toast, chrome: chrome, groupControl: groupControl, card: card, copy: copy, sentScreen: sentScreen,
  };
})();
