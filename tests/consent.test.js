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

test("bandeau : « Accept » et « Decline » de même taille et de même style, texte en anglais, lien vers la politique", () => {
  assert.match(JS, /data-choice="granted">Accept<\/button><button class="cb-b" type="button" data-choice="denied">Decline<\/button>/);
  // Une seule règle de bouton pour les deux : aucun style propre à l'un des deux choix.
  assert.doesNotMatch(JS, /data-choice=\\?"?(granted|denied)\\?"?\]\s*\{/);
  assert.equal((JS.match(/\.cb-b\{/g) || []).length, 1);
  assert.match(JS, /min-height:48px/);
  assert.match(JS, /href="\/privacy\/#cookies"/);
  assert.match(JS, /If you decline, nothing is sent/);
  assert.match(JS, /Can we count your visit\?/);
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
  assert.match(h, /Last updated: 16 November 2026/);
  assert.doesNotMatch(h, /uses no cookies, no audience measurement/);
});

test("aucune politique de sécurité ne bloque googletagmanager.com", () => {
  const toml = fs.readFileSync(path.join(ROOT, "netlify.toml"), "utf8");
  assert.doesNotMatch(toml, /Content-Security-Policy/i);
  for (const h of [path.join(ROOT, "src", "_headers"), path.join(SITE, "_headers")]) if (fs.existsSync(h)) assert.doesNotMatch(fs.readFileSync(h, "utf8"), /Content-Security-Policy/i, h);
  for (const f of pages()) assert.doesNotMatch(fs.readFileSync(f, "utf8"), /http-equiv="Content-Security-Policy"/i, f);
});
