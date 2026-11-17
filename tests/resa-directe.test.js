// Envoi direct sur WhatsApp (plus d'écran d'aperçu) et mesure des clics (Jérémy, 16.11.2026).
// Lancer le build avant (lecture de _site/).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const B = require("../src/js/booking.js");

const ROOT = path.join(__dirname, "..");
const SITE = path.join(ROOT, "_site");
const read = (rel) => fs.readFileSync(path.join(SITE, rel, "index.html"), "utf8");
const bookData = (rel) => JSON.parse(read(rel).match(/id="book-data">([\s\S]*?)<\/script>/)[1]);
const publicPages = () => {
  const out = [];
  const walk = (d, rel) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) { if (!rel && /^(_v4|_site|_components|design|docs|src|img|css|js|images|data)$/.test(e.name)) continue; walk(path.join(d, e.name), rel + "/" + e.name); }
      else if (e.name === "index.html" || (!rel && e.name === "404.html")) out.push(path.join(d, e.name));
    }
  };
  walk(SITE, "");
  return out;
};

// Une page par variante de la feuille, des deux marques.
const SHEETS = ["tours/4-islands", "tours/atv", "tours/rental", "tours/speedboat", "transfers", "taxi", "taxi/krabi-airport-koh-lanta", "taxi/koh-lanta-krabi-day-trip", "taxi/songthaew"];

