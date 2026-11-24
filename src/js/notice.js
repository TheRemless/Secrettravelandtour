/* Bandeau d'information géré depuis Gestion (contrat Site_Anais docs/gestion/bandeau-site.md, 17.11.2026).
   Un seul bandeau par page, choisi par pickBanner (copie exacte du contrat) selon la marque, la section et le produit
   de la page (posés sur la balise du script par consent-head.njk, données noticePages.js). Rien ne bloque l'affichage :
   le script est différé, la réponse arrive quand elle arrive, une panne ou une liste vide n'affiche rien.
   Pas de saut de mise en page (CLS) : le bandeau est fixe, il ne pousse jamais le contenu. Pages Secret (en-tête fixe) :
   juste sous l'en-tête, il remonte avec lui quand l'en-tête se cache. Pages sans en-tête fixe (VIP Taxi Lanta, pages
   légales) : en bas de l'écran, au-dessus de la barre de réservation.
   Texte, libellé du lien et étiquette des cartes posés avec textContent, jamais comme HTML. Lien : un chemin du site,
   ou WhatsApp construit avec le numéro du site. Fermé par le visiteur (si closable) : retenu dans localStorage.
   Mesure (consent.js, après « Accept » seulement) : notice_view, notice_close, banner_click {type}, jamais le texte.
   Étiquette facultative sur les cartes des sorties visées (sea et season avec card_label), posée sur la photo.
   Texte long (24.11.2026, 600 caractères au plus, retours à la ligne permis) : au-delà de 140 caractères ou avec un
   retour à la ligne, le texte est replié sur deux lignes avec un bouton « More » (aria-expanded), puis « Less ». Le
   bouton n'apparaît que si le texte dépasse vraiment deux lignes ; le lien passe alors sous le texte pour rester
   visible replié. Un texte de 140 caractères au plus, sans retour à la ligne, se rend exactement comme avant. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    var api = factory();
    root.STT_NOTICE = api;
    if (typeof document !== "undefined") api.mount(document);
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var URL = "https://lkxqcmzeidlyssoqmqkh.supabase.co/functions/v1/bandeau-site";
  var KEY = "stt-notice-v1", CLOSED = "stt-notice-closed";
  var TYPES = { info: 1, sea: 1, season: 1, "new": 1, urgent: 1 };
  // Contrat : 600 caractères au plus. Jusqu'à 140 sans retour à la ligne, le rendu d'avant (une ligne de texte et le lien à la suite).
  var TEXT_MAX = 600, LEGACY_MAX = 140;
  function isLong(text) { return text.length > LEGACY_MAX || /[\r\n]/.test(text); }
  // Retours à la ligne gardés (deux au plus de suite), espaces de fin de ligne retirés.
  function cleanText(text) {
    return String(text).replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, TEXT_MAX);
  }

  // ---------- Règle de choix : copie exacte de choisirBandeau (contrat) ----------
  var ORDER = { urgent: 0, sea: 1, season: 2, "new": 3, info: 4 };
  function pickBanner(banners, page, now, closed) {
    return banners.filter(function (b) {
      var t = b.target, hit = t.kind === "all" ||
        (t.kind === "sections" && page.section && t.sections.indexOf(page.section) > -1) ||
        (t.kind === "products" && page.product && t.products.indexOf(page.product) > -1);
      return b.brands.indexOf(page.brand) > -1 && hit &&
        Date.parse(b.starts_at) <= now && (!b.ends_at || Date.parse(b.ends_at) > now) &&
        !(b.closable && closed.indexOf(b.id) > -1);
    }).sort(function (a, b) {
      return a.priority - b.priority || ORDER[a.type] - ORDER[b.type] ||
        Date.parse(b.starts_at) - Date.parse(a.starts_at) || (a.id < b.id ? -1 : 1);
    })[0] || null;
  }
  // Un bandeau mal formé (champ absent, type inconnu) est écarté avant le choix, au lieu de faire échouer tout le choix.
  function valid(b) {
    return Boolean(b && typeof b.id === "string" && Object.prototype.hasOwnProperty.call(TYPES, b.type) && typeof b.text === "string" && b.text &&
      Array.isArray(b.brands) && b.target && typeof b.target.kind === "string" &&
      (b.target.kind !== "sections" || Array.isArray(b.target.sections)) &&
      (b.target.kind !== "products" || Array.isArray(b.target.products)) && typeof b.starts_at === "string");
  }
  function choose(data, page, now, closed) {
    var list = data && Array.isArray(data.banners) ? data.banners.filter(valid) : [];
    return pickBanner(list, page, now, closed || []);
  }
  // Lien du bandeau : un chemin du site (« /… », jamais « //… »), ou WhatsApp avec le numéro du site.
  function linkOf(b, number) {
    var l = b.link;
    if (!l || typeof l !== "object" || typeof l.label !== "string" || !l.label) return null;
    if (l.kind === "page" && typeof l.href === "string" && /^\/(?![\/\\])[^\s\\]*$/.test(l.href)) return { href: l.href, label: l.label, blank: false };
    if (l.kind === "whatsapp" && number) return { href: "https://wa.me/" + number + (l.text ? "?text=" + encodeURIComponent(String(l.text)) : ""), label: l.label, blank: true };
    return null;
  }

  // ---------- Icônes (tracés de Gestion, ICONES de src/gestion/js/views/bandeau-site.mjs) ----------
  var ICONS = {
    info: ["M12 8h.01", "M11 12h1v5h1", "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"],
    sea: ["M2 9c2 0 2-1.5 4-1.5S8 9 10 9s2-1.5 4-1.5S16 9 18 9s2-1.5 4-1.5", "M2 14c2 0 2-1.5 4-1.5S8 14 10 14s2-1.5 4-1.5S16 14 18 14s2-1.5 4-1.5", "M2 19c2 0 2-1.5 4-1.5S8 19 10 19s2-1.5 4-1.5S16 19 18 19s2-1.5 4-1.5"],
    season: ["M7 3v3", "M17 3v3", "M4 8h16", "M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"],
    "new": ["M12 3l2.4 5.6L20 9.3l-4.3 3.9 1.2 5.8L12 16l-4.9 3 1.2-5.8L4 9.3l5.6-.7z"],
    urgent: ["M12 9v4", "M12 17h.01", "M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"]
  };
  var SVG = "http://www.w3.org/2000/svg";
  function svg(doc, paths, attrs) {
    var s = doc.createElementNS(SVG, "svg");
    Object.keys(attrs).forEach(function (k) { s.setAttribute(k, attrs[k]); });
    paths.forEach(function (d) { var p = doc.createElementNS(SVG, "path"); p.setAttribute("d", d); s.appendChild(p); });
    return s;
  }

  // ---------- Styles (contrat, couleurs des jetons de chaque marque, avec replis) ----------
  var CSS = ".site-notice{--n-bg:var(--sand,#F6EFE4);--n-ink:var(--ink,#14262B);--n-icon:currentColor;--n-rule:var(--line,#E3DACB);"
    + "position:fixed;left:0;right:0;z-index:45;background:var(--n-bg);color:var(--n-ink);border-bottom:1px solid var(--n-rule)}"
    + ".site-notice--top{top:var(--hd,0px);transition:transform var(--t3,360ms) var(--out,ease)}"
    + ".hd.is-hidden~.site-notice--top{transform:translateY(calc(-100% - var(--hd,0px)));transition:transform 240ms var(--in,ease)}"
    + ".site-notice--bottom{bottom:calc(var(--notice-bottom,0px) + env(safe-area-inset-bottom,0px));border-bottom:0;border-top:1px solid var(--n-rule)}"
    + ".site-notice__inner{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:start;gap:10px;max-width:calc(var(--max,1200px) + 2*var(--gut,20px));margin:0 auto;padding:10px var(--gut,20px)}"
    + ".site-notice__icon{color:var(--n-icon);margin-top:2px}"
    + ".site-notice__text{margin:0;font:600 15px/1.45 var(--sans,'Manrope',system-ui,sans-serif)}"
    + ".site-notice__link{color:inherit;font-weight:700;text-decoration:underline;text-underline-offset:3px;white-space:nowrap}"
    + ".site-notice__close{width:44px;height:44px;margin:-12px -12px -12px 0;display:inline-flex;align-items:center;justify-content:center;background:none;border:0;padding:0;color:inherit;cursor:pointer}"
    + ".site-notice__close:focus-visible,.site-notice__link:focus-visible{outline:2px solid currentColor;outline-offset:2px}"
    + ".site-notice--sea{--n-bg:#F7D58B;--n-ink:var(--ink,#14262B);--n-rule:#E6BC5C}"
    + ".site-notice--season{--n-bg:var(--on-dark-mute,#B5CBC6);--n-ink:var(--deep,#0B3B3C);--n-rule:#9FB8B2}"
    + ".site-notice--new{--n-bg:var(--sea,#0F6B61);--n-ink:var(--white,#fff);--n-rule:var(--sea,#0F6B61)}"
    + ".site-notice--urgent{--n-bg:var(--ink,#14262B);--n-ink:var(--white,#fff);--n-icon:#F7D58B;--n-rule:var(--ink,#14262B)}"
    // VIP Taxi Lanta, « Laque et or » (variables de vip-taxi.css)
    + "[data-brand=vip] .site-notice__text{font-family:var(--text,'Bai Jamjuree',system-ui,sans-serif);font-weight:500}"
    + "[data-brand=vip] .site-notice--info{--n-bg:var(--paper-2,#EFE8DA);--n-ink:var(--ink,#1B130D);--n-rule:var(--rule,#DDD3C0)}"
    + "[data-brand=vip] .site-notice--sea{--n-bg:var(--gold,#D9AA4E);--n-ink:var(--lac,#1B130D);--n-rule:var(--gold-line,#B98B31)}"
    + "[data-brand=vip] .site-notice--season{--n-bg:var(--bronze,#7C5A1C);--n-ink:var(--ivory,#F3ECDC);--n-rule:var(--bronze,#7C5A1C)}"
    + "[data-brand=vip] .site-notice--new{--n-bg:var(--white,#FFFDF8);--n-ink:var(--lac,#1B130D);--n-icon:var(--bronze,#7C5A1C);--n-rule:var(--gold-line,#B98B31)}"
    + "[data-brand=vip] .site-notice--urgent{--n-bg:var(--lac,#1B130D);--n-ink:var(--white,#FFFDF8);--n-icon:var(--gold,#D9AA4E);--n-rule:var(--gold-line,#B98B31)}"
    + ".card-notice{position:absolute;top:10px;left:10px;z-index:1;display:inline-block;padding:2px 8px;border-radius:999px;font:600 13px/1.4 var(--sans,'Manrope',system-ui,sans-serif)}"
    + ".card-notice--sea{background:#F7D58B;color:var(--ink,#14262B)}"
    + ".card-notice--season{background:var(--on-dark-mute,#B5CBC6);color:var(--deep,#0B3B3C)}"
    // Texte long : replié sur deux lignes (hauteur fixe tant qu'il est replié), ouvert par « More ». Aucune animation.
    + ".site-notice--long .site-notice__body{min-width:0;max-width:80ch}"
    + ".site-notice--long .site-notice__text{white-space:pre-line;overflow-wrap:anywhere;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden}"
    + ".site-notice--long.is-open .site-notice__text{display:block;-webkit-line-clamp:none;line-clamp:none;overflow-y:auto;max-height:calc(100vh - var(--hd,0px) - 120px);max-height:calc(100dvh - var(--hd,0px) - 120px)}"
    + ".site-notice__actions{display:flex;flex-wrap:wrap;align-items:center;gap:0 24px;margin-top:4px}"
    + ".site-notice__actions[hidden],.site-notice__more[hidden]{display:none}"
    // Bouton et lien de la hauteur d'une ligne ; la zone de toucher (44 px au moins) déborde par ::before.
    + ".site-notice__more,.site-notice__actions .site-notice__link{position:relative;display:inline-block;padding:0;background:none;border:0;color:inherit;font-family:inherit;font-size:15px;font-weight:700;line-height:1.45;text-decoration:underline;text-underline-offset:3px;cursor:pointer;touch-action:manipulation}"
    + ".site-notice__more::before,.site-notice__actions .site-notice__link::before{content:\"\";position:absolute;top:50%;left:50%;width:max(100% + 16px,44px);height:44px;transform:translate(-50%,-50%)}"
    + ".site-notice__more:focus-visible,.site-notice--long .site-notice__text:focus-visible{outline:2px solid currentColor;outline-offset:2px}"
    + "@media(prefers-reduced-motion:reduce){.site-notice--top,.hd.is-hidden~.site-notice--top{transition:none}}";

  function emit(doc, name, type) {
    if (typeof CustomEvent === "function") doc.dispatchEvent(new CustomEvent(name, { detail: { type: type } }));
  }

  function linkNode(doc, l) {
    var a = doc.createElement("a");
    a.className = "site-notice__link";
    a.href = l.href;
    a.textContent = l.label.slice(0, 60);
    a.setAttribute("data-notice-link", "");
    if (l.blank) { a.target = "_blank"; a.rel = "noopener"; }
    return a;
  }

  // Texte long replié : « More » seulement s'il dépasse vraiment deux lignes ; la ligne d'actions disparaît si elle est vide.
  function fit(box) {
    if (!box || !box.classList.contains("site-notice--long") || box.classList.contains("is-open")) return;
    var p = box.querySelector(".site-notice__text"), more = box.querySelector(".site-notice__more"), row = box.querySelector(".site-notice__actions");
    if (!p || !more || !row) return;
    var over = p.scrollHeight > p.clientHeight + 1;
    more.hidden = !over;
    row.hidden = !over && !box.querySelector(".site-notice__link");
  }
  function toggle(box, open) {
    var p = box.querySelector(".site-notice__text"), more = box.querySelector(".site-notice__more");
    box.classList.toggle("is-open", open);
    more.setAttribute("aria-expanded", open ? "true" : "false");
    more.textContent = open ? "Less" : "More";
    // Ouvert et plus haut que l'écran : le texte défile dans le bandeau, au clavier aussi.
    if (open && p.scrollHeight > p.clientHeight + 1) p.setAttribute("tabindex", "0"); else p.removeAttribute("tabindex");
    if (!open) fit(box);
  }

  // Construit le bandeau (HTML du contrat) noeud par noeud : les textes venus de Gestion ne sont jamais lus comme du HTML.
  function build(doc, b, number) {
    var box = doc.createElement("aside");
    box.className = "site-notice site-notice--" + b.type;
    box.setAttribute("role", b.type === "urgent" ? "alert" : "region");
    box.setAttribute("aria-label", "Notice");
    box.setAttribute("lang", "en");
    box.setAttribute("data-track", "notice");
    box.setAttribute("data-notice-id", b.id);
    box.setAttribute("data-notice-type", b.type);
    var inner = doc.createElement("div");
    inner.className = "site-notice__inner";
    inner.appendChild(svg(doc, ICONS[b.type], { "class": "site-notice__icon", viewBox: "0 0 24 24", width: "20", height: "20", fill: "none", stroke: "currentColor", "stroke-width": "1.8", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" }));
    var p = doc.createElement("p");
    p.className = "site-notice__text";
    var l = linkOf(b, number), long = isLong(b.text);
    if (long) {
      // Texte long : le texte (replié par le style), puis une ligne avec « More » et le lien.
      box.className += " site-notice--long";
      var body = doc.createElement("div");
      body.className = "site-notice__body";
      p.id = "site-notice-text-" + String(b.id).replace(/[^A-Za-z0-9_-]/g, "");
      p.textContent = cleanText(b.text);
      body.appendChild(p);
      var row = doc.createElement("div");
      row.className = "site-notice__actions";
      var more = doc.createElement("button");
      more.className = "site-notice__more";
      more.type = "button";
      more.setAttribute("aria-expanded", "false");
      more.setAttribute("aria-controls", p.id);
      more.textContent = "More";
      row.appendChild(more);
      if (l) row.appendChild(linkNode(doc, l));
      body.appendChild(row);
      inner.appendChild(body);
    } else {
      p.textContent = b.text.slice(0, LEGACY_MAX);
      if (l) {
        p.appendChild(doc.createTextNode(" "));
        p.appendChild(linkNode(doc, l));
      }
      inner.appendChild(p);
    }
    if (b.closable) {
      var x = doc.createElement("button");
      x.className = "site-notice__close";
      x.type = "button";
      x.setAttribute("aria-label", "Close this notice");
      x.appendChild(svg(doc, ["M6 6l12 12M18 6L6 18"], { viewBox: "0 0 24 24", width: "18", height: "18", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "aria-hidden": "true" }));
      inner.appendChild(x);
    } else inner.appendChild(doc.createElement("span"));
    box.appendChild(inner);
    return box;
  }

  function mount(doc) {
    var tag = doc.querySelector("script[data-notice-brand]");
    if (!tag || !doc.body) return;
    var page = { brand: tag.getAttribute("data-notice-brand") || "secret", section: tag.getAttribute("data-notice-section") || null, product: tag.getAttribute("data-notice-product") || null };
    var number = tag.getAttribute("data-notice-wa") || "";
    var read = function (store, k, d) { try { var v = JSON.parse(window[store].getItem(k)); return v === null ? d : v; } catch (e) { return d; } };
    var closed = read("localStorage", CLOSED, []);
    if (!Array.isArray(closed)) closed = [];
    var styled = false, shownId = null;

    function style() {
      if (styled) return;
      styled = true;
      var st = doc.createElement("style");
      st.textContent = CSS;
      doc.head.appendChild(st);
    }
    // Pages sans en-tête fixe : en bas, au-dessus d'une barre de réservation collée en bas de l'écran.
    function place(box) {
      var hd = doc.querySelector("header.hd");
      if (hd) { box.classList.add("site-notice--top"); hd.parentNode.insertBefore(box, hd.nextSibling); return; }
      box.classList.add("site-notice--bottom");
      doc.body.appendChild(box);
      // Barre de réservation collée en bas (VIP, téléphone) : le bandeau se pose dessus seulement quand elle est à l'écran.
      var bar = doc.querySelector(".vbar");
      if (!bar) return;
      var raf = 0, sync = function () {
        raf = 0;
        var r = bar.getBoundingClientRect(), on = r.height > 0 && r.top < window.innerHeight && r.bottom >= window.innerHeight - 1;
        doc.documentElement.style.setProperty("--notice-bottom", on ? Math.round(window.innerHeight - r.top) + "px" : "0px");
      };
      var ask = function () { if (!raf) raf = requestAnimationFrame(sync); };
      window.addEventListener("scroll", ask, { passive: true });
      window.addEventListener("resize", ask);
      // La barre glisse (transform) quand le bouton du haut sort de l'écran : on suit aussi la fin de son mouvement.
      bar.addEventListener("transitionend", ask);
      sync();
    }
    function cards(data) {
      Array.prototype.forEach.call(doc.querySelectorAll(".card-notice"), function (n) { n.remove(); });
      Array.prototype.forEach.call(doc.querySelectorAll(".card[data-slug]"), function (card) {
        var slug = card.getAttribute("data-slug");
        var b = choose(data, { brand: "secret", section: card.getAttribute("data-kind") === "boat" ? "islands" : "activities", product: slug }, Date.now(), []);
        var ph = card.querySelector(".ph");
        if (!b || !ph || !(b.type === "sea" || b.type === "season") || typeof b.card_label !== "string" || !b.card_label || b.target.kind !== "products") return;
        var s = doc.createElement("span");
        s.className = "card-notice card-notice--" + b.type;
        s.textContent = b.card_label.slice(0, 24);
        style();
        ph.appendChild(s);
      });
    }
    function show(data) {
      try {
        var b = choose(data, page, Date.now(), closed);
        var old = doc.querySelector(".site-notice");
        if (old && (!b || old.getAttribute("data-notice-id") !== b.id)) { old.remove(); shownId = null; }
        cards(data);
        if (!b || (old && old.getAttribute("data-notice-id") === b.id)) return;
        style();
        var box = build(doc, b, number);
        place(box);
        fit(box);
        if (shownId !== b.id) {
          shownId = b.id;
          // Après « load » : consent.js n'écoute la mesure qu'à partir de là (rien ne part sans « Accept »).
          var type = b.type, view = function () { setTimeout(function () { emit(doc, "stt-notice-view", type); }, 0); };
          if (doc.readyState === "complete") view(); else window.addEventListener("load", view);
        }
      } catch (e) { /* bandeau mal formé : rien n'est affiché */ }
    }

    doc.addEventListener("click", function (e) {
      var t = e.target && e.target.closest ? e.target : null;
      if (!t) return;
      var box = t.closest(".site-notice");
      if (!box) return;
      var type = box.getAttribute("data-notice-type");
      if (t.closest("[data-notice-link]")) { emit(doc, "stt-notice-click", type); return; }
      if (t.closest(".site-notice__more")) { toggle(box, !box.classList.contains("is-open")); return; }
      if (!t.closest(".site-notice__close")) return;
      closed = closed.concat(box.getAttribute("data-notice-id")).slice(-20);
      try { localStorage.setItem(CLOSED, JSON.stringify(closed)); } catch (e2) { /* stockage indisponible : fermé pour cette page */ }
      box.remove();
      emit(doc, "stt-notice-close", type);
    });

    // Échap referme un texte ouvert et rend le focus au bouton.
    doc.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || !e.target || !e.target.closest) return;
      var box = e.target.closest(".site-notice.is-open");
      if (!box) return;
      toggle(box, false);
      box.querySelector(".site-notice__more").focus();
    });
    // La largeur change (rotation, fenêtre) ou la police arrive : « More » recalculé.
    var refit = 0, again = function () { refit = 0; fit(doc.querySelector(".site-notice")); };
    window.addEventListener("resize", function () { if (!refit) refit = requestAnimationFrame(again); });
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(again, function () {});

    // Copie de la page précédente tout de suite, puis la réponse à jour (en cache 60 s côté fonction).
    show(read("sessionStorage", KEY, null));
    if (typeof fetch !== "function") return;
    fetch(URL, { credentials: "omit" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (data) {
      if (!data || typeof data !== "object") return;
      try { sessionStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* stockage indisponible */ }
      show(data);
    }).catch(function () { /* panne ou hors ligne : pas de bandeau */ });
  }

  return { pickBanner: pickBanner, choose: choose, valid: valid, linkOf: linkOf, build: build, mount: mount, isLong: isLong, cleanText: cleanText, TEXT_MAX: TEXT_MAX, LEGACY_MAX: LEGACY_MAX, URL: URL };
});
