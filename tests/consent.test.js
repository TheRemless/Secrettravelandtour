// Consentement et Google Analytics 4 (12.11.2026) : rien ne part avant « Accept », deux choix aussi visibles l'un que l'autre,
// un seul événement sans donnée personnelle, lien « Cookie settings » partout, /privacy/ à jour. Lancer le build avant (lecture de _site/).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const SITE = path.join(ROOT, "_site");
const site = require("../src/_data/site.json");
const JS = fs.readFileSync(path.join(ROOT, "src", "js", "consent.js"), "utf8");
const pages = () => {
  const out = [];
  const walk = (d, rel) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) { if (!rel && /^(_v4|design|docs|src|_site|img|css|js|images|data)$/.test(e.name)) continue; walk(path.join(d, e.name), rel + "/" + e.name); }
      else if (e.name === "index.html" || (!rel && e.name === "404.html")) out.push(path.join(d, e.name));
    }
  };
  walk(SITE, "");
  return out;
};

test("identifiant de mesure : le flux de ce site, dans site.json", () => {
  assert.equal(site.analytics.ga4, "G-TH3QSF8359");
  assert.equal(site.analytics.clarity, "zel11glw7x");
});

test("chaque page publique charge consent.js (différé, identifiant de site.json) et porte le lien « Cookie settings »", () => {
  const all = pages();
  assert.ok(all.length > 40, String(all.length));
  for (const f of all) {
    const h = fs.readFileSync(f, "utf8");
    assert.match(h, /<script defer(?:="")? src="\/js\/consent\.js\?v=[^"]+" data-ga-id="G-TH3QSF8359" data-clarity-id="zel11glw7x"><\/script>/, f);
    assert.match(h, /data-consent-open/, `${f} : lien « Cookie settings »`);
    // Aucun autre script de suivi, aucun appel direct à Google dans le HTML.
    assert.doesNotMatch(h, /googletagmanager|google-analytics|gtag\(|clarity\.ms|clarity\(/, f);
  }
});

test("consent.js : refus par défaut (Consent Mode v2), gtag.js chargé seulement après « Accept », publicité toujours refusée", () => {
  assert.match(JS, /gtag\("consent", "default", DENIED\)/);
  assert.match(JS, /var DENIED = \{ analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" \}/);
  assert.match(JS, /var GRANTED = \{ analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" \}/);
  // Un seul endroit crée une balise script (inject), pour googletagmanager.com et clarity.ms seulement.
  assert.equal((JS.match(/createElement\("script"\)/g) || []).length, 1);
  assert.equal((JS.match(/https:\/\/[a-z.]+/g) || []).filter((u) => !/www\.googletagmanager\.com|www\.clarity\.ms|privacy\.microsoft/.test(u)).length, 0);
  assert.match(JS, /inject\("https:\/\/www\.googletagmanager\.com\/gtag\/js\?id="/);
  assert.match(JS, /inject\("https:\/\/www\.clarity\.ms\/tag\/" \+ encodeURIComponent\(CLARITY_ID\)\)/);
  // load() et loadClarity() ne sont appelées que depuis apply() quand le choix est « granted ».
  assert.equal((JS.match(/\bload\(\);/g) || []).length, 1);
  assert.equal((JS.match(/\bloadClarity\(\);/g) || []).length, 1);
  assert.match(JS, /if \(on\) \{\s*if \(loaded\) gtag\("consent", "update", GRANTED\);\s*load\(\);\s*loadClarity\(\);/);
  // Clarity : publicité refusée, analytique accordée ; au retrait, tout refusé, arrêt, cookies effacés.
  assert.match(JS, /clarity\("consentv2", \{ ad_Storage: "denied", analytics_Storage: "granted" \}\)/);
  assert.match(JS, /clarity\("consentv2", \{ ad_Storage: "denied", analytics_Storage: "denied" \}\);\s*clarity\("stop"\)/);
  assert.match(JS, /_clck\$\|_clsk\$/);
  // Choix gardé dans localStorage, pas dans un cookie.
  assert.doesNotMatch(JS, /document\.cookie\s*=\s*"?stt/);
});

test("bandeau (17.11.2026) : texte court, « Accept » principal, « No thanks » visible, lisible et à un appui (CNIL, EDPB)", () => {
  // Ordre du DOM = ordre visuel (No thanks puis Accept) : la tabulation suit ce que l'on voit.
  assert.match(JS, /<button class="cb-b cb-no" type="button" data-choice="denied">No thanks<\/button><button class="cb-b cb-yes" type="button" data-choice="granted">Accept<\/button>/);
  // Même hauteur pour les deux (44 px au moins), même endroit, même étape : aucun refus caché ni plus difficile.
  assert.equal((JS.match(/\.cb-b\{/g) || []).length, 1);
  assert.match(JS, /\.cb-b\{min-height:44px;/);
  assert.doesNotMatch(JS, /\.cb-no\{[^}]*(?:display:none|visibility:hidden|opacity:0|font-size:1[0-2]px|min-height:[0-3]\d?px)/);
  // Hiérarchie : Accept plein et plus large ; No thanks en contour, texte de la couleur du texte du bandeau.
  assert.match(JS, /\.cb-r\{display:grid;grid-template-columns:auto 1fr;/);
  assert.match(JS, /"\.cb-no\{background:transparent;color:" \+ P\.ink \+ ";border:1\.5px solid " \+ P\.no \+ "\}"/);
  assert.match(JS, /"\.cb-yes\{background:" \+ P\.btn \+ ";color:" \+ P\.btnInk/);
  // Accept reçoit le focus quand le visiteur rouvre le choix (Cookie settings).
  assert.match(JS, /if \(focus\) b\.querySelector\('\[data-choice="granted"\]'\)\.focus\(\);/);
  // Texte court et vrai ; le détail reste sur /privacy/.
  assert.match(JS, /<strong class="cb-t" id="cb-t">Help us improve this site\?<\/strong> We use cookies to see which pages help travellers and how they are used\. <a href="\/privacy\/#cookies">Privacy<\/a>/);
  const markup = JS.slice(JS.indexOf("box.innerHTML"), JS.indexOf("box.addEventListener"));
  assert.doesNotMatch(markup, /mouse movement|never receive|Can we count|Decline|Google|Microsoft/);
  // Jamais sur la barre de réservation ni sur le bandeau de Gestion ; un seul mouvement, coupé si l'on réduit les animations.
  assert.match(JS, /querySelectorAll\("\.dock, \.vbar, \.site-notice--bottom, \.tl-dock"\)/);
  assert.match(JS, /@media\(prefers-reduced-motion:reduce\)\{\.cb,\.cb\.is-on\{transition:none\}\}/);
});

// Contraste AA des deux boutons et du texte, dans les deux marques (WCAG : 4,5:1 texte, 3:1 contour).
function lum(hex) {
  const c = hex.replace("#", "").match(/../g).map((x) => parseInt(x, 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
test("bandeau : contrastes AA dans les deux marques", () => {
  const pal = [...JS.matchAll(/\{ bg: "(#[0-9A-F]{6})", ink: "(#[0-9A-F]{6})", mute: "(#[0-9A-F]{6})", line: "[^"]+", no: "(#[0-9A-F]{6})", noHover: "#[0-9A-F]{6}", btn: "(#[0-9A-F]{6})", btnInk: "(#[0-9A-F]{6})"/g)];
  assert.equal(pal.length, 2, "Secret et VIP");
  for (const [, bg, ink, mute, no, btn, btnInk] of pal) {
    assert.ok(ratio(ink, bg) >= 4.5, "texte " + bg);
    assert.ok(ratio(mute, bg) >= 4.5, "texte secondaire " + bg);
    assert.ok(ratio(btnInk, btn) >= 4.5, "Accept " + btn);
    assert.ok(ratio(no, bg) >= 3, "contour de No thanks " + bg);
  }
});

test("événements (16.11.2026) : tous passent par track(), qui ne part qu'après « Accept », sans donnée personnelle", () => {
  // Un seul appel direct à gtag("event"), dans track(), gardé par le consentement.
  assert.equal((JS.match(/gtag\("event"/g) || []).length, 1);
  assert.match(JS, /function track\(name, params\) \{\s*if \(!on\) return;\s*if \(loaded\) gtag\("event", name, params\);\s*if \(clarityOn && CLARITY_EVENTS\[name\]\)/);
  assert.match(JS, /var CLARITY_EVENTS = \{ booking_open: 1, booking_send: 1, whatsapp_click: 1, whatsapp_qr_shown: 1, whatsapp_desktop_open: 1 \}/);
  for (const ev of ["whatsapp_click", "booking_open", "booking_send", "send_on_whatsapp", "cta_click", "contact_click"]) assert.match(JS, new RegExp(`track\\("${ev}"`), ev);
  // L'ancien événement garde sa forme : le seul type de produit.
  assert.match(JS, /track\("send_on_whatsapp", \{ product_type: src\.variant \|\| "unknown" \}\)/);
  // Un seul écouteur de clic pour la mesure (plus celui du bandeau), délégué sur document.
  assert.equal((JS.match(/document\.addEventListener\("click"/g) || []).length, 2);
  // Rien de ce que le visiteur écrit : aucun champ de formulaire lu.
  assert.doesNotMatch(JS, /\.value\b|elements\.|FormData|hotel:|phone:|pickup|name:/);
  // booking_send ne reçoit pas le champ technique « variant ».
  assert.match(JS, /if \(k !== "variant"\) d\[k\] = src\[k\]/);
});

test("/privacy/ : ce qui est mesuré, durée, comment changer d'avis, Google Analytics parmi les services", () => {
  const h = fs.readFileSync(path.join(SITE, "privacy", "index.html"), "utf8");
  assert.match(h, /<h2 id="cookies">3\. Cookies and statistics<\/h2>/);
  assert.match(h, /Google Analytics 4 and sees how its pages are used with Microsoft Clarity, but only if you accept/);
  assert.match(h, /Everything you type in a form is masked before it leaves your device/);
  assert.match(h, /<code>_clck<\/code> and <code>_clsk<\/code>/);
  assert.match(h, /href="https:\/\/privacy\.microsoft\.com\/privacystatement"/);
  assert.match(h, /Clarity stops recording and the Google Analytics and Clarity cookies are removed/);
  assert.match(h, /Send on WhatsApp/);
  assert.match(h, /the buttons and links you tap on our pages and where they sit on the page/);
  assert.match(h, /the option you chose, the number of people and the estimated price/);
  assert.match(h, /We do not record your name, phone number, hotel, dates or the message itself/);
  assert.match(h, /up to 2 years/);
  assert.match(h, /for 6 months, then we ask again/);
  assert.match(h, /“Cookie settings” at the bottom of any page/);
  assert.match(h, /Google Analytics measures visits, only if you accept/);
  assert.match(h, /Last updated: 17 November 2026/);
  assert.doesNotMatch(h, /uses no cookies, no audience measurement/);
});

test("aucune politique de sécurité ne bloque googletagmanager.com", () => {
  const toml = fs.readFileSync(path.join(ROOT, "netlify.toml"), "utf8");
  assert.doesNotMatch(toml, /Content-Security-Policy/i);
  for (const h of [path.join(ROOT, "src", "_headers"), path.join(SITE, "_headers")]) if (fs.existsSync(h)) assert.doesNotMatch(fs.readFileSync(h, "utf8"), /Content-Security-Policy/i, h);
  for (const f of pages()) assert.doesNotMatch(fs.readFileSync(f, "utf8"), /http-equiv="Content-Security-Policy"/i, f);
});
