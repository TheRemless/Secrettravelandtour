// Aucun nom de prestataire sur le site (sinon les clients réservent en direct sans passer par Secret),
// la plongée détaille ses niveaux et la date est obligatoire dans les deux formulaires.
// Lancer `npm run build` avant (lecture de _site/).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const site = path.join(__dirname, "..", "_site");

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return htmlFiles(full);
    return /\.(html|xml|txt)$/.test(e.name) ? [full] : [];
  });
}

// VIP Taxi Lanta est la marque de transferts assumée sur le site, elle n'est donc pas dans cette liste.
const PARTENAIRES = /rattana|lacha ?ru|sukho|lanta ?atv|atv adventure|lanta elephant|lanta longtail|lanta batik|lanta kayaking|lanta ?e-?gokart|noom|bundhaya|satun|pakbara|blue ?planet/i;

test("aucun nom de prestataire dans les pages générées", () => {
  const files = htmlFiles(site);
  assert.ok(files.length > 20);
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(text, PARTENAIRES, path.relative(site, file));
  }
});

test("aucun nom de prestataire dans les noms de fichiers d'images", () => {
  const images = fs.readdirSync(path.join(site, "images", "secret")).concat(fs.readdirSync(path.join(site, "images", "taxi")));
  for (const name of images) assert.doesNotMatch(name, PARTENAIRES, name);
});

test("plongée : une page avec les niveaux, de l'essai d'un jour aux cours avancés", () => {
  const doc = fs.readFileSync(path.join(site, "tours", "scuba-diving", "index.html"), "utf8");
  for (const level of ["Kids Scuba Explorer", "Basic Diver", "Open Water Diver", "Advanced Open Water Diver", "React Right", "Stress and Rescue Diver", "Deep Diver", "Nitrox"]) {
    assert.ok(doc.includes(level), level);
  }
  assert.match(doc, /Koh Haa or Koh Bida/);
  assert.match(doc, /medically fit/);
  assert.doesNotMatch(doc, /฿|CHF|€|per person\s*:?\s*\d/);
  const home = fs.readFileSync(path.join(site, "index.html"), "utf8");
  assert.match(home, /href="\/tours\/scuba-diving\/"/);
});

test("formulaires : la date est obligatoire, sur la feuille des pages refaites et sur /taxi/", () => {
  // Depuis l'étape 3, l'accueil n'a plus de formulaire : la feuille de réservation (booking.js) le remplace.
  const tour = fs.readFileSync(path.join(site, "tours", "4-islands", "index.html"), "utf8");
  const taxi = fs.readFileSync(path.join(site, "taxi", "index.html"), "utf8");
  const radios = (doc, name) => doc.match(new RegExp(`<input type="radio" name="${name}"[^>]*>`, "g")) || [];
  assert.equal(radios(tour, "dateChoice").length, 3);
  const booking = require("../src/js/booking.js");
  assert.equal(booking.validate({ variant: "tour", options: [] }, { today: "2026-11-03", adults: 2, childAges: [], pickup: "x", name: "A" }).date, "Pick a date.");
  const found = radios(taxi, "date_choice");
  assert.equal(found.length, 3);
  for (const tag of found) assert.match(tag, /\brequired\b/, tag);
});

// Pages v4 (08.11.2026) : les prix viennent de products/** ; la 4 Islands a son calculateur (id="h-prices"),
// les autres fiches leur section « Options and prices » (id="opt-h") avec un bouton par option.
test("prix : affichés sur les pages qui en ont, jamais dans les données structurées, jamais de net ni de commission", () => {
  const DATA = path.join(__dirname, "..", "src", "_data", "products");
  const withPrices = ["tours", "activities"].flatMap((d) => fs.readdirSync(path.join(DATA, d)).map((f) => require(path.join(DATA, d, f))))
    .concat([require(path.join(DATA, "rental.json"))]).filter((p) => (p.options || []).some((o) => (o.prices || []).length));
  assert.ok(withPrices.length >= 9, String(withPrices.length));
  const four = fs.readFileSync(path.join(site, "tours", "4-islands", "index.html"), "utf8");
  assert.match(four, /id="h-prices"/);
  for (const p of withPrices) {
    const doc = fs.readFileSync(path.join(site, p.url, "index.html"), "utf8");
    if (p.slug !== "4-islands") {
      assert.match(doc, /id="opt-h"/, p.slug);
      assert.match(doc, />(Choose this option|Ask for [^<]+)</, p.slug);
    }
    for (const o of p.options || []) for (const r of o.prices || []) {
      const shown = typeof r.amount === "number" ? (r.amount === 0 ? "Free" : Number(r.amount).toLocaleString("en-GB") + " THB") : r.text;
      assert.match(shown, /^(\+?[\d,]+( or [\d,]+)? THB|Free|\d+% off)$/, `${p.slug} : ${r.label}`);
    }
    for (const m of doc.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) assert.doesNotMatch(m[1], /"price"|priceCurrency/, p.slug);
  }
  const all = JSON.stringify(require("../src/_data/secretPagesContent.json")) + JSON.stringify(require("../src/_data/secret.json"));
  assert.doesNotMatch(all, /commission|net price|agent price|selling price|contract rate/i);
});

