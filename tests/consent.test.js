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
});

test("chaque page publique charge consent.js (différé, identifiant de site.json) et porte le lien « Cookie settings »", () => {
  const all = pages();
  assert.ok(all.length > 40, String(all.length));
  for (const f of all) {
    const h = fs.readFileSync(f, "utf8");
    assert.match(h, /<script defer(?:="")? src="\/js\/consent\.js\?v=[^"]+" data-ga-id="G-TH3QSF8359"><\/script>/, f);
    assert.match(h, /data-consent-open/, `${f} : lien « Cookie settings »`);
    // Aucun autre script de suivi, aucun appel direct à Google dans le HTML.
    assert.doesNotMatch(h, /googletagmanager|google-analytics|gtag\(/, f);
  }
});

test("consent.js : refus par défaut (Consent Mode v2), gtag.js chargé seulement après « Accept », publicité toujours refusée", () => {
  assert.match(JS, /gtag\("consent", "default", DENIED\)/);
  assert.match(JS, /var DENIED = \{ analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" \}/);
  assert.match(JS, /var GRANTED = \{ analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" \}/);
  // Un seul endroit crée la balise gtag.js, et seulement depuis googletagmanager.com.
  assert.equal((JS.match(/createElement\("script"\)/g) || []).length, 1);
  assert.equal((JS.match(/https:\/\/[a-z.]+/g) || []).filter((u) => !/googletagmanager\.com/.test(u)).length, 0);
  assert.match(JS, /s\.src = "https:\/\/www\.googletagmanager\.com\/gtag\/js\?id="/);
  // load() n'est appelée que depuis apply() quand le choix est « granted ».
  assert.equal((JS.match(/\bload\(\);/g) || []).length, 1);
  assert.match(JS, /if \(on\) load\(\);/);
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

test("un seul événement, « send_on_whatsapp », avec le seul type de produit", () => {
  assert.equal((JS.match(/gtag\("event"/g) || []).length, 1);
  assert.match(JS, /gtag\("event", "send_on_whatsapp", \{ product_type: type \}\)/);
  assert.deepEqual(Object.keys({ product_type: 1 }), ["product_type"]);
  const call = JS.match(/gtag\("event"[^;]*;/)[0];
  assert.doesNotMatch(call, /hotel|phone|pickup|date|name/i);
});

test("/privacy/ : ce qui est mesuré, durée, comment changer d'avis, Google Analytics parmi les services", () => {
  const h = fs.readFileSync(path.join(SITE, "privacy", "index.html"), "utf8");
  assert.match(h, /<h2 id="cookies">3\. Cookies and statistics<\/h2>/);
  assert.match(h, /Google Analytics 4, but only if you accept/);
  assert.match(h, /Send on WhatsApp/);
  assert.match(h, /We do not record your name, phone number, hotel, dates or the message itself/);
  assert.match(h, /up to 2 years/);
  assert.match(h, /for 6 months, then we ask again/);
  assert.match(h, /“Cookie settings” at the bottom of any page/);
  assert.match(h, /Google Analytics measures visits, only if you accept/);
  assert.match(h, /Last updated: 12 November 2026/);
  assert.doesNotMatch(h, /uses no cookies, no audience measurement/);
});

test("aucune politique de sécurité ne bloque googletagmanager.com", () => {
  const toml = fs.readFileSync(path.join(ROOT, "netlify.toml"), "utf8");
  assert.doesNotMatch(toml, /Content-Security-Policy/i);
  for (const h of [path.join(ROOT, "src", "_headers"), path.join(SITE, "_headers")]) if (fs.existsSync(h)) assert.doesNotMatch(fs.readFileSync(h, "utf8"), /Content-Security-Policy/i, h);
  for (const f of pages()) assert.doesNotMatch(fs.readFileSync(f, "utf8"), /http-equiv="Content-Security-Policy"/i, f);
});
