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

test("prix : affichés sur les pages qui en ont, jamais dans les données structurées, jamais de net ni de commission", () => {
  const pages = require("../src/_data/secretPages.js")();
  const withPrices = pages.pages.filter((p) => p.prices && p.prices.length);
  // 4 Islands, sanctuaire et location sont refaits à l'étape 3 (src/pages/) : vérifiés plus bas.
  assert.ok(withPrices.length >= 9, String(withPrices.length));
  for (const id of ["4-islands", "elephant-sanctuary"]) {
    const doc = fs.readFileSync(path.join(site, "tours", id, "index.html"), "utf8");
    assert.match(doc, /id="h-prices"/, id);
    for (const m of doc.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) assert.doesNotMatch(m[1], /"price"|priceCurrency/, id);
  }
  for (const p of withPrices) {
    const doc = fs.readFileSync(path.join(site, "tours", p.id, "index.html"), "utf8");
    assert.match(doc, /id="h-prices"/, p.id);
    for (const g of p.prices) for (const r of g.rows) assert.match(r.price, /^(\+?[\d,]+( or [\d,]+)? THB|Free|\d+% off)$/, `${p.id} : ${r.label}`);
    assert.match(doc, />Book now</, p.id);
    assert.doesNotMatch(JSON.stringify(p.jsonLd), /"price"|priceCurrency/, p.id);
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
  assert.match(speed, /href="\/\?transfer=speedboat#tell-us"/);
  assert.doesNotMatch(speed, /\d\s?THB/);
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

test("galeries : chaque photo citée existe, avec un texte alternatif, et s'affiche sur sa page", () => {
  const pages = require("../src/_data/secretPages.js")();
  const withGallery = pages.pages.filter((p) => p.gallery && p.gallery.length);
  assert.ok(withGallery.length >= 8, String(withGallery.length));
  for (const p of withGallery) {
    const doc = fs.readFileSync(path.join(site, "tours", p.id, "index.html"), "utf8");
    for (const g of p.gallery) {
      assert.ok(fs.existsSync(path.join(site, "images", "secret", "gallery", g.src)), `${p.id} : ${g.src}`);
      assert.ok(g.alt.length > 15, `${p.id} : alt`);
      assert.ok(doc.includes(`/images/secret/gallery/${g.src}`), `${p.id} : ${g.src} absent de la page`);
    }
  }
});