test("nouvelles pages : batik, karting, kayak, location et speedboat existent et sont dans le plan du site", () => {
  const sitemap = fs.readFileSync(path.join(site, "sitemap.xml"), "utf8");
  for (const id of ["batik", "go-kart", "kayak", "rental", "speedboat"]) {
    assert.ok(fs.existsSync(path.join(site, "tours", id, "index.html")), id);
    assert.match(sitemap, new RegExp(`/tours/${id}/`), id);
  }
  const speed = fs.readFileSync(path.join(site, "tours", "speedboat", "index.html"), "utf8");
  // Plus de formulaire d'accueil : chaque arrêt de la grille ouvre la feuille sur son trajet et son heure.
  assert.match(speed, /data-sb-route="to-koh-phi-phi" data-sb-dep="0900"/);
  // Aucun prix de billet (aucun dans les données) : ni dans le haut de page ni dans la grille. Les cartes des sorties
  // voisines, plus bas, gardent leur prix d'appel.
  assert.doesNotMatch(speed.split('aria-labelledby="rel-h"')[0], /\d\s?THB/);
  const home = fs.readFileSync(path.join(site, "index.html"), "utf8");
  assert.match(home, /href="\/tours\/speedboat\/"/);
});

test("formulaires : l'heure de prise en charge est marquée obligatoire", () => {
  const route = fs.readFileSync(path.join(site, "taxi", "krabi-airport-koh-lanta", "index.html"), "utf8");
  const taxi = fs.readFileSync(path.join(site, "taxi", "index.html"), "utf8");
  assert.match(route, /<input id="book-time"[^>]*aria-required="true"/);
  assert.match(taxi, /<input id="f-time"[^>]*aria-required="true"/);
});

test("photos : chaque excursion, activité et transfert a une photo qui existe, avec un texte alternatif", () => {
  const secret = require("../src/_data/secret.json");
  for (const item of secret.tours.concat(secret.activities, secret.transfers)) {
    assert.ok(item.photo, `${item.id} : photo`);
    assert.ok(fs.existsSync(path.join(site, "images", "secret", item.photo)), `${item.id} : ${item.photo}`);
    assert.ok(item.photoAlt && item.photoAlt.length > 15, `${item.id} : alt`);
  }
});

// Les anciennes galeries (secretPagesContent.json) restent des fichiers vérifiés ; depuis la v4, une fiche n'affiche
// que les photos de photos-v3.json (règle du design) : la photo de sa carte en haut de page, avec son texte alternatif.
test("galeries : chaque photo citée existe, avec un texte alternatif ; chaque fiche montre sa photo déclarée", () => {
  const content = require("../src/_data/secretPagesContent.json").pages;
  const withGallery = Object.entries(content).filter(([, p]) => p.gallery && p.gallery.length);
  assert.ok(withGallery.length >= 8, String(withGallery.length));
  for (const [id, p] of withGallery) {
    for (const g of p.gallery) {
      assert.ok(fs.existsSync(path.join(site, "images", "secret", "gallery", g.src)), `${id} : ${g.src}`);
      assert.ok(g.alt.length > 15, `${id} : alt`);
    }
  }
  const photos = require("../src/_data/photos-v3.json").photos;
  const CARD = { "koh-rok-koh-haa": "card-koh-rok", "koh-phi-phi": "card-koh-phi-phi", "koh-talabeng-koh-bubu": "card-talabeng", mangroves: "card-mangroves",
    "fishing-trip": "card-fishing", "elephant-sanctuary": "card-elephant", kayak: "card-kayak", "cooking-class": "card-cooking", "scuba-diving": "card-scuba",
    atv: "card-atv", batik: "card-batik", "go-kart": "card-go-kart" };
  for (const [slug, id] of Object.entries(CARD)) {
    const doc = fs.readFileSync(path.join(site, "tours", slug, "index.html"), "utf8");
    const ph = photos.find((x) => x.id === id);
    const hero = doc.split('class="phero__ph"')[1].split("</picture>")[0];
    assert.ok(hero.includes(`alt="${ph.alt.replace(/'/g, "&#39;")}"`), `${slug} : photo du haut`);
  }
});
