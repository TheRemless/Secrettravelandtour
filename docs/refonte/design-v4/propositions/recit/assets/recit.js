/* Comportements communs du prototype « récit ». Données : window.STT (assets/data.js, généré depuis src/_data). */
(function () {
  "use strict";
  var S = window.STT;
  var IMG = "../../../../../src/images/";
  var LIVE = "https://deploy-preview-8--steady-capybara-eb28c9.netlify.app";
  var R = {};
  window.RECIT = R;

  R.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  R.thb = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " THB"; };
  R.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  R.product = function (slug) { return S.products.filter(function (p) { return p.slug === slug; })[0]; };
  R.fact = function (p, label) { var f = (p.facts || []).filter(function (x) { return x.label === label; })[0]; return f ? f.value : null; };
  // Lien produit : 4 Islands est prototypée ici, les autres pointent vers la v3 en ligne.
  R.href = function (p) { return p.slug === "4-islands" ? "4-islands.html" : LIVE + p.url; };
  R.liveHref = function (url) { return LIVE + url; };

  R.img = function (id, opts) {
    opts = opts || {};
    var p = S.photos[id];
    if (!p) return '<div class="ph ph--missing ' + (opts.cls || "") + '"><span class="todo">[PHOTO À FOURNIR : ' + R.esc(opts.missing || id) + ']</span></div>';
    return '<div class="ph ' + (opts.cls || "") + '"><img src="' + IMG + p.file + '" alt="' + R.esc(opts.decorative ? "" : p.alt) + '" style="object-position:' + (opts.position || p.position || "50% 50%") + '"' + (opts.eager ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async"></div>';
  };
  R.imgSrc = function (id) { return S.photos[id] ? IMG + S.photos[id].file : ""; };

  R.priceHTML = function (p, big) {
    if (!p.price) return '<p class="price' + (big ? " price--big" : "") + '"><span class="price__unit">Price on WhatsApp</span></p>';
    return '<p class="price' + (big ? " price--big" : "") + '"><span class="price__from">from</span> <span class="price__amt">' + R.thb(p.price.from) + '</span> <span class="price__unit">' + R.esc(p.price.unit) + "</span></p>";
  };

  R.wa = function (text) { return S.site.whatsapp.link + (text ? "?text=" + encodeURIComponent(text) : ""); };

  var WA_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 4.54 0 8.24 3.7 8.24 8.24 0 4.55-3.7 8.24-8.24 8.24zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z"/></svg>';
  R.WA_ICON = WA_ICON;
  var X_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>';
  R.X_ICON = X_ICON;

  // En-tête, menu mobile et pied de page : un seul gabarit pour les trois pages (une partielle dans Eleventy).
  function chrome() {
    var slot = document.querySelector("[data-chrome]");
    if (slot) {
      var cur = slot.getAttribute("data-chrome");
      var links = [["tours.html#boat", "Boat trips", "boat"], ["tours.html#activity", "Activities", "activity"], ["home.html#transfers", "Transfers", "transfers"], [LIVE + "/tours/rental/", "Rental", "rental"]];
      var nav = links.map(function (l) { return '<a href="' + l[0] + '"' + (cur === l[2] ? ' aria-current="page"' : "") + ">" + l[1] + "</a>"; }).join("");
      slot.outerHTML = '<a class="skip" href="#main">Skip to content</a><header class="top"><div class="wrap top__in">' +
        '<a class="brand" href="home.html"><img src="' + IMG + S.site.logo + '" alt="" width="46" height="46"><span>' + R.esc(S.site.name) + "</span></a>" +
        '<nav class="nav" aria-label="Main">' + nav + "</nav>" +
        '<a class="btn" data-wa="" href="#">' + WA_ICON + "<span>WhatsApp</span></a>" +
        '<button class="menu-btn" type="button" data-menu-open aria-label="Open the menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>' +
        "</div></header>" +
        '<dialog id="menu" class="menu" aria-label="Menu"><div class="menu__in"><button class="x menu__close" type="button" data-menu-close aria-label="Close the menu">' + X_ICON + "</button><nav>" + nav + '</nav><a class="btn btn--big" data-wa="" href="#">' + WA_ICON + "WhatsApp " + R.esc(S.site.whatsapp.display) + "</a></div></dialog>";
    }
    var foot = document.querySelector("[data-foot]");
    if (foot) {
      var li = function (kind) { return S.products.filter(function (p) { return p.kind === kind; }).map(function (p) { return '<li><a href="' + R.href(p) + '">' + R.esc(p.name) + "</a></li>"; }).join(""); };
      foot.outerHTML = '<footer class="foot on-dark"><div class="wrap"><div class="foot__grid">' +
        '<div class="foot__brand"><img src="' + IMG + S.site.logo + '" alt="' + R.esc(S.site.name) + '" width="64" height="64"><p>' + R.esc(S.site.name) + " is operated by " + R.esc(S.site.operator.replace(/\.$/, "")) + '.</p><p><a class="link" style="color:#fff" data-wa="" href="#">WhatsApp ' + R.esc(S.site.whatsapp.display) + "</a></p></div>" +
        '<div><h2>Boat trips</h2><ul>' + li("boat") + "</ul></div>" +
        '<div><h2>Activities</h2><ul>' + li("activity") + "</ul></div>" +
        '<div><h2>Getting around</h2><ul>' + S.transfers.map(function (t) { return '<li><a href="' + LIVE + t.url + '">' + R.esc(t.name) + "</a></li>"; }).join("") +
        '<li><a href="' + LIVE + S.taxi.url + '">' + R.esc(S.taxi.name) + '</a></li><li><a href="' + LIVE + S.rental.url + '">' + R.esc(S.rental.name) + "</a></li></ul></div>" +
        '</div><div class="foot__base"><span>© ' + new Date().getFullYear() + " " + R.esc(S.site.operator) + "</span><span>Licence " + R.esc(S.site.licence) + '</span><a href="' + LIVE + '/terms/">Terms</a><a href="' + LIVE + '/privacy/">Privacy</a></div></div></footer>';
    }
  }
  R.chrome = chrome;

  // ---------- En-tête ----------
  function header() {
    var top = document.querySelector(".top");
    if (top) {
      var on = function () { top.classList.toggle("is-scrolled", window.scrollY > 8); };
      on(); window.addEventListener("scroll", on, { passive: true });
    }
    var menu = document.getElementById("menu");
    document.querySelectorAll("[data-menu-open]").forEach(function (b) { b.addEventListener("click", function () { menu.showModal(); }); });
    document.querySelectorAll("[data-menu-close]").forEach(function (b) { b.addEventListener("click", function () { menu.close(); }); });
    document.querySelectorAll("[data-wa]").forEach(function (a) { a.href = R.wa(a.getAttribute("data-wa")); a.target = "_blank"; a.rel = "noopener"; });
    document.querySelectorAll("[data-year]").forEach(function (e) { e.textContent = new Date().getFullYear(); });
    document.querySelectorAll("[data-licence]").forEach(function (e) { e.textContent = S.site.licence; });
    document.querySelectorAll("[data-operator]").forEach(function (e) { e.textContent = S.site.operator; });
    document.querySelectorAll("[data-wa-display]").forEach(function (e) { e.textContent = S.site.whatsapp.display; });
  }

  // ---------- Carte schématique ----------
  // Projection équirectangulaire corrigée de la latitude : schéma, pas carte marine.
  R.map = function (el, cfg) {
    var f = cfg.frame, W = cfg.width || 600;
    var k = Math.cos((f.lat0 + f.lat1) / 2 * Math.PI / 180);
    var H = Math.round(W * (f.lat1 - f.lat0) / ((f.lon1 - f.lon0) * k));
    var x = function (lon) { return (lon - f.lon0) / (f.lon1 - f.lon0) * W; };
    var y = function (lat) { return (f.lat1 - lat) / (f.lat1 - f.lat0) * H; };
    var P = function (pt) { return [x(pt[0]), y(pt[1])]; };
    var svg = ['<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-labelledby="' + cfg.id + '-t"><title id="' + cfg.id + '-t">' + R.esc(cfg.title) + "</title>"];
    svg.push('<rect class="sea" width="' + W + '" height="' + H + '"/>');
    Object.keys(S.geo).forEach(function (key) {
      var g = S.geo[key];
      g.rings.forEach(function (ring) {
        var d = ring.map(function (pt, i) { var q = P(pt); return (i ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1); }).join("") + "Z";
        svg.push('<path class="land' + (key.indexOf("lanta") === 0 ? " land--main" : "") + '" d="' + d + '"/>');
      });
    });
    (cfg.routes || []).forEach(function (r) {
      svg.push('<path class="route ' + (r.cls || "") + '" data-route="' + r.id + '" d="' + r.d(P) + '"/>');
    });
    (cfg.stops || []).forEach(function (s) {
      var g = S.geo[s.place], q = P(s.at || [g.lon, g.lat]);
      svg.push('<circle class="stop" data-stop="' + s.id + '" cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="' + (s.r || 7) + '"/>');
    });
    (cfg.labels || []).forEach(function (l) {
      var g = S.geo[l.place], q = P(l.at || [g.lon, g.lat]);
      svg.push('<text class="lbl' + (l.big ? " lbl--big" : "") + '" data-lbl="' + (l.id || l.place) + '" x="' + (q[0] + (l.dx || 0)).toFixed(1) + '" y="' + (q[1] + (l.dy || 0)).toFixed(1) + '" text-anchor="' + (l.anchor || "start") + '">' + R.esc(l.text) + "</text>");
    });
    if (cfg.scaleKm) {
      var px = cfg.scaleKm / 110.6 / (f.lat1 - f.lat0) * H, sx = W - px - 24, sy = H - 26;
      svg.push('<line class="scale" x1="' + sx + '" y1="' + sy + '" x2="' + (sx + px) + '" y2="' + sy + '"/><text class="scale-t" x="' + (sx + px) + '" y="' + (sy - 8) + '" text-anchor="end">' + cfg.scaleKm + " km</text>");
    }
    if (cfg.boat) svg.push('<g class="boat" data-boat><path d="M-13 -2 L13 -2 L9 6 L-9 6 Z" fill="#0F2A3D"/><path d="M-13 -2 L-17 -9" stroke="#C8255F" stroke-width="3" stroke-linecap="round"/><circle r="3" cy="-6" cx="2" fill="#C8255F"/></g>');
    svg.push("</svg>");
    el.innerHTML = svg.join("") + (cfg.note === false ? "" : '<p class="map__note">' + (cfg.note || "Sketch map. Positions are approximate. Island outlines © OpenStreetMap contributors.") + "</p>");
    var api = { svg: el.querySelector("svg"), P: P, x: x, y: y, W: W, H: H };
    api.boatTo = function (pt) { var b = el.querySelector("[data-boat]"); if (!b) return; var q = P(pt); b.setAttribute("transform", "translate(" + q[0].toFixed(1) + " " + q[1].toFixed(1) + ")"); b.style.transform = ""; };
    return api;
  };

  // Courbe douce entre points (Catmull-Rom vers Bézier).
  R.curve = function (pts, P) {
    var p = pts.map(P), d = "M" + p[0][0].toFixed(1) + " " + p[0][1].toFixed(1);
    for (var i = 0; i < p.length - 1; i++) {
      var p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      var c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      var c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += "C" + c1.map(function (n) { return n.toFixed(1); }).join(" ") + " " + c2.map(function (n) { return n.toFixed(1); }).join(" ") + " " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
    }
    return d;
  };

  // ---------- Réservation (format du message repris de src/js/booking.js) ----------
  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  R.today = function () {
    var parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    var g = function (t) { return parts.filter(function (p) { return p.type === t; })[0].value; };
    return g("year") + "-" + g("month") + "-" + g("day");
  };
  R.addDays = function (iso, n) { var p = iso.split("-").map(Number), d = new Date(Date.UTC(p[0], p[1] - 1, p[2])); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  R.fmtDate = function (iso) { var p = iso.split("-").map(Number), d = new Date(Date.UTC(p[0], p[1] - 1, p[2])); return DAYS[d.getUTCDay()] + " " + d.getUTCDate() + " " + MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear(); };
  R.dayParts = function (iso) { var p = iso.split("-").map(Number), d = new Date(Date.UTC(p[0], p[1] - 1, p[2])); return { dow: DAYS[d.getUTCDay()], d: d.getUTCDate(), m: MONTHS[d.getUTCMonth()] }; };

  // Total d'après les lignes de prix de l'option. Renvoie les lignes du calcul et ce qui manque.
  R.quote = function (opt, adults, ages) {
    var lines = [], missing = [], total = 0, prices = opt.prices;
    var find = function (fn) { return prices.filter(fn)[0]; };
    var kids = ages.map(Number);
    if (opt.kind === "private") {
      var people = adults + kids.length;
      var base = prices.filter(function (r) { return r.group; });
      var hit = base.filter(function (r) { return people >= r.group.min && people <= r.group.max; })[0];
      var top = base.reduce(function (a, r) { return !a || r.group.max > a.group.max ? r : a; }, null);
      var extra = find(function (r) { return r.supplement && /extra person/i.test(r.label); });
      if (hit) { lines.push([hit.label + ", the boat", hit.amount]); total += hit.amount; }
      else if (top && people > top.group.max && extra) {
        var n = people - top.group.max;
        lines.push([top.label + ", the boat", top.amount]); lines.push([n + " × each extra person, " + R.thb(extra.amount), n * extra.amount]);
        total += top.amount + n * extra.amount;
      }
      if (kids.length) missing.push("les enfants comptent-ils comme des personnes sur le bateau privé ?");
      return { total: total, lines: lines, missing: missing };
    }
    var adult = find(function (r) { return /^adult$/i.test(r.label); });
    if (adult && adults) { lines.push([adults + " × adult, " + R.thb(adult.amount), adults * adult.amount]); total += adults * adult.amount; }
    var groups = {};
    kids.forEach(function (age) {
      if (age >= 12) { groups.adult = (groups.adult || 0) + 1; return; }
      var row = find(function (r) { return r.ages && age >= (r.ages.min || 0) && age <= r.ages.max; });
      if (!row) { missing.push("tarif pour un enfant de " + age + " ans sur cette option"); return; }
      groups[row.label] = groups[row.label] || { row: row, n: 0 }; groups[row.label].n++;
    });
    if (groups.adult && adult) { lines.push([groups.adult + " × age 12 and over, adult rate", groups.adult * adult.amount]); total += groups.adult * adult.amount; }
    Object.keys(groups).forEach(function (k) {
      if (k === "adult") return;
      var g = groups[k]; lines.push([g.n + " × " + g.row.label.toLowerCase() + ", " + (g.row.amount ? R.thb(g.row.amount) : "free"), g.n * g.row.amount]); total += g.n * g.row.amount;
    });
    return { total: total, lines: lines, missing: missing };
  };

  R.parkCash = function (opt, adults, ages) {
    var a = (opt.fees || []).filter(function (f) { return f.label === "National park fee, adult"; })[0];
    var c = (opt.fees || []).filter(function (f) { return f.label === "National park fee, child"; })[0];
    if (!a) return null;
    var kids = ages.filter(function (x) { return Number(x) < 12; }).length, big = adults + ages.length - kids;
    var t = big * a.amount + (c ? kids * c.amount : 0);
    return { total: t, text: big + " × " + a.amount + (kids && c ? " + " + kids + " × " + c.amount : "") + " = " + R.thb(t) };
  };

  R.message = function (p, opt, st) {
    var lines = [];
    var guests = []; if (st.adults) guests.push(st.adults + " " + (st.adults === 1 ? "adult" : "adults"));
    if (st.ages.length === 1) guests.push("1 child (age " + st.ages[0] + ")");
    else if (st.ages.length > 1) guests.push(st.ages.length + " children (ages " + st.ages.slice(0, -1).join(", ") + " and " + st.ages[st.ages.length - 1] + ")");
    if (st.date && p.refPrefix) { var d = st.date.split("-"); lines.push("Ref: " + p.refPrefix + "-" + d[2] + d[1] + "-" + st.adults + "A" + (st.ages.length ? st.ages.length + "C" : "")); }
    lines.push("Booking request: " + p.name + (opt ? " – " + opt.label : ""));
    if (st.date) lines.push("Date: " + R.fmtDate(st.date));
    lines.push("Guests: " + guests.join(", "));
    if (st.extra) lines.push("Extra: " + st.extra);
    if (st.pickup) lines.push("Pickup: " + st.pickup);
    if (st.name) lines.push("Name: " + st.name);
    if (opt) lines.push("Price on website: " + opt.prices.filter(function (r) { return r.amount != null; }).map(function (r) { return r.label + ": " + (r.amount ? R.thb(r.amount) : "free"); }).join(" / "));
    if (st.total) lines.push("Total on website: " + R.thb(st.total) + (st.park ? ", plus " + R.thb(st.park) + " park fee in cash" : ""));
    lines.push("Page: " + "https://secrettravelandtour.com" + p.url);
    return lines.join("\n");
  };

  // Galerie plein écran (toute image portant data-zoom).
  function lightbox() {
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-zoom]"));
    if (!items.length) return;
    var dlg = document.createElement("dialog"); dlg.className = "lb"; dlg.setAttribute("aria-label", "Photos");
    dlg.innerHTML = '<div class="lb__in"><img alt=""><p class="lb__cap"></p><div class="lb__bar"><button class="btn btn--light" data-prev>Previous</button><span class="lb__n" aria-live="polite"></span><button class="btn btn--light" data-next>Next</button><button class="btn btn--light" data-close>Close</button></div></div>';
    document.body.appendChild(dlg);
    var i = 0, show = function (n) { i = (n + items.length) % items.length; var im = items[i].querySelector("img"); dlg.querySelector("img").src = im.src; dlg.querySelector("img").alt = im.alt; dlg.querySelector(".lb__cap").textContent = items[i].getAttribute("data-zoom") || im.alt; dlg.querySelector(".lb__n").textContent = (i + 1) + " / " + items.length; };
    items.forEach(function (it, n) { it.setAttribute("role", "button"); it.tabIndex = 0; it.setAttribute("aria-label", "Open photo: " + (it.getAttribute("data-zoom") || "")); var go = function () { show(n); dlg.showModal(); }; it.addEventListener("click", go); it.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } }); });
    dlg.querySelector("[data-prev]").onclick = function () { show(i - 1); };
    dlg.querySelector("[data-next]").onclick = function () { show(i + 1); };
    dlg.querySelector("[data-close]").onclick = function () { dlg.close(); };
    dlg.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") show(i - 1); if (e.key === "ArrowRight") show(i + 1); });
  }

  // Scripts chargés en fin de <body> : le DOM est déjà là.
  chrome();
  document.addEventListener("DOMContentLoaded", function () { header(); setTimeout(lightbox, 0); });
})();
