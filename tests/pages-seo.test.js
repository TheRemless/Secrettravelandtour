// Pages /tours/<id>/ et /taxi/<route>/ (option A du chantier SEO, 30.10.2026) :
// balises, données structurées sans prix ni avis, sitemap et liens croisés.
// Lancer `npm run build` avant (lecture de _site/).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
// Fiches produit /tours/<slug>/ du design v4 (08.11.2026) : lues dans products/**, la source des pages.
const P = (rel) => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "src/_data/products", rel + ".json"), "utf8"));
const PRODUCTS = ["tours/4-islands", "tours/koh-rok-koh-haa", "tours/koh-phi-phi", "tours/mangroves", "tours/fishing-trip", "tours/sunset-dinner-raft", "tours/sunrise-raft", "activities/mangrove-kayaking", 
  "activities/elephant-sanctuary", "activities/kayak", "activities/cooking-class", "activities/scuba-diving", "activities/atv", "activities/batik", "activities/go-kart",
  "rental", "secret-transfers/speedboat-ferry"].map(P);
const ldOf = (doc) => [...doc.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
// Les 17 trajets taxi sur un seul gabarit (refonte taxi v1, 10.11.2026) : taxiPages.js.
const taxiRoutes = require("../src/_data/taxiPages.js")();

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
const html = (url) => read(path.join("_site", url, "index.html"));

// La 4 Islands garde son titre validé avec le prix d'appel (v4data.js), contrôlé par design-v4.test.js.
const all = PRODUCTS.filter((p) => p.slug !== "4-islands").map((p) => ({ url: p.url.replace(/^\/|\/$/g, ""), title: p.seo.title, desc: p.seo.metaDescription, jsonLd: ldOf(html(p.url)) }))
  .concat(taxiRoutes.routes.map((r) => ({ url: `taxi/${r.id}`, title: r.seo.title, desc: r.seo.metaDescription, jsonLd: r.jsonLd })));

test("pages : au moins 9 excursions et 9 trajets", () => {
  assert.ok(PRODUCTS.length >= 9);
  assert.ok(taxiRoutes.routes.length >= 9);
});

test("pages : title de 60 caractères au plus, description de 120 à 160, un seul h1, canonical", () => {
  for (const p of all) {
    assert.ok(p.title.length <= 60, `${p.url} : title ${p.title.length}`);
    assert.ok(p.desc.length >= 120 && p.desc.length <= 160, `${p.url} : description ${p.desc.length}`);
    const doc = html(p.url);
    assert.equal((doc.match(/<h1[ >]/g) || []).length, 1, `${p.url} : h1`);
    assert.match(doc, new RegExp(`<link rel="canonical" href="https://secrettravelandtour.com/${p.url}/">`));
    assert.match(doc, /<meta name="robots" content="index, follow/);
    assert.equal(decode(doc.match(/<title>(.*?)<\/title>/)[1]), p.title);
  }
});

test("pages : aucun prix, aucune note, aucun avis dans les données structurées", () => {
  for (const p of all) {
    const text = JSON.stringify(p.jsonLd);
    assert.doesNotMatch(text, /"price"|aggregateRating|reviewCount|ratingValue/, p.url);
  }
});

// Depuis le 10.11.2026, un trajet affiche le prix d'appel de la grille VIP Taxi Lanta s'il en a un, et rien d'autre.
test("pages taxi : prix d'appel seulement s'il est dans la grille, ni téléphone ni e-mail", () => {
  for (const r of taxiRoutes.routes) {
    const doc = html(`taxi/${r.id}`);
    if (r.price) assert.match(doc, new RegExp(r.price.label), `${r.id} : prix`);
    else assert.match(doc, /<p class="hero-note">Price on WhatsApp\.<\/p>/, `${r.id} : sans prix, WhatsApp`);
    assert.doesNotMatch(doc, /tel:|mailto:/, `${r.id} : contact direct`);
    // Depuis la refonte taxi v1, chaque trajet réserve par la feuille, avec un repli WhatsApp qui nomme le trajet.
    assert.match(doc, /<dialog class="sheet" id="book"/, `${r.id} : feuille`);
    assert.match(doc, /data-book="/, `${r.id} : bouton qui ouvre la feuille`);
    assert.match(doc, new RegExp(`href="https://wa\\.me/66958683846\\?text=Transfer%20request%3A%20${encodeURIComponent(r.from + " to " + r.to)}"`), `${r.id} : repli WhatsApp`);
  }
});

// Depuis la v4, plus de formulaire sur l'accueil : chaque fiche a sa feuille de réservation et un repli WhatsApp
// qui nomme déjà le produit, sans l'adresse de la page (10.11.2026).
test("pages secret : feuille de réservation, repli WhatsApp prérempli et JSON-LD", () => {
  for (const p of PRODUCTS) {
    const doc = html(p.url);
    assert.match(doc, /<dialog class="sheet" id="book"/, `${p.slug} : feuille`);
    assert.match(doc, /data-book="/, `${p.slug} : bouton qui ouvre la feuille`);
    const fallbacks = [...doc.matchAll(/href="https:\/\/wa\.me\/66958683846\?text=((?:Booking|Rental|Speedboat)%20request[^"]*)"/g)].map((m) => decodeURIComponent(m[1]));
    assert.ok(fallbacks.length > 0, `${p.slug} : repli`);
    for (const f of fallbacks) assert.doesNotMatch(f, /Ref:|Page:|secrettravelandtour\.com/, `${p.slug} : repli sans page`);
    assert.match(doc, /application\/ld\+json/, `${p.slug} : JSON-LD`);
  }
});

test("pages taxi : le service n'est jamais présenté comme limité au départ de Koh Lanta", () => {
  for (const r of taxiRoutes.routes) {
    const doc = html(`taxi/${r.id}`);
    assert.doesNotMatch(doc, /only (drive|from) Koh Lanta|from Koh Lanta only/i, r.id);
  }
});

test("sitemap : chaque page listée une seule fois", () => {
  const sitemap = read("_site/sitemap.xml");
  for (const p of all) {
    const hits = sitemap.match(new RegExp(`<loc>https://secrettravelandtour\\.com/${p.url}/</loc>`, "g")) || [];
    assert.equal(hits.length, 1, p.url);
  }
});

test("liens croisés : l'accueil mène aux pages d'excursion, /taxi/ aux pages de trajet", () => {
  const secret = fs.readFileSync(path.join(root, "_site", "index.html"), "utf8");
  for (const p of PRODUCTS) assert.match(secret, new RegExp(`href="${p.url}"`), p.slug);
  const taxi = html("taxi");
  for (const r of taxiRoutes.routes) assert.match(taxi, new RegExp(`href="/taxi/${r.id}/"`), r.id);
  // Pas de bloc « Popular private transfers » ni de pastilles sur /taxi/ (refus de Jérémy, 28.10.2026).
  assert.doesNotMatch(taxi, /Popular private transfers/);
});

test("taxi.json : les trajets cités par les services existent", () => {
  const taxi = require("../src/_data/taxi.json");
  for (const s of taxi.services) for (const id of s.routes || []) assert.ok(taxiRoutes.byId[id], id);
});