test("feuille : plus d'écran d'aperçu, le bouton du formulaire envoie sur WhatsApp, une ligne dit ce qui se passe", () => {
  for (const rel of SHEETS) {
    const h = read(rel);
    assert.doesNotMatch(h, /data-screen="preview"|Preview message|data-send\b|data-edit\b|class="slip/, rel);
    const btn = h.match(/<button class="sheet-btn" type="submit"[^>]*>([\s\S]*?)<\/button>/);
    assert.ok(btn, rel);
    assert.match(btn[0], /aria-describedby="book-send-note"/, rel);
    assert.match(btn[1], /<svg[\s\S]*<span>Send on WhatsApp<\/span>/, rel);
    assert.match(h, /<p class="sheet-note sheet-note--send" id="book-send-note">WhatsApp opens with your message\. You can change it there before you send\.<\/p>/, rel);
    // L'écran « done » reste : WhatsApp à rouvrir, message à copier.
    assert.match(h, /data-screen="done"/, rel);
    assert.match(h, /data-again(?:="")? data-track="sheet_retry"/, rel);
  }
  assert.match(read("taxi"), /<html[^>]*data-brand="vip"/);
});

test("booking.js : WhatsApp s'ouvre depuis l'envoi du formulaire, repli dans l'onglet si la fenêtre est refusée", () => {
  const js = fs.readFileSync(path.join(ROOT, "src", "js", "booking.js"), "utf8");
  const submit = js.slice(js.indexOf('form.addEventListener("submit"'), js.indexOf("// « Add to my trip list »"));
  assert.match(submit, /window\.open\(url, "_blank"\)/);
  assert.match(submit, /if \(!win\) \{ window\.location\.href = url; return; \}/);
  // Pas d'attente entre l'appui et l'ouverture (sinon Safari bloque la fenêtre).
  assert.doesNotMatch(submit, /setTimeout|then\(|await/);
  assert.doesNotMatch(js, /renderSlip|show\("preview"\)|data-send|dataLayer/);
});

test("trackInfo : produit, variante, option, personnes et total estimé, rien de ce que le visiteur écrit", () => {
  const today = "2026-11-03";
  const tour = bookData("tours/4-islands");
  const st = Object.assign(B.emptyState(tour), { today, option: "join-in-longtail", dateChoice: "tomorrow", adults: 2, childAges: [], pickup: "Some Hotel", name: "Anna" });
  const t = B.trackInfo(tour, st);
  assert.deepEqual(Object.keys(t).sort(), ["currency", "option_id", "people", "product_id", "product_type", "value"]);
  assert.equal(t.product_id, "4-islands");
  assert.equal(t.product_type, "tour");
  assert.equal(t.option_id, "join-in-longtail");
  assert.equal(t.people, 2);
  assert.equal(t.currency, "THB");
  assert.equal(t.value, 2000);
  assert.doesNotMatch(JSON.stringify(t), /Anna|Some Hotel|2026/);

  const route = bookData("taxi/krabi-airport-koh-lanta");
  const r = B.trackInfo(route, Object.assign(B.emptyState(route), { adults: 3, childAges: [5], pickupAt: "KBV", name: "Anna" }));
  assert.deepEqual(r, { product_id: "taxi-krabi-airport-koh-lanta", product_type: "taxi", option_id: "", people: 4, value: 2300, currency: "THB" });
  // Plus de 8 personnes : deux véhicules, le prix d'appel ne vaut plus, aucune valeur.
  assert.equal(B.trackInfo(route, Object.assign(B.emptyState(route), { adults: 9 })).value, undefined);

  assert.equal(B.trackInfo(bookData("taxi/koh-lanta-krabi-day-trip"), B.emptyState({})).product_type, "day_trip");
  assert.equal(B.trackInfo(bookData("taxi/songthaew"), B.emptyState({})).product_type, "songthaew");
  assert.equal(B.trackInfo(bookData("transfers"), B.emptyState({})).product_type, "shared_minivan");
  assert.equal(B.trackInfo(bookData("taxi"), B.emptyState({})).product_type, "taxi");
  const sb = bookData("tours/speedboat");
  assert.deepEqual(B.trackInfo(sb, Object.assign(B.emptyState(sb), { route: "lanta-phi-phi", adults: 2 })), { product_id: "speedboat-ferry", product_type: "speedboat", option_id: "lanta-phi-phi", people: 2 });
  // Karts : les compteurs disent qui vient, aucun nombre de personnes envoyé.
  const kart = bookData("tours/go-kart");
  const kOpt = kart.options.find((o) => o.counts);
  assert.ok(kOpt);
  assert.equal(B.trackInfo(kart, Object.assign(B.emptyState(kart), { option: kOpt.id })).people, undefined);
  const rent = bookData("tours/rental");
  const rt = B.trackInfo(rent, Object.assign(B.emptyState(rent), { option: rent.options[0].id, vehicles: 2 }));
  assert.equal(rt.product_type, "rental");
  assert.equal(rt.vehicles, 2);
  assert.equal(rt.people, undefined);
});

test("chaque lien WhatsApp public porte son emplacement (data-track), sur l'élément lui-même", () => {
  const seen = new Set();
  for (const f of publicPages()) {
    const h = fs.readFileSync(f, "utf8");
    for (const m of h.matchAll(/<a\b[^>]*href="https:\/\/(?:wa\.me|api\.whatsapp\.com)[^"]*"[^>]*>/g)) {
      const tr = /data-track="([a-z_]+)"/.exec(m[0]);
      assert.ok(tr, `${f} : ${m[0].slice(0, 120)}`);
      seen.add(tr[1]);
    }
  }
  for (const p of ["header", "menu", "footer", "hero", "hero_ask", "dock", "sticky_bar", "price_calculator", "end_band", "other_route", "sheet_retry"]) assert.ok(seen.has(p), p);
});

test("liste de sorties : envoi mesuré après la validation, lien marqué", () => {
  const js = fs.readFileSync(path.join(ROOT, "src", "js", "v4-trips.js"), "utf8");
  assert.match(js, /data-tsend data-track="trip_list"/);
  const i = js.indexOf('send.href = B.waUrl(text);'), j = js.indexOf('"stt-trips-send"');
  assert.ok(i > 0 && j > i);
  assert.doesNotMatch(js.slice(j, j + 300), /pickup|name|date/i);
});

test("Clarity : chaque champ où l'on écrit est masqué, les choix restent lisibles", () => {
  for (const f of publicPages()) {
    const h = fs.readFileSync(f, "utf8");
    for (const m of h.matchAll(/<input\b[^>]*>/g)) {
      const typed = /type="(?:text|date|time|email|tel|search)"/.test(m[0]);
      if (typed) assert.match(m[0], /data-clarity-mask="True"/, `${f} : ${m[0].slice(0, 100)}`);
      else assert.doesNotMatch(m[0], /data-clarity-mask/, `${f} : choix masqué ${m[0].slice(0, 100)}`);
    }
    assert.doesNotMatch(h, /<textarea\b(?![^>]*data-clarity-mask="True")/, f);
    // Âges des enfants (modèle de la feuille).
    if (/id="book-age-tpl"/.test(h)) assert.match(h, /<select data-clarity-mask="True"><option value="">Age<\/option>/, f);
  }
  const trips = fs.readFileSync(path.join(ROOT, "src", "js", "v4-trips.js"), "utf8");
  for (const re of [/<input data-clarity-mask="True" id="tl-name"/, /<input data-clarity-mask="True" id="tl-pickup"/, /<input data-clarity-mask="True" type="date"/, /<select data-clarity-mask="True" id="tl-age-/, /data-tmsg data-clarity-mask="True"/]) assert.match(trips, re);
  assert.match(fs.readFileSync(path.join(ROOT, "src", "js", "v4-product.js"), "utf8"), /<select data-clarity-mask="True" data-age=/);
  // Hub taxi : le titre de la feuille reprend les lieux écrits.
  assert.match(read("taxi"), /id="book-title"[^>]*data-clarity-mask="True"/);
  assert.doesNotMatch(read("taxi/krabi-airport-koh-lanta"), /id="book-title"[^>]*data-clarity-mask/);
});
