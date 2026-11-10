/* Proposition « mouvement » : comportements communs aux trois pages.
   Toutes les données viennent de window.STT (data.js, généré depuis src/_data). */
(function () {
  "use strict";
  var S = window.STT;
  var M = (window.M = {});
  var root = document.documentElement;
  root.classList.add("js");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)");
  var desktop = matchMedia("(min-width: 900px)");
  M.reduce = reduce;

  // ---------- petits outils ----------
  M.$ = function (s, el) { return (el || document).querySelector(s); };
  M.$$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  M.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  M.fmt = function (n) { return Number(n).toLocaleString("en-US"); };
  M.thb = function (n) { return M.fmt(n) + " THB"; };
  M.product = function (slug) { return S.products.filter(function (p) { return p.slug === slug; })[0]; };
  M.fact = function (p, label) { var f = p.facts.filter(function (x) { return x.label === label; })[0]; return f ? f.value : ""; };
  M.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  // Transition de vue dans la page : repli instantané si le navigateur ne sait pas ou si l'on réduit le mouvement.
  M.vt = function (update) {
    if (!document.startViewTransition || reduce.matches) { update(); return Promise.resolve(); }
    var t = document.startViewTransition(update);
    return t.finished.catch(function () {});
  };

  // ---------- photos : vignette floue (LQIP) puis fondu au décodage ----------
  M.img = function (id, o) {
    o = o || {};
    var p = S.photos[id];
    var attrs = o.eager ? 'fetchpriority="high"' : 'loading="lazy" class="fade"';
    return '<div class="ph ' + (o.cls == null ? "ph--43" : o.cls) + '" style="--c:' + p.color + ";--lq:url(" + p.lqip + ')"' +
      (o.name ? ' data-name="' + o.name + '"' : "") + '>' +
      '<img src="' + p.src + '" alt="' + (o.decorative ? "" : M.esc(p.alt)) + '" width="' + p.w + '" height="' + p.h +
      '" style="object-position:' + p.position + '" decoding="async" ' + attrs + "></div>";
  };
  M.bindImgs = function (scope) {
    M.$$("img.fade:not(.is-in)", scope).forEach(function (img) {
      if (img.complete && img.naturalWidth) img.classList.add("is-in");
      else img.addEventListener("load", function () { img.classList.add("is-in"); }, { once: true });
    });
  };

  M.priceHTML = function (p) {
    if (!p.price) return '<p class="price price--req"><b>Price on WhatsApp</b></p>';
    return '<p class="price"><span>from</span><b>' + M.thb(p.price.from) + "</b><span>" + M.esc(p.price.unit) + "</span></p>";
  };
  M.href = function (p) { return p.page || "tours.html#" + p.slug; };
  M.card = function (p, o) {
    o = o || {};
    var meta = p.meta.length ? '<p class="card__meta">' + p.meta.map(function (m) { return "<span>" + M.esc(m) + "</span>"; }).join("") + "</p>" : "";
    return '<a class="card press" href="' + M.href(p) + '" data-slug="' + p.slug + '">' + M.img(p.photo) +
      '<div class="card__body"><h3>' + M.esc(p.name) + "</h3>" +
      (p.line ? '<p class="card__line">' + M.esc(p.line) + "</p>" : "") + meta + M.priceHTML(p) + "</div></a>";
  };

  M.wa = function (text) { return S.site.whatsapp.link + (text ? "?text=" + encodeURIComponent(text) : ""); };
  M.icon = {
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    left: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    right: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    swap: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3"/></svg>'
  };

  // ---------- en-tête et pied de page communs ----------
  M.header = function (current) {
    var links = [["tours.html?type=boat", "Boat trips", "boat"], ["tours.html?type=activity", "Activities", "activity"],
      ["home.html#transfers", "Transfers", "transfers"], ["home.html#rental", "Rental", "rental"]];
    var nav = links.map(function (l) { return '<a href="' + l[0] + '"' + (l[2] === current ? ' aria-current="page"' : "") + ">" + l[1] + "</a>"; }).join("");
    var mac = /Mac|iPhone|iPad/.test(navigator.platform);
    return '<a class="skip" href="#main">Skip to content</a>' +
      '<header class="hd" id="hd"><div class="wrap hd__in">' +
      '<a class="brand" href="home.html"><img src="../../../../../src/images/secret/emblem.webp" alt="" width="240" height="198"><b>Secret Travel &amp; Tour</b></a>' +
      '<nav class="nav" aria-label="Main">' + nav + "</nav>" +
      '<div class="hd__tools"><button class="find" type="button" data-pal aria-label="Search trips and transfers">' + M.icon.search + "<span>Search</span><kbd>" + (mac ? "⌘K" : "Ctrl K") + "</kbd></button>" +
      '<a class="btn" href="' + M.wa() + '" target="_blank" rel="noopener">' + M.icon.wa + '<span class="wa-label">WhatsApp</span><span class="sr">Message us on WhatsApp</span></a>' +
      '<button class="menu-btn" type="button" aria-label="Open the menu" data-menu>' + M.icon.menu + "</button></div></div></header>" +
      '<dialog class="drawer" id="drawer" aria-label="Menu"><div class="drawer__top"><a class="brand" href="home.html"><img src="../../../../../src/images/secret/emblem.webp" alt="" width="240" height="198"><b>Secret Travel &amp; Tour</b></a>' +
      '<button class="x" type="button" data-close aria-label="Close the menu">' + M.icon.close + "</button></div><nav>" + nav + "</nav></dialog>";
  };
  M.footer = function () {
    var boats = S.products.filter(function (p) { return p.kind === "boat"; });
    var acts = S.products.filter(function (p) { return p.kind === "activity"; });
    var li = function (p) { return '<li><a href="' + M.href(p) + '">' + M.esc(p.name) + "</a></li>"; };
    return '<footer class="ft on-dark"><div class="wrap"><div class="ft__grid">' +
      '<div><p class="ft__brand"><img src="../../../../../src/images/secret/emblem.webp" alt="" width="240" height="198">Secret Travel &amp; Tour</p>' +
      '<p class="ft__wa"><a class="link link--light" href="' + M.wa() + '" target="_blank" rel="noopener">WhatsApp ' + S.site.whatsapp.display + "</a></p></div>" +
      "<div><h4>Boat trips</h4><ul>" + boats.map(li).join("") + "</ul></div>" +
      "<div><h4>Activities</h4><ul>" + acts.map(li).join("") + "</ul></div>" +
      '<div><h4>More</h4><ul><li><a href="home.html#transfers">Transfers</a></li><li><a href="home.html#rental">Car and scooter rental</a></li><li><a href="/terms/">Terms</a></li></ul></div>' +
      '</div><div class="ft__meta"><span>' + S.brand + " is operated by " + S.site.operator.replace(/\.?$/, ".") + "</span><span>Licence " + S.site.licence + "</span><span>Prices in Thai baht. Nothing is paid online.</span></div></div></footer>";
  };
  S.brand = S.site.brand;

  // L'en-tête se cache quand on descend, revient dès qu'on remonte un peu. Seuils pour éviter le clignotement.
  function bindHeader() {
    var hd = M.$("#hd");
    if (!hd) return;
    var lastY = scrollY, acc = 0, ticking = false;
    function update() {
      ticking = false;
      var y = scrollY, dy = y - lastY;
      lastY = y;
      if (y < 120 || hd.contains(document.activeElement) || document.querySelector("dialog[open]")) { show(true); acc = 0; return; }
      if ((dy > 0) !== (acc > 0)) acc = 0;
      acc += dy;
      if (acc > 24) show(false);
      else if (acc < -8) show(true);
    }
    function show(on) {
      if (hd.classList.contains("is-hidden") === !on) return;
      hd.classList.toggle("is-hidden", !on);
      root.classList.toggle("hd-off", !on);
      document.dispatchEvent(new CustomEvent("hd", { detail: on }));
    }
    addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    M.$("[data-menu]") && M.$("[data-menu]").addEventListener("click", function () { M.$("#drawer").showModal(); });
    M.$("#drawer [data-close]").addEventListener("click", function () { M.$("#drawer").close(); });
  }

  // ---------- préchargement : la page suivante est en cache avant le clic ----------
  // Survol de 80 ms (intention, pas un passage de souris) ou premier contact du doigt.
  var fetched = {};
  M.prefetch = function (url) {
    if (!url || fetched[url] || /^(https?:)?\/\//.test(url) && url.indexOf(location.host) < 0) return;
    fetched[url] = 1;
    var l = document.createElement("link");
    l.rel = "prefetch"; l.href = url;
    document.head.appendChild(l);
  };
  function bindPrefetch() {
    var timer;
    function target(e) { var a = e.target.closest && e.target.closest("a[href$='.html'], a[href*='.html?'], a[href*='.html#']"); return a && a.getAttribute("href"); }
    document.addEventListener("pointerover", function (e) {
      var url = target(e); if (!url) return;
      clearTimeout(timer); timer = setTimeout(function () { M.prefetch(url.split("#")[0]); }, 80);
    }, { passive: true });
    document.addEventListener("pointerout", function () { clearTimeout(timer); }, { passive: true });
    document.addEventListener("touchstart", function (e) { var url = target(e); if (url) M.prefetch(url.split("#")[0]); }, { passive: true });
  }

  // ---------- transitions entre pages : la photo de la carte devient le hero du produit ----------
  function bindPageTransitions() {
    var last = null;
    document.addEventListener("click", function (e) { var a = e.target.closest("a[href]"); if (a) last = a; }, true);
    addEventListener("pageswap", function (e) {
      if (!e.viewTransition) return;
      var to = e.activation && e.activation.entry && e.activation.entry.url || "";
      if (!/4-islands\.html/.test(to)) return;
      var ph = last && (last.dataset.photo ? M.$(last.dataset.photo) : last.querySelector(".ph"));
      if (ph) ph.style.viewTransitionName = "trip-photo";
    });
    addEventListener("pagereveal", function (e) {
      if (!e.viewTransition || !window.navigation || !navigation.activation || !navigation.activation.from) return;
      var from = navigation.activation.from.url || "";
      if (!/4-islands\.html/.test(from)) return;
      var card = M.$('a.card[data-slug="4-islands"] .ph, [data-slug="4-islands"] .ph');
      if (card && !/4-islands\.html/.test(location.href)) {
        card.style.viewTransitionName = "trip-photo";
        e.viewTransition.finished.then(function () { card.style.viewTransitionName = ""; });
      }
    });
  }

  // ---------- recherche instantanée (⌘K, « / ») ----------
  var index = null;
  function buildIndex() {
    index = S.products.map(function (p) {
      var hay = [p.name, p.line, p.lead].concat(p.facts.map(function (f) { return f.label + ": " + f.value; }), p.options.map(function (o) { return o.label; }));
      return { kind: p.kind === "boat" ? "Boat trip" : "Activity", name: p.name, line: p.line || p.lead, href: M.href(p), photo: p.photo, price: p.price ? "from " + M.thb(p.price.from) : "Price on WhatsApp", hay: hay };
    }).concat(S.taxi.map(function (t) {
      return { kind: "Transfer", name: t.name, line: "Private minivan, " + t.drive + ", " + S.site.vip.name, href: t.url, hay: [t.name, t.from, t.to, t.code, "transfer taxi minivan airport"] };
    }), [{ kind: "Rental", name: S.rental.name, line: S.rental.lead, href: "home.html#rental", hay: [S.rental.name, S.rental.lead].concat(S.rental.facts.map(function (f) { return f.value; })), price: "from " + M.thb(S.rental.price.from) },
      { kind: "Transfer", name: S.speedboat.name, line: S.speedboat.lead, href: "home.html#transfers", hay: [S.speedboat.name, S.speedboat.lead].concat(S.speedboat.facts.map(function (f) { return f.value; })) }]);
  }
  function norm(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function mark(text, words) {
    var out = M.esc(text);
    words.forEach(function (w) { if (w.length > 1) out = out.replace(new RegExp("(" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig"), "<mark>$1</mark>"); });
    return out;
  }
  M.search = function (q) {
    if (!index) buildIndex();
    var words = norm(q).split(/\s+/).filter(Boolean);
    if (!words.length) return index.slice(0, 13).map(function (r) { return { r: r, snip: r.line, words: [] }; });
    var res = [];
    index.forEach(function (r) {
      var score = 0, snip = "", ok = words.every(function (w) {
        if (norm(r.name).indexOf(w) > -1) { score += 10; return true; }
        for (var i = 0; i < r.hay.length; i++) if (r.hay[i] && norm(r.hay[i]).indexOf(w) > -1) { score += 3; if (!snip) snip = r.hay[i]; return true; }
        return false;
      });
      if (ok) res.push({ r: r, score: score, snip: snip || r.line, words: words });
    });
    return res.sort(function (a, b) { return b.score - a.score; });
  };
  M.resultHTML = function (x, i) {
    var r = x.r;
    var snip = x.snip.length > 110 ? x.snip.slice(0, 108) + "…" : x.snip;
    return '<li role="option" id="pal-' + i + '"><a href="' + r.href + '"' + (i === 0 ? ' aria-selected="true"' : "") + ">" +
      (r.photo ? M.img(r.photo, { cls: "", decorative: true }) : '<span class="ph" aria-hidden="true"></span>') +
      "<span><b>" + mark(r.name, x.words) + "</b><small>" + r.kind + ", " + mark(snip, x.words) + "</small></span>" +
      '<span class="pr">' + (r.price || "") + "</span></a></li>";
  };
  function bindPalette() {
    var dlg = document.createElement("dialog");
    dlg.className = "pal"; dlg.setAttribute("aria-label", "Search");
    dlg.innerHTML = '<div class="pal__in">' + M.icon.search + '<input type="search" placeholder="Emerald Cave, Maya Bay, elephants, Krabi Airport" aria-label="Search trips, activities and transfers" role="combobox" aria-expanded="true" aria-controls="pal-list" autocomplete="off"></div>' +
      '<ul class="pal__list" id="pal-list" role="listbox"></ul><p class="pal__hint"><span>↑ ↓ to move</span><span>Enter to open</span><span>Esc to close</span></p>';
    document.body.appendChild(dlg);
    var input = M.$("input", dlg), list = M.$(".pal__list", dlg), sel = 0;
    function render() {
      var res = M.search(input.value);
      sel = 0;
      list.innerHTML = res.length ? res.map(M.resultHTML).join("") : '<li class="pal__empty">Nothing matches “' + M.esc(input.value) + '”. Ask us on WhatsApp, we also book what is not listed here.</li>';
      M.bindImgs(list);
      input.setAttribute("aria-activedescendant", res.length ? "pal-0" : "");
    }
    function move(d) {
      var items = M.$$("li a", list); if (!items.length) return;
      items[sel].removeAttribute("aria-selected");
      sel = (sel + d + items.length) % items.length;
      items[sel].setAttribute("aria-selected", "true");
      items[sel].scrollIntoView({ block: "nearest" });
      input.setAttribute("aria-activedescendant", "pal-" + sel);
      M.prefetch(items[sel].getAttribute("href").split("#")[0]);
    }
    M.openPalette = function (q) { input.value = q || ""; render(); dlg.showModal(); input.focus(); };
    input.addEventListener("input", render);
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Escape") { e.preventDefault(); dlg.close(); }
      else if (e.key === "Enter") { var a = M.$$("li a", list)[sel]; if (a) { e.preventDefault(); dlg.close(); a.click(); } }
    });
    list.addEventListener("click", function (e) { if (e.target.closest("a")) dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    document.addEventListener("keydown", function (e) {
      var typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) { e.preventDefault(); dlg.open ? dlg.close() : M.openPalette(); }
    });
    document.addEventListener("click", function (e) { var b = e.target.closest("[data-pal]"); if (b) M.openPalette(b.getAttribute("data-q") || ""); });
  }

  // ---------- ressort : anime une valeur avec la vitesse du geste, interruptible ----------
  M.spring = function (from, to, v0, onUpdate, onDone, k) {
    var x = from, v = (v0 || 0) * 1000, stiff = k || 380, damp = 2 * Math.sqrt(stiff) * 0.9, last = performance.now(), id;
    if (reduce.matches) { onUpdate(to); onDone && onDone(); return function () {}; }
    function step(t) {
      var dt = Math.min(0.032, (t - last) / 1000); last = t;
      for (var i = 0; i < 2; i++) { var a = -stiff * (x - to) - damp * v; v += a * dt / 2; x += v * dt / 2; }
      onUpdate(x);
      if (Math.abs(v) < 4 && Math.abs(x - to) < 0.4) { onUpdate(to); onDone && onDone(); return; }
      id = requestAnimationFrame(step);
    }
    id = requestAnimationFrame(step);
    return function () { cancelAnimationFrame(id); };
  };
  // Résistance élastique au-delà d'une limite (comme iOS)
  M.rubber = function (d, dim) { return (1 - 1 / (d * 0.55 / dim + 1)) * dim; };

  // ---------- feuille du bas / panneau latéral, pilotés au doigt ----------
  M.sheet = function (dlg, opts) {
    opts = opts || {};
    var panel = M.$(".sheet__panel", dlg), scrim = M.$(".sheet__scrim", dlg), body = M.$(".sheet__body", dlg);
    var pos = 0, size = 0, stop = function () {}, drag = null;
    function axis() { return desktop.matches ? "--x" : "--y"; }
    function set(v) { pos = v; panel.style.setProperty(axis(), v + "px"); scrim.style.setProperty("--scrim", M.clamp(1 - v / size, 0, 1)); }
    function measure() { size = desktop.matches ? panel.offsetWidth : panel.offsetHeight; }
    function open() {
      if (dlg.open) return;
      panel.style.removeProperty("--x"); panel.style.removeProperty("--y");
      dlg.showModal(); measure(); set(size); stop();
      stop = M.spring(size, 0, 0, set, null, 320);
      opts.onOpen && opts.onOpen();
    }
    function close(v) {
      stop();
      stop = M.spring(pos, size, v || 0, set, function () { dlg.close(); opts.onClose && opts.onClose(); }, 520);
    }
    dlg.addEventListener("cancel", function (e) { e.preventDefault(); close(); });
    scrim.addEventListener("click", function () { close(); });
    M.$$("[data-close]", dlg).forEach(function (b) { b.addEventListener("click", function () { close(); }); });

    // Glisser vers le bas : depuis la poignée, l'en-tête, ou le contenu quand il est déjà en haut.
    function down(e) {
      if (desktop.matches || e.button > 0) return;
      var fromBody = body.contains(e.target);
      if (fromBody && (body.scrollTop > 0 || e.target.closest("input, select, textarea, button, .days, label"))) return;
      stop(); measure();
      drag = { y0: e.clientY, p0: pos, t: e.timeStamp, y: e.clientY, v: 0, fromBody: fromBody, live: !fromBody, id: e.pointerId };
    }
    function move(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = e.clientY - drag.y0;
      if (!drag.live) { if (d > 8) { drag.live = true; drag.y0 = e.clientY; d = 0; panel.setPointerCapture(e.pointerId); } else return; }
      var dt = Math.max(1, e.timeStamp - drag.t);
      drag.v = 0.8 * ((e.clientY - drag.y) / dt) + 0.2 * drag.v; drag.t = e.timeStamp; drag.y = e.clientY;
      var next = drag.p0 + d;
      set(next < 0 ? -M.rubber(-next, 120) : next);
      e.preventDefault();
    }
    function up(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var live = drag.live, v = drag.v; drag = null;
      if (!live) return;
      if (pos > size * 0.32 || v > 0.55) close(v);
      else { stop(); stop = M.spring(pos, 0, v, set, null, 380); }
    }
    panel.addEventListener("pointerdown", down);
    panel.addEventListener("pointermove", move, { passive: false });
    panel.addEventListener("pointerup", up);
    panel.addEventListener("pointercancel", up);
    return { open: open, close: close };
  };

  // ---------- chiffres qui roulent ----------
  M.odo = function (el, value) {
    var str = M.fmt(value);
    if (el.dataset.v === str) return;
    var first = !el.dataset.v;
    el.dataset.v = str;
    el.setAttribute("aria-label", str);
    var cols = M.$$(".odo__d, .odo__sep", el);
    if (first || cols.length !== str.length) {
      el.innerHTML = str.split("").map(function (c) {
        return /\d/.test(c) ? '<span class="odo__d" aria-hidden="true"><span>' + "0123456789".split("").map(function (n) { return "<i>" + n + "</i>"; }).join("") + "</span></span>" : '<span class="odo__sep" aria-hidden="true">' + c + "</span>";
      }).join("");
      cols = M.$$(".odo__d, .odo__sep", el);
      if (!first) el.offsetWidth;
    }
    str.split("").forEach(function (c, i) {
      if (/\d/.test(c)) cols[i].firstChild.style.transform = "translateY(calc(" + (-Number(c)) + " * var(--h)))";
    });
  };

  // ---------- rails : défilement à la souris avec inertie, flèches, barre de progression ----------
  M.rail = function (rail, prev, next) {
    function page(d) { rail.scrollBy({ left: d * rail.clientWidth * 0.9, behavior: reduce.matches ? "auto" : "smooth" }); }
    function state() {
      var max = rail.scrollWidth - rail.clientWidth;
      if (prev) prev.disabled = rail.scrollLeft < 4;
      if (next) next.disabled = rail.scrollLeft > max - 4;
      var bar = rail.parentNode.querySelector(".rail-bar i");
      if (bar && !CSS.supports("animation-timeline: scroll()")) bar.style.setProperty("--p", 0.2 + 0.8 * (max ? rail.scrollLeft / max : 1));
    }
    prev && prev.addEventListener("click", function () { page(-1); });
    next && next.addEventListener("click", function () { page(1); });
    rail.addEventListener("scroll", state, { passive: true });
    state();
    // Souris : on attrape, on lance ; le doigt garde le défilement natif.
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
    function end() {
      if (!d) return;
      var moved = d.moved, v = d.v; d = null;
      if (!moved) return;
      var target = rail.scrollLeft + v * -220;
      rail.classList.remove("is-dragging");
      rail.scrollTo({ left: target, behavior: reduce.matches ? "auto" : "smooth" });
      // Un glisser ne doit pas ouvrir la carte sous le curseur
      rail.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); }, { capture: true, once: true });
    }
    rail.addEventListener("pointerup", end);
    rail.addEventListener("pointercancel", end);
  };

  // ---------- segment à pouce glissant ----------
  M.seg = function (seg, onChange) {
    var thumb = document.createElement("span");
    thumb.className = "seg__thumb"; seg.prepend(thumb);
    var btns = M.$$("button", seg);
    function place(b, instant) {
      if (instant) thumb.style.transition = "none";
      thumb.style.width = b.offsetWidth + "px";
      thumb.style.transform = "translateX(" + b.offsetLeft + "px)";
      if (instant) { thumb.offsetWidth; thumb.style.transition = ""; }
    }
    function select(b, silent) {
      btns.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      place(b);
      if (!silent) onChange && onChange(b.value, b);
    }
    btns.forEach(function (b) { b.addEventListener("click", function () { select(b); }); });
    var on = btns.filter(function (b) { return b.getAttribute("aria-pressed") === "true"; })[0] || btns[0];
    requestAnimationFrame(function () { place(on, true); });
    addEventListener("resize", function () { place(M.$('[aria-pressed="true"]', seg) || btns[0], true); });
    if (document.fonts) document.fonts.ready.then(function () { place(M.$('[aria-pressed="true"]', seg) || btns[0], true); });
    return { select: function (v, silent) { var b = btns.filter(function (x) { return x.value === v; })[0]; if (b) select(b, silent); } };
  };

  // ---------- dates à l'heure de Koh Lanta ----------
  M.today = function () {
    var p = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    return p;
  };
  M.addDays = function (iso, n) { var d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  M.dateLabel = function (iso, long) {
    var d = new Date(iso + "T00:00:00Z");
    return d.toLocaleDateString("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short", year: long ? "numeric" : undefined });
  };

  // ---------- message WhatsApp : même format que src/js/booking.js (réf., demande, date, invités, prix vu) ----------
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }
  function listJoin(a) { return a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]; }
  M.guests = function (adults, ages) {
    var parts = [];
    if (adults > 0) parts.push(plural(adults, "adult", "adults"));
    var lab = function (a) { return Number(a) === 0 ? "under 1" : String(a); };
    if (ages.length === 1) parts.push("1 child (age " + lab(ages[0]) + ")");
    else if (ages.length > 1) parts.push(ages.length + " children (ages " + listJoin(ages.map(lab)) + ")");
    return parts.join(", ");
  };
  M.ref = function (prefix, iso, adults, kids) {
    if (!prefix || !iso) return "";
    var d = iso.split("-");
    return prefix + "-" + d[2] + d[1] + "-" + adults + "A" + (kids ? kids + "C" : "");
  };
  M.message = function (p, opt, st) {
    var lines = [];
    var ref = M.ref(p.refPrefix, st.date, st.adults, st.ages.length);
    if (ref) lines.push("Ref: " + ref);
    lines.push("Booking request: " + p.name + (opt ? " – " + opt.label + (st.kradan ? ", with Koh Kradan" : "") : ""));
    if (st.date) lines.push("Date: " + M.dateLabel(st.date, true));
    lines.push("Guests: " + M.guests(st.adults, st.ages));
    if (st.pickup) lines.push("Pickup: " + st.pickup);
    if (st.name) lines.push("Name: " + st.name);
    if (opt && opt.prices.length) lines.push("Price on website: " + opt.prices.filter(function (r) { return !r.supplement; }).map(function (r) { return r.label + ": " + (r.amount === 0 ? "free" : r.amount != null ? M.thb(r.amount) : r.text); }).join(" / "));
    lines.push("Page: https://secrettravelandtour.com/tours/" + p.slug + "/");
    return lines;
  };

  // Estimation du prix à partir des lignes de prix de l'option, rien d'autre.
  // Renvoie les lignes du calcul et, si un cas n'est pas couvert par les données, ce qui manque.
  M.estimate = function (opt, adults, ages, extras) {
    if (!opt || opt.priceOnRequest || !opt.prices.length) return null;
    var rows = opt.prices, lines = [], missing = [], total = 0;
    var tiers = rows.filter(function (r) { return r.group; });
    if (tiers.length) {
      // Bateau privé : un prix par bateau selon la taille du groupe, puis un supplément par personne.
      var n = adults + ages.length;
      var tier = tiers.filter(function (r) { return n >= r.group.min && n <= r.group.max; })[0];
      var top = tiers[tiers.length - 1];
      var extra = rows.filter(function (r) { return r.supplement && /extra person/i.test(r.label); })[0];
      if (tier) { total += tier.amount; lines.push([tier.label, M.thb(tier.amount)]); }
      else if (n > top.group.max && extra) {
        total += top.amount + (n - top.group.max) * extra.amount;
        lines.push([top.label, M.thb(top.amount)]);
        lines.push([(n - top.group.max) + " × " + extra.label.toLowerCase(), M.thb((n - top.group.max) * extra.amount)]);
      }
      (extras || []).forEach(function (lbl) {
        var r = rows.filter(function (x) { return x.label === lbl; })[0];
        if (r) { total += r.amount; lines.push([r.label, M.thb(r.amount)]); }
      });
      if (ages.length) missing.push("les enfants comptent-ils dans la taille du groupe du bateau privé ?");
      return { total: total, lines: lines, missing: missing, per: "per boat" };
    }
    var adult = rows.filter(function (r) { return /^adult/i.test(r.label) || /^per person/i.test(r.label); })[0];
    if (adult && adults) { total += adults * adult.amount; lines.push([adults + " × " + adult.label.toLowerCase(), M.thb(adults * adult.amount)]); }
    var byRow = {};
    ages.forEach(function (age) {
      var r = rows.filter(function (x) { return x.ages && age >= (x.ages.min || 0) && age <= x.ages.max; })[0];
      if (!r) { missing.push("prix d'un enfant de " + age + " ans pour « " + opt.label + " »"); return; }
      byRow[r.label] = byRow[r.label] || { r: r, n: 0 }; byRow[r.label].n++;
    });
    Object.keys(byRow).forEach(function (k) {
      var x = byRow[k]; total += x.n * x.r.amount;
      lines.push([x.n + " × " + x.r.label.toLowerCase(), x.r.amount ? M.thb(x.n * x.r.amount) : "free"]);
    });
    return { total: total, lines: lines, missing: missing };
  };
  // Frais de parc en espèces, comme parkCash() de src/js/booking.js : adultes et enfants au tarif des données.
  M.parkCash = function (opt, adults, kids) {
    if (!opt) return null;
    var a = opt.fees.filter(function (f) { return f.label === "National park fee, adult"; })[0];
    var c = opt.fees.filter(function (f) { return f.label === "National park fee, child"; })[0];
    if (!a) return null;
    var total = adults * a.amount + (c ? kids * c.amount : 0);
    var text = adults + " × " + a.amount + (kids && c ? " + " + kids + " × " + c.amount : "");
    return { total: total, text: text + " = " + M.thb(total) };
  };

  // ---------- visionneuse : glisser pour changer, pincer ou double-toucher pour zoomer, tirer vers le bas pour fermer ----------
  M.lightbox = function (ids, thumbs) {
    var dlg = document.createElement("dialog");
    dlg.className = "lb"; dlg.setAttribute("aria-label", "Photos");
    dlg.innerHTML = '<div class="lb__bg"></div><div class="lb__track">' + ids.map(function (id) {
      var p = S.photos[id];
      return '<div class="lb__slide"><img src="' + p.src + '" alt="' + M.esc(p.alt) + '" width="' + p.w + '" height="' + p.h + '" draggable="false"></div>';
    }).join("") + '</div><div class="lb__bar"><span class="lb__count" aria-live="polite"></span><button class="x" type="button" data-close aria-label="Close the photos">' + M.icon.close + "</button></div>" +
      '<button class="lb__nav lb__nav--p" type="button" aria-label="Previous photo">' + M.icon.left + '</button><button class="lb__nav lb__nav--n" type="button" aria-label="Next photo">' + M.icon.right + "</button>" +
      '<p class="lb__cap"></p>';
    document.body.appendChild(dlg);
    var track = M.$(".lb__track", dlg), bg = M.$(".lb__bg", dlg), imgs = M.$$("img", dlg), n = ids.length;
    var i = 0, z = { s: 1, x: 0, y: 0 }, pts = new Map(), g = null, lastTap = 0;
    var W = function () { return dlg.clientWidth; };
    var EASE = "cubic-bezier(.22,1,.36,1)";
    function place(dx, animate) {
      track.style.transition = animate && !reduce.matches ? "transform 380ms " + EASE : "none";
      track.style.transform = "translate3d(" + (-i * W() + (dx || 0)) + "px,0,0)";
    }
    function zoomTo(s, x, y, animate) {
      z = { s: s, x: x, y: y };
      var im = imgs[i];
      im.style.transition = animate && !reduce.matches ? "transform 300ms " + EASE : "none";
      im.style.transform = "translate(" + x + "px," + y + "px) scale(" + s + ")";
    }
    function resetZoom(animate) { if (z.s !== 1 || z.x || z.y) zoomTo(1, 0, 0, animate); }
    function go(k) {
      resetZoom(false);
      i = M.clamp(k, 0, n - 1);
      place(0, true);
      M.$(".lb__count", dlg).textContent = (i + 1) + " of " + n;
      M.$(".lb__cap", dlg).textContent = S.photos[ids[i]].alt;
      M.$(".lb__nav--p", dlg).disabled = i === 0; M.$(".lb__nav--n", dlg).disabled = i === n - 1;
    }
    function setDrop(dy) {
      var k = Math.max(0, dy);
      track.style.transition = "none";
      track.style.transform = "translate3d(" + (-i * W()) + "px," + dy + "px,0) scale(" + (1 - Math.min(k, 400) / 2000) + ")";
      bg.style.setProperty("--bg", 1 - Math.min(k, 400) / 500);
    }
    function withName(el, fn) {
      if (!document.startViewTransition || reduce.matches || !el) { fn(); return; }
      el.style.viewTransitionName = "lb-photo";
      var t = document.startViewTransition(function () { el.style.viewTransitionName = ""; fn(); });
      t.finished.finally(function () { M.$$("[style*='lb-photo']").forEach(function (x) { x.style.viewTransitionName = ""; }); });
    }
    function open(k) {
      var th = thumbs && thumbs[k];
      withName(th && th.querySelector("img"), function () {
        dlg.showModal(); bg.style.setProperty("--bg", 1); go(k); place(0, false);
        if (th) imgs[k].style.viewTransitionName = "lb-photo";
      });
    }
    function close() {
      var th = thumbs && thumbs[i] && thumbs[i].querySelector("img");
      resetZoom(false);
      if (th && document.startViewTransition && !reduce.matches) {
        imgs[i].style.viewTransitionName = "lb-photo";
        var t = document.startViewTransition(function () { imgs[i].style.viewTransitionName = ""; dlg.close(); th.style.viewTransitionName = "lb-photo"; });
        t.finished.finally(function () { th.style.viewTransitionName = ""; });
      } else dlg.close();
      if (thumbs && thumbs[i]) thumbs[i].focus({ preventScroll: true });
    }
    dlg.addEventListener("cancel", function (e) { e.preventDefault(); close(); });
    M.$("[data-close]", dlg).addEventListener("click", close);
    M.$(".lb__nav--p", dlg).addEventListener("click", function () { go(i - 1); });
    M.$(".lb__nav--n", dlg).addEventListener("click", function () { go(i + 1); });
    dlg.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") go(i + 1); if (e.key === "ArrowLeft") go(i - 1); });
    addEventListener("resize", function () { if (dlg.open) place(0, false); });

    function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
    track.addEventListener("pointerdown", function (e) {
      if (e.target.closest("button")) return;
      track.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      var arr = Array.from(pts.values());
      if (arr.length === 2) {
        var r = imgs[i].getBoundingClientRect();
        g = { mode: "pinch", d0: dist(arr[0], arr[1]), s0: z.s, x0: z.x, y0: z.y, ox: r.left - z.x, oy: r.top - z.y, mx: (arr[0].x + arr[1].x) / 2, my: (arr[0].y + arr[1].y) / 2 };
        return;
      }
      g = { mode: null, x0: e.clientX, y0: e.clientY, t: e.timeStamp, lx: e.clientX, ly: e.clientY, vx: 0, vy: 0, zx: z.x, zy: z.y };
    });
    track.addEventListener("pointermove", function (e) {
      if (!pts.has(e.pointerId) || !g) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (g.mode === "pinch") {
        var arr = Array.from(pts.values()); if (arr.length < 2) return;
        var s = M.clamp(g.s0 * dist(arr[0], arr[1]) / g.d0, 1, 4);
        var px = g.mx - g.ox, py = g.my - g.oy;
        zoomTo(s, px - (px - g.x0) * (s / g.s0), py - (py - g.y0) * (s / g.s0));
        return;
      }
      var dx = e.clientX - g.x0, dy = e.clientY - g.y0, dt = Math.max(1, e.timeStamp - g.t);
      g.vx = 0.8 * (e.clientX - g.lx) / dt + 0.2 * g.vx; g.vy = 0.8 * (e.clientY - g.ly) / dt + 0.2 * g.vy;
      g.lx = e.clientX; g.ly = e.clientY; g.t = e.timeStamp;
      if (z.s > 1) { zoomTo(z.s, g.zx + dx, g.zy + dy); return; }
      if (!g.mode && Math.hypot(dx, dy) > 8) g.mode = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (g.mode === "x") {
        var edge = (i === 0 && dx > 0) || (i === n - 1 && dx < 0);
        place(edge ? Math.sign(dx) * M.rubber(Math.abs(dx), W() / 3) : dx, false);
      } else if (g.mode === "y") setDrop(dy > 0 ? dy : -M.rubber(-dy, 80));
    });
    function up(e) {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId);
      if (!g) return;
      if (g.mode === "pinch") { if (pts.size === 0) { if (z.s < 1.05) resetZoom(true); g = null; } return; }
      var dx = e.clientX - g.x0, dy = e.clientY - g.y0, mode = g.mode, vx = g.vx, vy = g.vy;
      g = null;
      if (mode === "x") {
        var k = i;
        if (dx < -W() * 0.2 || vx < -0.4) k = i + 1; else if (dx > W() * 0.2 || vx > 0.4) k = i - 1;
        go(k);
      } else if (mode === "y") {
        if (dy > 110 || vy > 0.5) { track.style.transform = ""; bg.style.setProperty("--bg", 1); close(); }
        else { track.style.transition = "transform 320ms " + EASE; track.style.transform = "translate3d(" + (-i * W()) + "px,0,0)"; bg.style.setProperty("--bg", 1); }
      } else if (!mode && e.pointerType !== "mouse") {
        tap(e);
      }
    }
    // Double toucher (ou double clic) : zoom ×2,4 à l'endroit touché, puis retour
    function tap(e) {
      var now = e.timeStamp;
      if (now - lastTap < 300) { toggleZoom(e.clientX, e.clientY); lastTap = 0; } else lastTap = now;
    }
    function toggleZoom(cx, cy) {
      if (z.s > 1) { resetZoom(true); return; }
      var r = imgs[i].getBoundingClientRect(), s = 2.4, px = cx - r.left, py = cy - r.top;
      zoomTo(s, px - px * s, py - py * s, true);
    }
    track.addEventListener("pointerup", up);
    track.addEventListener("pointercancel", up);
    var lastType = "mouse";
    track.addEventListener("pointerdown", function (e) { lastType = e.pointerType; }, true);
    track.addEventListener("dblclick", function (e) { if (lastType === "mouse") toggleZoom(e.clientX, e.clientY); });
    track.addEventListener("wheel", function (e) {
      if (!e.ctrlKey) return;
      e.preventDefault();
      var r = imgs[i].getBoundingClientRect(), s = M.clamp(z.s * (1 - e.deltaY / 200), 1, 4), px = e.clientX - (r.left - z.x), py = e.clientY - (r.top - z.y);
      zoomTo(s, px - (px - z.x) * (s / z.s), py - (py - z.y) * (s / z.s));
    }, { passive: false });
    return { open: open };
  };

  // ---------- démarrage ----------
  M.boot = function (current) {
    var top = document.getElementById("top");
    if (top) top.innerHTML = M.header(current);
    var foot = document.getElementById("foot");
    if (foot) foot.innerHTML = M.footer();
    bindHeader(); bindPrefetch(); bindPageTransitions(); bindPalette();
    M.bindImgs(document);
  };
})();
