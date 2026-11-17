/* Secret Travel & Tour et VIP Taxi Lanta : consentement, Google Analytics 4 (12.11.2026, mesure des clics 16.11.2026)
   et Microsoft Clarity (enregistrements de visite et cartes de chaleur, accord de Jérémy du 16.11.2026).
   Consent Mode v2, mode de base : « consent default » refuse tout dès le départ, gtag.js et le script Clarity ne sont chargés
   qu'après « Accept » ; avant le choix ou après « No thanks » aucun cookie n'est posé et rien ne part vers Google ni Microsoft,
   pas même un événement. La publicité reste toujours refusée (Clarity : consentv2, ad_Storage « denied »).
   Retrait par « Cookie settings » : consentement refusé aux deux, Clarity arrêté, cookies _ga*, _clck et _clsk effacés.
   Clarity : les champs où l'on écrit portent data-clarity-mask="True" dans les gabarits (jamais dans un enregistrement) ;
   booking_open, booking_send et whatsapp_click y arrivent aussi comme événements Clarity, avec product_id et product_type
   en étiquettes, pour filtrer les enregistrements. Le choix est gardé dans localStorage (« stt-consent », 6 mois), jamais dans un cookie.
   Le lien « Cookie settings » du pied de page (data-consent-open) rouvre le choix.
   Événements, sans nom, hôtel, téléphone, date ni texte du message (les pages vues restent automatiques) :
   - whatsapp_click {placement} : lien direct vers WhatsApp (wa.me, api.whatsapp.com) hors de la feuille ;
   - booking_open {product_id, product_type, cta} : la feuille de réservation s'ouvre (booking.js, stt-book-open) ;
   - booking_send {product_id, product_type, option_id, people ou vehicles, value, currency} : « Send on WhatsApp » de la
     feuille (booking.js, stt-book-send) ou de la liste de sorties (v4-trips.js, stt-trips-send) ; l'événement à suivre ;
   - send_on_whatsapp {product_type} : ancien nom du même envoi de la feuille, gardé pour l'historique depuis le 12.11.2026 ;
   - cta_click {cta, placement, link_url} : bouton ou lien marqué data-track-cta (cartes, « See all routes », liste de sorties) ;
   - contact_click {placement, method} : lien tel: ou mailto: ;
   - whatsapp_qr_shown {placement} : sur un ordinateur, le panneau QR code d'un lien WhatsApp ou le QR code de l'écran final
     de la feuille (placement sheet_done) s'affiche (wa-qr.js, stt-wa-qr-shown) ;
   - whatsapp_desktop_open {placement} : « Open WhatsApp on this computer » dans ce panneau (wa-qr.js, stt-wa-desktop-open) ;
   - notice_view, notice_close, banner_click {type} : bandeau d'information de Gestion affiché, fermé, lien suivi (notice.js),
     jamais son texte.
   L'emplacement vient de l'attribut data-track des gabarits (sur l'élément ou un parent), jamais d'une lecture de la page.
   Les identifiants viennent de site.json (data-ga-id, data-clarity-id). Aucune dépendance, aucun autre script de suivi. */
