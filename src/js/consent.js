/* Secret Travel & Tour et VIP Taxi Lanta : consentement et Google Analytics 4 (12.11.2026, mesure des clics 16.11.2026).
   Consent Mode v2, mode de base : « consent default » refuse tout dès le départ, gtag.js n'est chargé qu'après « Accept »,
   avant le choix ou après « Decline » aucun cookie n'est posé et rien ne part vers Google, pas même un événement.
   La publicité reste toujours refusée. Le choix est gardé dans localStorage (« stt-consent », 6 mois), jamais dans un cookie.
   Le lien « Cookie settings » du pied de page (data-consent-open) rouvre le choix.
   Événements, sans nom, hôtel, téléphone, date ni texte du message (les pages vues restent automatiques) :
   - whatsapp_click {placement} : lien direct vers WhatsApp (wa.me, api.whatsapp.com) hors de la feuille ;
   - booking_open {product_id, product_type, cta} : la feuille de réservation s'ouvre (booking.js, stt-book-open) ;
   - booking_send {product_id, product_type, option_id, people ou vehicles, value, currency} : « Send on WhatsApp » de la
     feuille (booking.js, stt-book-send) ou de la liste de sorties (v4-trips.js, stt-trips-send) ; l'événement à suivre ;
   - send_on_whatsapp {product_type} : ancien nom du même envoi de la feuille, gardé pour l'historique depuis le 12.11.2026 ;
   - cta_click {cta, placement, link_url} : bouton ou lien marqué data-track-cta (cartes, « See all routes », liste de sorties) ;
   - contact_click {placement, method} : lien tel: ou mailto:.
   L'emplacement vient de l'attribut data-track des gabarits (sur l'élément ou un parent), jamais d'une lecture de la page.
   L'identifiant de mesure vient de site.json (data-ga-id). Aucune dépendance, aucun autre script de suivi. */
