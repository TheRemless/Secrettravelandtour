/* Design v4 : comportements communs (en-tête, transitions entre pages, préchargement, photos, chiffres qui roulent,
   segments, feuilles au doigt, liste de sorties). Le contenu est déjà dans le HTML ; ce fichier n'ajoute que le geste.
   Les parties lourdes (liste de sorties, visionneuse) se chargent au premier usage. */
(function () {
  "use strict";
  var doc = document;
  var root = doc.documentElement;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)");
  var V = (window.V4 = {});
  V.reduce = reduce;
  V.$ = function (s, el) { return (el || doc).querySelector(s); };
  V.$$ = function (s, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(s)); };
  V.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  V.fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); };
  V.thb = function (n) { return V.fmt(n) + " THB"; };
  V.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  V.wa = function (text) { return "https://wa.me/66958683846" + (text ? "?text=" + encodeURIComponent(text) : ""); };

  // Transition de vue dans la page ; sans elle (Safari, Firefox) ou en mouvement réduit, le changement est immédiat.
  V.vt = function (update) {
    if (!doc.startViewTransition || reduce.matches) { update(); return Promise.resolve(); }
    var t = doc.startViewTransition(update);
    // Une transition interrompue par la suivante n'est pas une erreur : la page est déjà à jour.
    t.ready.catch(function () {});
    return t.finished.catch(function () {});
  };

  // Script chargé une seule fois, au premier usage.
  // Même version que v4.js (?v= du build) : /js/* est en cache d'un an, un script chargé ici doit changer d'adresse
  // à chaque déploiement, sinon un visiteur qui revient garde l'ancien.
  var main = doc.querySelector('script[src*="/js/v4.js?v="]');
  var ver = main ? (main.getAttribute("src").split("?v=")[1] || "") : "";
  var loading = {};
  V.load = function (src) {
    if (!loading[src]) loading[src] = new Promise(function (ok, ko) {
      var s = doc.createElement("script");
      s.src = ver && src.indexOf("?") < 0 ? src + "?v=" + ver : src; s.onload = ok; s.onerror = ko;
      doc.head.appendChild(s);
    });
    return loading[src];
  };
  var cat = null;
  V.catalog = function () {
    // Un échec (réseau coupé) n'est pas gardé : le prochain clic réessaie.
    if (!cat) cat = fetch("/data/catalog.json").then(function (r) { if (!r.ok) throw new Error("catalog " + r.status); return r.json(); })
      .catch(function (e) { cat = null; throw e; });
    return cat;
  };

  // ---------- Dates à l'heure de Koh Lanta ----------
  V.today = function () {
    var p = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    var g = function (t) { return p.filter(function (x) { return x.type === t; })[0].value; };
    return g("year") + "-" + g("month") + "-" + g("day");
  };
  V.date = function (iso, o) { return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", Object.assign({ timeZone: "UTC" }, o)); };

  // ---------- Chiffres qui roulent : chaque chiffre est une colonne 0-9 déplacée en transform ----------
  V.odo = function (el, value) {
    var str = V.fmt(value);
    if (el.getAttribute("data-v") === str) return;
    var first = !el.hasAttribute("data-v");
    el.setAttribute("data-v", str);
    var cols = V.$$(".odo__d, .odo__s", el);
    if (first || cols.length !== str.length) {
      var old = first ? el.textContent.trim() : "";
      // Le nombre reste lisible par les lecteurs d'écran ; les colonnes de chiffres ne sont que l'image du mouvement.
      el.innerHTML = '<span class="sr" data-odo-t></span>' + str.split("").map(function (c, i) {
        if (!/\d/.test(c)) return '<span class="odo__s" aria-hidden="true">' + c + "</span>";
        return '<span class="odo__d" aria-hidden="true"><span>' + "0123456789".split("").map(function (n) { return "<i>" + n + "</i>"; }).join("") + "</span></span>";
      }).join("");
      cols = V.$$(".odo__d, .odo__s", el);
      // Première pose : on part des chiffres déjà affichés (rendus au build), pas de zéro.
      str.split("").forEach(function (c, i) { if (/\d/.test(c)) cols[i].firstChild.style.transform = "translateY(calc(" + -(old.charAt(i) && /\d/.test(old.charAt(i)) && old.length === str.length ? Number(old.charAt(i)) : Number(c)) + " * var(--h)))"; });
      el.offsetWidth;
    }
    str.split("").forEach(function (c, i) {
      if (/\d/.test(c)) cols[i].firstChild.style.transform = "translateY(calc(" + -Number(c) + " * var(--h)))";
    });
    V.$("[data-odo-t]", el).textContent = str;
  };

  // ---------- Segment à pouce glissant (boutons aria-pressed) ----------
  V.seg = function (seg, onChange) {
    var thumb = doc.createElement("span");
    thumb.className = "seg__thumb";
    seg.prepend(thumb);
    seg.classList.add("has-thumb");
    var btns = V.$$("button", seg);
    function place(b, instant) {
      if (!b) return;
      if (instant) thumb.style.transition = "none";
      thumb.style.width = b.offsetWidth + "px";
      thumb.style.transform = "translateX(" + b.offsetLeft + "px)";
      if (instant) { thumb.offsetWidth; thumb.style.transition = ""; }
    }
    function current() { return btns.filter(function (b) { return b.getAttribute("aria-pressed") === "true"; })[0] || btns[0]; }
    function select(b, silent) {
      btns.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      place(b);
      if (!silent && onChange) onChange(b.value, b);
    }
    btns.forEach(function (b) { b.addEventListener("click", function () { if (b.getAttribute("aria-pressed") !== "true") select(b); }); });
    place(current(), true);
    addEventListener("resize", function () { place(current(), true); });
    if (doc.fonts) doc.fonts.ready.then(function () { place(current(), true); });
    return { select: function (v, silent) { var b = btns.filter(function (x) { return x.value === v; })[0]; if (b) select(b, silent); } };
  };

  // ---------- Photos insérées après coup (gabarits) : même fondu ----------
  V.bindImgs = function (scope) {
    V.$$("img.fade:not(.is-in)", scope).forEach(function (img) {
      if (img.complete && img.naturalWidth) img.classList.add("is-in");
      else img.addEventListener("load", function () { img.classList.add("is-in"); }, { once: true });
    });
  };
  V.bindImgs(doc);

  // ---------- Toast ----------
  var tTimer;
  V.toast = function (text, label, action) {
    var t = V.$("#toast");
    if (!t) return;
    // Une feuille ouverte rend le reste de la page inerte : le toast la rejoint pour rester cliquable.
    var host = V.$("dialog[open]") || document.body;
    if (t.parentNode !== host) host.appendChild(t);
    t.innerHTML = "<span>" + V.esc(text) + "</span>" + (label ? '<button type="button">' + V.esc(label) + "</button>" : "");
    if (label) V.$("button", t).onclick = function () { t.hidden = true; action(); };
    t.hidden = false;
    clearTimeout(tTimer);
    tTimer = setTimeout(function () { t.hidden = true; }, 5000);
  };

  // ---------- En-tête : caché en descendant, de retour au moindre retour vers le haut ----------
  var hd = V.$("#hd");
  if (hd) {
    var lastY = scrollY, acc = 0, ticking = false;
    var show = function (on) {
      if (hd.classList.contains("is-hidden") === !on) return;
      hd.classList.toggle("is-hidden", !on);
      root.classList.toggle("hd-off", !on);
    };
    var update = function () {
      ticking = false;
      var y = scrollY, dy = y - lastY;
      lastY = y;
      hd.classList.toggle("is-scrolled", y > 0);
      if (y < 120 || hd.contains(doc.activeElement) || V.$("dialog[open]")) { show(true); acc = 0; return; }
      if ((dy > 0) !== (acc > 0)) acc = 0;
      acc += dy;
      if (acc > 24) show(false);
      else if (acc < -8) show(true);
    };
    addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    hd.addEventListener("focusin", function () { show(true); });
    V.hdSync = function () { lastY = scrollY; acc = 0; show(true); };
  }
  // Pied de page : sur téléphone, les deux listes de sorties se replient (ouvertes sans JS et sur bureau).
  if (matchMedia("(max-width: 699px)").matches) V.$$("[data-ft-fold]").forEach(function (d) { d.open = false; });
  var menu = V.$("#menu");
  if (menu && menu.showModal) {
    doc.addEventListener("click", function (e) {
      if (e.target.closest("[data-menu-open]")) menu.showModal();
      else if (e.target.closest("[data-menu-close]") || e.target === menu || (menu.open && e.target.closest("#menu a"))) menu.close();
    });
  }

  // ---------- Préchargement : survol de 80 ms ou premier contact du doigt (en plus des Speculation Rules) ----------
  var fetched = {};
  V.prefetch = function (url) {
    if (!url || fetched[url] || url.charAt(0) !== "/" || (navigator.connection && navigator.connection.saveData)) return;
    fetched[url] = 1;
    var l = doc.createElement("link");
    l.rel = "prefetch"; l.href = url;
    doc.head.appendChild(l);
  };
  var pTimer;
  var target = function (e) { var a = e.target.closest && e.target.closest("a[href^='/tours/'], a[href^='/taxi/']"); return a && a.getAttribute("href").split("#")[0]; };
  doc.addEventListener("pointerover", function (e) { var u = target(e); if (!u) return; clearTimeout(pTimer); pTimer = setTimeout(function () { V.prefetch(u); }, 80); }, { passive: true });
  doc.addEventListener("pointerout", function () { clearTimeout(pTimer); }, { passive: true });
  doc.addEventListener("touchstart", function (e) { V.prefetch(target(e)); }, { passive: true });

  // ---------- Transition entre pages : la photo de la carte cliquée devient le hero de la page produit ----------
  var lastLink = null;
  doc.addEventListener("click", function (e) { var a = e.target.closest && e.target.closest("a[href]"); if (a) lastLink = a; }, true);
  addEventListener("pageswap", function (e) {
    if (!e.viewTransition || !lastLink) return;
    var to = (e.activation && e.activation.entry && e.activation.entry.url) || "";
    var ph = lastLink.querySelector(".ph") || (lastLink.getAttribute("aria-current") === "true" && lastLink.hasAttribute("data-hero-i") && V.$("[data-hero-stack] .ph.is-on"));
    V.$$("[data-vt]").forEach(function (x) { x.style.viewTransitionName = "none"; });
    if (ph && /\/tours\/[^/]+\/$/.test(new URL(to, location.href).pathname)) ph.style.viewTransitionName = "trip-photo";
  });
  addEventListener("pagereveal", function (e) {
    if (!e.viewTransition || !window.navigation || !navigation.activation || !navigation.activation.from) return;
    var from = new URL(navigation.activation.from.url || "/", location.href).pathname;
    var m = from.match(/^\/tours\/([^/]+)\/$/);
    if (!m) return;
    var card = V.$('.card[data-slug="' + m[1] + '"] .ph');
    if (!card) return;
    V.$$("[data-vt]").forEach(function (x) { x.style.viewTransitionName = "none"; });
    card.style.viewTransitionName = "trip-photo";
    e.viewTransition.finished.then(function () { card.style.viewTransitionName = ""; });
  });

  // ---------- Feuilles au doigt (réservation, liste de sorties) : tirer vers le bas pour fermer ----------
  var mobile = matchMedia("(max-width: 63.99rem)");
  V.dragSheet = function (dlg, close) {
    var drag = null;
    function down(e) {
      if (!mobile.matches || e.button > 0 || !dlg.open) return;
      var onGrab = e.target.closest(".sheet-grab, .sheet-head");
      if (!onGrab || e.target.closest("button, a, input, select")) return;
      drag = { y0: e.clientY, t: e.timeStamp, y: e.clientY, v: 0, id: e.pointerId, h: dlg.offsetHeight, live: false };
    }
    function move(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = e.clientY - drag.y0;
      if (!drag.live) { if (Math.abs(d) < 6) return; drag.live = true; dlg.classList.add("is-dragging"); try { dlg.setPointerCapture(e.pointerId); } catch (x) { /* déjà relâché */ } }
      var dt = Math.max(1, e.timeStamp - drag.t);
      drag.v = 0.8 * ((e.clientY - drag.y) / dt) + 0.2 * drag.v; drag.t = e.timeStamp; drag.y = e.clientY;
      // Élastique vers le haut, libre vers le bas
      var y = d < 0 ? -(1 - 1 / (-d * 0.55 / 120 + 1)) * 120 : d;
      dlg.style.transform = "translateY(" + y + "px)";
      e.preventDefault();
    }
    function up(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = e.clientY - drag.y0, v = drag.v, live = drag.live, h = drag.h;
      drag = null;
      dlg.classList.remove("is-dragging");
      if (!live) return;
      dlg.classList.add("is-settling");
      if (d > h * 0.3 || v > 0.55) {
        dlg.style.transform = "translateY(100%)";
        setTimeout(function () { dlg.classList.remove("is-settling"); dlg.style.transform = ""; close(); }, reduce.matches ? 0 : 300);
      } else {
        // À la souris, le clic qui suit le geste tombe sur le <dialog> : il ne doit pas fermer la feuille comme un clic sur le voile.
        if (e.pointerType === "mouse") dlg.setAttribute("data-dragged", "");
        dlg.style.transform = "";
        setTimeout(function () { dlg.classList.remove("is-settling"); }, 330);
      }
    }
    dlg.addEventListener("pointerdown", down);
    dlg.addEventListener("pointermove", move, { passive: false });
    dlg.addEventListener("pointerup", up);
    dlg.addEventListener("pointercancel", up);
  };
  var book = V.$("#book");
  if (book) V.dragSheet(book, function () { book.close(); });

  // ---------- Liste de sorties : stockage, compteur, boutons des cartes ----------
  var KEY = "stt-trips";
  V.trips = {
    get: function () {
      var l = null;
      try { l = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { l = null; }
      if (!l || l.v !== 1 || !Array.isArray(l.items)) l = { v: 1, items: [], adults: 2, childAges: [], pickup: "", name: "" };
      return l;
    },
    set: function (l) {
      try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) { /* stockage indisponible : la liste vit le temps de la page */ }
      V.trips.cache = l;
      doc.dispatchEvent(new CustomEvent("trips-change"));
    },
    has: function (slug) { return V.trips.get().items.some(function (i) { return i.slug === slug; }); },
    add: function (item, group) {
      var l = V.trips.get();
      var same = l.items.filter(function (i) { return i.slug === item.slug && (i.date || "") === (item.date || "") && (i.option || "") === (item.option || ""); })[0];
      if (same) return false;
      // Une sortie ajoutée sans date depuis une carte, puis précisée depuis sa page : on complète la même ligne.
      var blank = l.items.filter(function (i) { return i.slug === item.slug && !i.date; })[0];
      if (blank && item.date) Object.assign(blank, item);
      else l.items.push(Object.assign({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) }, item));
      if (group) { l.adults = group.adults; l.childAges = group.childAges; }
      V.trips.set(l);
      return true;
    }
  };
  var mem = null;
  try { localStorage.setItem("stt-t", "1"); localStorage.removeItem("stt-t"); } catch (e) {
    // Navigation privée sans stockage : la liste vit en mémoire le temps de la page.
    V.trips.get = function () { return mem || (mem = { v: 1, items: [], adults: 2, childAges: [], pickup: "", name: "" }); };
    V.trips.set = function (l) { mem = l; doc.dispatchEvent(new CustomEvent("trips-change")); };
  }
  function nameOf(slug) {
    var c = V.$('.card[data-slug="' + slug + '"] .card__title');
    return c ? c.textContent : "This trip";
  }
  function paint(bump) {
    var l = V.trips.get();
    var n = l.items.length;
    // Liste non vide : on retire en silence les sorties qui n'existent plus (fiche fondue ou découpée).
    if (n > 0 && !paint.pruned) {
      paint.pruned = true;
      V.catalog().then(function (c) {
        var keep = l.items.filter(function (i) { return c[i.slug]; });
        if (keep.length !== l.items.length) { l.items = keep; V.trips.set(l); }
      }).catch(function () { paint.pruned = false; });
    }
    V.$$("[data-trips-count]").forEach(function (el) { el.textContent = n; });
    root.classList.toggle("has-trips", n > 0);
    // Une liste non vide sera ouverte : ses scripts se chargent au calme pour que la feuille s'ouvre sans attendre.
    if (n > 0) (window.requestIdleCallback || setTimeout)(function () { tripsScripts().catch(function () {}); });
    V.$$("[data-trips-open]").forEach(function (b) {
      b.hidden = n === 0 && !b.hasAttribute("data-always");
      if (bump && !reduce.matches) { b.classList.remove("is-bump"); b.offsetWidth; b.classList.add("is-bump"); }
    });
    V.$$("[data-trip-add]").forEach(function (b) {
      b.hidden = false;
      b.setAttribute("aria-pressed", l.items.some(function (i) { return i.slug === b.getAttribute("data-trip-add"); }) ? "true" : "false");
    });
  }
  // booking.js est déjà là sur les pages produit (balise avec ?v=) : le recharger brancherait deux fois la feuille.
  function tripsScripts() {
    // v4-price.js avant booking.js : la liste calcule le total estimé de chaque sortie, comme la feuille.
    var b = window.STT_BOOKING ? Promise.resolve() : (window.STT_PRICE ? Promise.resolve() : V.load("/js/v4-price.js")).then(function () { return V.load("/js/booking.js"); });
    return b.then(function () { return V.load("/js/v4-trips.js"); });
  }
  V.openTrips = function (trigger) {
    // Une sortie retirée du site (fiche fondue dans une autre) quitte la liste et le compteur.
    V.catalog().then(function (c) {
      var l = V.trips.get(), keep = l.items.filter(function (i) { return c[i.slug]; });
      if (keep.length !== l.items.length) { l.items = keep; V.trips.set(l); }
    }).catch(function () {});
    return tripsScripts().then(function () { window.V4_TRIPS.open(trigger); });
  };
  doc.addEventListener("trips-change", function () { paint(true); });
  doc.addEventListener("click", function (e) {
    var add = e.target.closest("[data-trip-add]");
    if (add) {
      var slug = add.getAttribute("data-trip-add");
      if (add.getAttribute("aria-pressed") === "true") {
        var l = V.trips.get(), kept = l.items.filter(function (i) { return i.slug !== slug; }), gone = l.items.filter(function (i) { return i.slug === slug; });
        l.items = kept; V.trips.set(l);
        V.toast(nameOf(slug) + " removed.", "Undo", function () { var l2 = V.trips.get(); l2.items = l2.items.concat(gone); V.trips.set(l2); });
      } else {
        V.trips.add({ slug: slug, option: "", date: "", addons: [] });
        if (!reduce.matches) { add.classList.remove("is-pop"); add.offsetWidth; add.classList.add("is-pop"); }
        V.toast(nameOf(slug) + " added.", "Open the list", function () { V.openTrips(add); });
      }
      return;
    }
    var open = e.target.closest("[data-trips-open]");
    if (open) V.openTrips(open);
  });
  // Depuis la feuille de réservation d'une page produit (booking.js) : option, date et groupe déjà choisis.
  doc.addEventListener("stt-trip-add", function (e) {
    var d = e.detail;
    var added = V.trips.add({ slug: d.slug, option: d.option, date: d.date, addons: d.addons || [], choices: d.choices || {}, counts: d.counts || {} }, d.counted ? null : { adults: d.adults, childAges: d.childAges });
    var name = (V.$("#book-title") || {}).textContent || "This trip";
    var show = function () { V.toast(added ? name + " is in your trip list, on " + V.date(d.date, { weekday: "short", day: "numeric", month: "short" }) + "." : name + " is already in your trip list for that day.", "Open the list", function () { V.openTrips(); }); };
    // La feuille se ferme juste après : le toast attend sa fermeture, sinon il part avec elle.
    var bk = V.$("#book");
    if (bk && bk.open) bk.addEventListener("close", show, { once: true }); else show();
  });
  paint(false);
})();