(function () {
  "use strict";
  var KEY = "stt-consent";
  var MAX_AGE = 1000 * 60 * 60 * 24 * 180;
  var script = document.currentScript;
  var GA_ID = (script && script.getAttribute("data-ga-id")) || "";
  var CLARITY_ID = (script && script.getAttribute("data-clarity-id")) || "";
  var DENIED = { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" };
  var GRANTED = { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" };
  var loaded = false;
  var clarityOn = false;
  var on = false;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag("consent", "default", DENIED);

  function read() {
    try {
      var r = JSON.parse(localStorage.getItem(KEY));
      if (r && (r.s === "granted" || r.s === "denied") && Date.now() - r.t < MAX_AGE) return r.s;
    } catch (e) { /* stockage indisponible : le choix sera redemandé */ }
    return null;
  }
  function write(s) {
    try { localStorage.setItem(KEY, JSON.stringify({ s: s, t: Date.now() })); } catch (e) { /* idem */ }
  }

  // Seul endroit qui ajoute un script à la page : gtag.js et le script Clarity, jamais avant « Accept ».
  function inject(src) {
    var s = document.createElement("script");
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
  }
  function load() {
    if (loaded || !GA_ID) return;
    loaded = true;
    gtag("consent", "update", GRANTED);
    gtag("js", new Date());
    gtag("config", GA_ID);
    inject("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID));
  }
  // Clarity : file d'attente « clarity(...) » comme dans l'extrait de Microsoft, script chargé une seule fois.
  function clarity() {
    if (!window.clarity) window.clarity = function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
    window.clarity.apply(null, arguments);
  }
  function loadClarity() {
    if (clarityOn || !CLARITY_ID) return;
    if (!window.clarity) inject("https://www.clarity.ms/tag/" + encodeURIComponent(CLARITY_ID));
    else clarity("start");
    clarityOn = true;
    clarity("consentv2", { ad_Storage: "denied", analytics_Storage: "granted" });
  }
  function stopClarity() {
    if (!clarityOn) return;
    clarityOn = false;
    clarity("consentv2", { ad_Storage: "denied", analytics_Storage: "denied" });
    clarity("stop");
  }
  // Retrait du consentement : _ga, _ga_<id>, _clck et _clsk effacés sur le domaine et ses parents
  // (les cookies que Clarity pose sur clarity.ms sont hors de portée de ce domaine).
  function clearCookies() {
    var names = document.cookie.split(";").map(function (c) { return c.split("=")[0].trim(); }).filter(function (n) { return /^(?:_ga(?:_|$)|_clck$|_clsk$)/.test(n); });
    if (!names.length) return;
    var parts = location.hostname.split("."), domains = [""];
    for (var i = 0; i < parts.length - 1; i++) domains.push("; domain=." + parts.slice(i).join("."));
    names.forEach(function (n) {
      domains.forEach(function (d) { document.cookie = n + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" + d; });
    });
  }
  function apply(state) {
    on = state === "granted";
    if (GA_ID) window["ga-disable-" + GA_ID] = !on;
    if (on) {
      if (loaded) gtag("consent", "update", GRANTED);
      load();
      loadClarity();
    } else {
      if (loaded) gtag("consent", "update", DENIED);
      stopClarity();
      clearCookies();
    }
  }

  // ---------- Mesure des clics et de la réservation (rien avant « Accept ») ----------
  var CLARITY_EVENTS = { booking_open: 1, booking_send: 1, whatsapp_click: 1, whatsapp_qr_shown: 1, whatsapp_desktop_open: 1 };
  function track(name, params) {
    if (!on) return;
    if (loaded) gtag("event", name, params);
    if (clarityOn && CLARITY_EVENTS[name]) {
      if (params.product_id) clarity("set", "product_id", String(params.product_id));
      if (params.product_type) clarity("set", "product_type", String(params.product_type));
      clarity("event", name);
    }
  }
  var WA = /^https:\/\/(?:wa\.me|api\.whatsapp\.com)\//i;
  function placement(el) {
    var p = el.closest("[data-track]");
    return (p && p.getAttribute("data-track")) || "untagged";
  }
  // Un seul écouteur, délégué, en phase de capture : il voit le clic avant que la page ne l'arrête.
  document.addEventListener("click", function (e) {
    if (!on) return;
    var el = e.target && e.target.closest ? e.target.closest("a[href], button") : null;
    if (!el) return;
    var href = el.getAttribute("href") || "";
    // Bouton qui ouvre la feuille (booking_open) ; envois de la feuille et de la liste de sorties (booking_send).
    if (el.hasAttribute("data-book") && document.getElementById("book")) return;
    if (el.hasAttribute("data-tsend") || (el.type === "submit" && el.closest("#book"))) return;
    // Bouton « Open WhatsApp on this computer » du panneau QR : whatsapp_desktop_open (wa-qr.js), pas un second whatsapp_click.
    if (el.hasAttribute("data-wa-desktop")) return;
    if (WA.test(href)) return track("whatsapp_click", { placement: placement(el) });
    if (/^(?:tel|mailto):/i.test(href)) return track("contact_click", { placement: placement(el), method: /^tel:/i.test(href) ? "phone" : "email" });
    var cta = el.getAttribute("data-track-cta");
    if (cta) {
      var p = { cta: cta, placement: placement(el) };
      if (el.tagName === "A") p.link_url = el.href;
      track("cta_click", p);
    }
  }, true);

  document.addEventListener("stt-book-open", function (e) { track("booking_open", e.detail || {}); });
  document.addEventListener("stt-book-send", function (e) {
    var d = {}, src = e.detail || {};
    Object.keys(src).forEach(function (k) { if (k !== "variant") d[k] = src[k]; });
    track("booking_send", d);
    track("send_on_whatsapp", { product_type: src.variant || "unknown" });
  });
  document.addEventListener("stt-trips-send", function (e) { track("booking_send", e.detail || {}); });
  ["view", "close", "click"].forEach(function (k) {
    document.addEventListener("stt-notice-" + k, function (e) {
      var type = e.detail && /^(info|sea|season|new|urgent)$/.test(e.detail.type) ? e.detail.type : "unknown";
      track(k === "click" ? "banner_click" : "notice_" + k, { type: type });
    });
  });
  document.addEventListener("stt-wa-qr-shown", function (e) { track("whatsapp_qr_shown", { placement: (e.detail && e.detail.placement) || "untagged" }); });
  document.addEventListener("stt-wa-desktop-open", function (e) { track("whatsapp_desktop_open", { placement: (e.detail && e.detail.placement) || "untagged" }); });

  // ---------- Bandeau ----------
  // Refonte du 17.11.2026 (Jérémy : le bandeau faisait peur et ne donnait pas envie). Texte court et vrai, le détail reste
  // sur /privacy/#cookies. Hiérarchie claire mais choix réel (CNIL, EDPB) : « Accept » plein, plus large, à droite et focalisé
  // à la réouverture ; « No thanks » en contour, même hauteur (44 px au moins), lisible (AA), au même endroit, en un appui.
  // Ordre de tabulation = ordre visuel (No thanks puis Accept). Bande fine en bas sur téléphone, fenêtre centrée sur
  // ordinateur (ci-dessous). La bande ne couvre jamais la barre de réservation (.dock, .vbar) ni le bandeau de Gestion : elle se pose
  // au-dessus d'eux quand ils sont à l'écran. Un seul mouvement à l'arrivée, coupé si prefers-reduced-motion.
  // Ordinateur (17.11.2026, Jérémy : la carte du coin ne se voyait pas) : fenêtre centrée de 460 px, fond assombri à 35 %,
  // page visible derrière et immobile. <dialog> ouvert avec showModal : le reste de la page est inerte, donc la fenêtre passe
  // avant tout clic (WhatsApp, panneau QR, feuille), et elle se pose au-dessus de toute autre fenêtre déjà ouverte.
  // Focus sur « Accept », tabulation gardée dans la fenêtre, Échap = « No thanks » (refus enregistré comme le bouton),
  // clic sur le fond sans effet. Après le choix : page débloquée, focus rendu à l'élément d'avant. Téléphone : la bande
  // du bas reste telle quelle (non modale).
  var VIP = document.documentElement.getAttribute("data-brand") === "vip";
  var P = VIP
    ? { bg: "#1B130D", ink: "#F6EEDC", mute: "#CDBFA6", line: "rgba(217,170,78,.45)", no: "#B98B31", noHover: "#2B1F16", btn: "#D9AA4E", btnInk: "#1B130D", btnHover: "#E9C172", ring: "#E9C172", body: "'Bai Jamjuree',system-ui,sans-serif", r: "10px", shadow: "none" }
    : { bg: "#FFFFFF", ink: "#14262B", mute: "#3B5551", line: "#E3DACB", no: "#7A8884", noHover: "#F6EFE4", btn: "#0B3B3C", btnInk: "#FFFFFF", btnHover: "#124B4C", ring: "#0F6B61", body: "'Manrope',system-ui,sans-serif", r: "12px", shadow: "0 10px 30px rgba(20,38,43,.14)" };
  var DESK = "(min-width:760px)";
  var css = ".cb{position:fixed;inset:auto 0 var(--cb-b,0px) 0;margin:0;width:auto;max-width:none;max-height:none;z-index:200;box-sizing:border-box;border:0;"
    + "padding:12px 16px calc(12px + env(safe-area-inset-bottom));background:" + P.bg + ";color:" + P.ink + ";border-top:1px solid " + P.line + ";font-family:" + P.body + ";"
    + "transform:translateY(calc(100% + 24px));visibility:hidden;transition:transform .28s cubic-bezier(.22,1,.36,1),visibility 0s .28s}"
    + ".cb.is-on{transform:none;visibility:visible;transition:transform .28s cubic-bezier(.22,1,.36,1)}"
    + ".cb-p{margin:0 0 10px;font-size:14px;line-height:1.45;color:" + P.mute + "}"
    + ".cb-t{color:" + P.ink + ";font-weight:700}"
    + ".cb-p a{color:" + P.ink + ";text-decoration:underline;text-underline-offset:.2em;white-space:nowrap}"
    + ".cb-r{display:grid;grid-template-columns:auto 1fr;gap:8px}"
    + ".cb-b{min-height:44px;margin:0;padding:0 18px;border-radius:" + P.r + ";font:600 15px/1 " + P.body + ";cursor:pointer}"
    + ".cb-no{background:transparent;color:" + P.ink + ";border:1.5px solid " + P.no + "}"
    + ".cb-no:hover{background:" + P.noHover + "}"
    + ".cb-yes{background:" + P.btn + ";color:" + P.btnInk + ";border:1.5px solid " + P.btn + ";font-weight:700}"
    + ".cb-yes:hover{background:" + P.btnHover + ";border-color:" + P.btnHover + "}"
    + ".cb :focus-visible{outline:3px solid " + P.ring + ";outline-offset:2px}"
    // Fenêtre centrée (ordinateur) : fondu et léger agrandissement à l'ouverture, rien d'autre.
    + ".cb.cb--modal{inset:0;margin:auto;width:min(460px,calc(100% - 48px));height:fit-content;padding:28px 28px 24px;border:1px solid " + P.line + ";border-radius:" + P.r + ";"
    + "box-shadow:0 24px 64px rgba(0,0,0,.28);visibility:visible;opacity:0;transform:scale(.96);transition:opacity .22s ease-out,transform .22s cubic-bezier(.22,1,.36,1)}"
    + ".cb.cb--modal.is-on{opacity:1;transform:none}"
    + ".cb--modal::backdrop{background:rgba(0,0,0,.35)}"
    + ".cb--modal .cb-t{display:block;margin:0 0 8px;font-size:20px;line-height:1.3}"
    + ".cb--modal .cb-p{margin:0 0 20px;font-size:15px;line-height:1.5}"
    + "html.cb-lock{overflow:hidden}"
    + "@media(prefers-reduced-motion:reduce){.cb,.cb.is-on,.cb.cb--modal,.cb.cb--modal.is-on{transition:none}}";
  var box = null, raf = 0, before = null;
  // Barre de réservation (.dock des fiches, .vbar VIP) ou bandeau de Gestion en bas d'écran, sous le bandeau : on se pose dessus.
  function lift() {
    raf = 0;
    if (!box || !box.classList.contains("is-on") || box.classList.contains("cb--modal")) return;
    var r = box.getBoundingClientRect(), h = window.innerHeight, up = 0;
    Array.prototype.forEach.call(document.querySelectorAll(".dock, .vbar, .site-notice--bottom, .tl-dock"), function (el) {
      var q = el.getBoundingClientRect();
      if (!q.height || q.top >= h || q.bottom < h - 2 || q.right <= r.left || q.left >= r.right) return;
      up = Math.max(up, Math.ceil(h - q.top));
    });
    box.style.setProperty("--cb-b", up + "px");
  }
  function askLift() { if (!raf) raf = requestAnimationFrame(lift); }
  // Suivi des barres du bas seulement tant que le bandeau est à l'écran.
  function watch(on) {
    var m = on ? "addEventListener" : "removeEventListener";
    window[m]("scroll", askLift, { passive: true });
    window[m]("resize", askLift);
    document[m]("transitionend", askLift, true);
  }
  function build() {
    if (box) return box;
    var st = document.createElement("style");
    st.textContent = css;
    document.head.appendChild(st);
    box = document.createElement("dialog");
    box.className = "cb";
    box.setAttribute("aria-labelledby", "cb-t");
    box.setAttribute("aria-describedby", "cb-p");
    box.innerHTML = '<p class="cb-p" id="cb-p"><strong class="cb-t" id="cb-t">Help us improve this site?</strong> We use cookies to see which pages help travellers and how they are used. <a href="/privacy/#cookies">Privacy</a></p>'
      + '<div class="cb-r"><button class="cb-b cb-no" type="button" data-choice="denied">No thanks</button><button class="cb-b cb-yes" type="button" data-choice="granted">Accept</button></div>';
    // Un clic sur le fond atteint le <dialog> lui-même : sans [data-choice], il ne fait rien (il faut choisir).
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-choice]");
      if (b) choose(b.getAttribute("data-choice"));
    });
    // Échap : refus explicite, enregistré comme « No thanks » (jamais une fermeture sans choix).
    box.addEventListener("cancel", function (e) { e.preventDefault(); if (box.open) choose("denied"); });
    box.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); if (box.open) choose("denied"); return; }
      if (e.key !== "Tab" || !box.classList.contains("cb--modal")) return;
      // Tabulation gardée dans la fenêtre : Privacy, No thanks, Accept, puis retour au début.
      var f = box.querySelectorAll("a[href], button");
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    document.body.appendChild(box);
    return box;
  }
  function choose(s) {
    write(s);
    apply(s);
    if (!box) return;
    var modal = box.classList.contains("cb--modal");
    box.classList.remove("is-on");
    watch(false);
    // Fenêtre : fermée tout de suite (la page est rendue). Bande du téléphone : elle descend d'abord, comme avant.
    if (modal) box.close();
    else setTimeout(function () { if (box.open && !box.classList.contains("is-on")) box.close(); }, 300);
    box.classList.remove("cb--modal");
    box.removeAttribute("aria-modal");
    document.documentElement.classList.remove("cb-lock");
    document.documentElement.style.scrollbarGutter = "";
    // Focus rendu à la page : l'élément qui l'avait avant la fenêtre, s'il est encore là.
    if (modal && before && before.focus && document.contains(before)) before.focus({ preventScroll: true });
    before = null;
  }
  function show(focus) {
    var b = build();
    if (b.open && b.classList.contains("is-on")) return;
    if (b.open) b.close(); // bande encore en train de descendre : on repart d une fenêtre fermée
    var modal = Boolean(window.matchMedia && window.matchMedia(DESK).matches && typeof b.showModal === "function");
    if (modal) {
      before = document.activeElement;
      b.classList.add("cb--modal");
      b.setAttribute("aria-modal", "true");
      var root = document.documentElement;
      if (window.innerWidth - root.clientWidth > 0) root.style.scrollbarGutter = "stable";
      root.classList.add("cb-lock");
      b.showModal();
      b.querySelector('[data-choice="granted"]').focus();
    } else if (typeof b.show === "function") b.show();
    else b.setAttribute("open", "");
    requestAnimationFrame(function () {
      b.classList.add("is-on");
      if (modal) return;
      watch(true);
      lift();
      if (focus) b.querySelector('[data-choice="granted"]').focus();
    });
  }

  document.addEventListener("click", function (e) {
    if (e.target && e.target.closest && e.target.closest("[data-consent-open]")) { e.preventDefault(); show(true); }
  });

  function start() {
    var saved = read();
    apply(saved);
    // Premier passage : le bandeau arrive après le chargement de la page, pour ne rien retarder.
    if (!saved) setTimeout(function () { show(false); }, 900);
  }
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start);
})();