(function () {
  "use strict";
  var KEY = "stt-consent";
  var MAX_AGE = 1000 * 60 * 60 * 24 * 180;
  var script = document.currentScript;
  var GA_ID = (script && script.getAttribute("data-ga-id")) || "";
  var DENIED = { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" };
  var GRANTED = { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" };
  var loaded = false;
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

  function load() {
    if (loaded || !GA_ID) return;
    loaded = true;
    gtag("consent", "update", GRANTED);
    gtag("js", new Date());
    gtag("config", GA_ID);
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
  }
  // Retrait du consentement : _ga et _ga_<id> effacés sur le domaine et ses parents.
  function clearCookies() {
    var names = document.cookie.split(";").map(function (c) { return c.split("=")[0].trim(); }).filter(function (n) { return /^_ga(_|$)/.test(n); });
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
    if (on) load();
    else {
      if (loaded) gtag("consent", "update", DENIED);
      clearCookies();
    }
  }

  // ---------- Mesure des clics et de la réservation (rien avant « Accept ») ----------
  function track(name, params) {
    if (!on || !loaded) return;
    gtag("event", name, params);
  }
  var WA = /^https:\/\/(?:wa\.me|api\.whatsapp\.com)\//i;
  function placement(el) {
    var p = el.closest("[data-track]");
    return (p && p.getAttribute("data-track")) || "untagged";
  }
  // Un seul écouteur, délégué, en phase de capture : il voit le clic avant que la page ne l'arrête.
  document.addEventListener("click", function (e) {
    if (!on || !loaded) return;
    var el = e.target && e.target.closest ? e.target.closest("a[href], button") : null;
    if (!el) return;
    var href = el.getAttribute("href") || "";
    // Bouton qui ouvre la feuille (booking_open) ; envois de la feuille et de la liste de sorties (booking_send).
    if (el.hasAttribute("data-book") && document.getElementById("book")) return;
    if (el.hasAttribute("data-tsend") || (el.type === "submit" && el.closest("#book"))) return;
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

  // ---------- Bandeau ----------
  var VIP = document.documentElement.getAttribute("data-brand") === "vip";
  var P = VIP
    ? { bg: "#1B130D", ink: "#F6EEDC", mute: "#CDBFA6", line: "rgba(217,170,78,.45)", btn: "#D9AA4E", btnInk: "#1B130D", btnHover: "#E9C172", ring: "#E9C172", title: "'Chonburi','Times New Roman',serif", body: "'Bai Jamjuree',system-ui,sans-serif", tw: 400, r: "10px" }
    : { bg: "#0B3B3C", ink: "#EEF3F1", mute: "#B5CBC6", line: "rgba(238,243,241,.22)", btn: "#F6EFE4", btnInk: "#14262B", btnHover: "#FFFFFF", ring: "#F6EFE4", title: "'Cormorant Garamond','Times New Roman',serif", body: "'Manrope',system-ui,sans-serif", tw: 600, r: "12px" };
  var css = ".cb{position:fixed;left:12px;right:12px;bottom:12px;z-index:200;max-width:560px;margin:0 auto;padding:20px 20px 18px;"
    + "background:" + P.bg + ";color:" + P.ink + ";border:1px solid " + P.line + ";border-radius:" + P.r + ";font-family:" + P.body + ";"
    + "transform:translateY(calc(100% + 24px));visibility:hidden;transition:transform .32s cubic-bezier(.22,1,.36,1),visibility 0s .32s}"
    + ".cb.is-on{transform:none;visibility:visible;transition:transform .32s cubic-bezier(.22,1,.36,1)}"
    + ".cb-t{margin:0 0 6px;font:" + P.tw + " 24px/1.1 " + P.title + ";color:" + P.ink + "}"
    + ".cb-p{margin:0 0 16px;font-size:15px;line-height:1.5;color:" + P.mute + "}"
    + ".cb-p a{color:" + P.ink + ";text-decoration:underline;text-underline-offset:.2em}"
    + ".cb-r{display:grid;grid-template-columns:1fr 1fr;gap:10px}"
    + ".cb-b{min-height:48px;padding:0 16px;border:0;border-radius:" + P.r + ";background:" + P.btn + ";color:" + P.btnInk + ";font:600 16px/1 " + P.body + ";cursor:pointer}"
    + ".cb-b:hover{background:" + P.btnHover + "}"
    + ".cb :focus-visible{outline:3px solid " + P.ring + ";outline-offset:3px}"
    + "@media(min-width:760px){.cb{left:24px;right:auto;bottom:24px;margin:0}}"
    + "@media(prefers-reduced-motion:reduce){.cb,.cb.is-on{transition:none}}";
  var box = null;
  function build() {
    if (box) return box;
    var st = document.createElement("style");
    st.textContent = css;
    document.head.appendChild(st);
    box = document.createElement("div");
    box.className = "cb";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-labelledby", "cb-t");
    box.setAttribute("aria-describedby", "cb-p");
    box.innerHTML = '<h2 class="cb-t" id="cb-t">Can we count your visit?</h2>'
      + '<p class="cb-p" id="cb-p">Google Analytics shows us which pages help travellers and which do not. It sets a cookie and never receives your name, hotel or phone number. If you decline, nothing is sent. <a href="/privacy/#cookies">Privacy</a></p>'
      + '<div class="cb-r"><button class="cb-b" type="button" data-choice="granted">Accept</button><button class="cb-b" type="button" data-choice="denied">Decline</button></div>';
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-choice]");
      if (!b) return;
      write(b.getAttribute("data-choice"));
      apply(b.getAttribute("data-choice"));
      box.classList.remove("is-on");
    });
    document.body.appendChild(box);
    return box;
  }
  function show(focus) {
    var b = build();
    requestAnimationFrame(function () {
      b.classList.add("is-on");
      if (focus) b.querySelector("[data-choice]").focus();
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
