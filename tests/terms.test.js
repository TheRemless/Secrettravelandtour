// tests/terms.test.js : conditions de réservation propres à Secret Travel & Tour et VIP Taxi Lanta.
// Zwald garde ses CGV sur zwaldtravelplanner.com (décision de Jérémy du 02.11.2026).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const SRC = path.join(__dirname, "..", "src");
const read = (file) => fs.readFileSync(path.join(SRC, file), "utf8");

test("conditions : version anglaise seulement, non indexée, sans version française", () => {
  const en = read("terms.njk");
  assert.match(en, /permalink: \/terms\//);
  assert.match(en, /<meta name="robots" content="noindex, follow">/);
  assert.match(en, /Zwald Travel Planner Co\., Ltd\./);
  assert.doesNotMatch(en, /booking-terms/);
  for (const file of ["terms-fr.njk", "legal-fr.njk", "privacy-fr.njk"]) {
    assert.ok(!fs.existsSync(path.join(SRC, file)), file + " existe : rien de français sur ce site");
  }
});

test("conditions : liées depuis l'accueil, les pages /tours/ et les pages taxi, plus vers les CGV de Zwald", () => {
  for (const file of ["secret.njk", "secret-page.njk", "taxi.njk", "taxi-route.njk"]) {
    const page = read(file);
    assert.match(page, /href="\/terms\/"/, file + " ne renvoie pas vers /terms/");
    assert.doesNotMatch(page, /zwaldtravelplanner\.com\/cgv\//, file + " renvoie encore vers les CGV de Zwald");
  }
});

test("mentions légales et confidentialité propres au site, en anglais seulement", () => {
  const pages = { "legal.njk": "/legal/", "privacy.njk": "/privacy/" };
  for (const [file, url] of Object.entries(pages)) {
    const page = read(file);
    assert.match(page, new RegExp("permalink: " + url.replace(/\//g, "\\/")));
    assert.match(page, /<meta name="robots" content="noindex, follow">/);
    assert.match(page, /Zwald Travel Planner Co\., Ltd\./);
    assert.match(page, /292 Moo 2/);
    assert.doesNotMatch(page, /Moo 6|252\/1/, file + " garde l'ancienne adresse");
  }
});

test("aucune page légale ne renvoie vers une version française", () => {
  for (const file of ["terms.njk", "legal.njk", "privacy.njk", "secret.njk", "secret-page.njk", "taxi.njk", "taxi-route.njk"]) {
    assert.doesNotMatch(read(file), /\/(terms|legal|privacy)\/fr\/|hreflang="fr"|Version française/, file);
  }
});

test("plus aucun lien vers les pages légales de Zwald depuis Secret et le taxi", () => {
  for (const file of ["secret.njk", "secret-page.njk", "taxi.njk", "taxi-route.njk", "terms.njk"]) {
    const page = read(file);
    assert.doesNotMatch(page, /zwaldtravelplanner\.com\/(cgv|mentions-legales|politique-confidentialite)\//, file);
  }
  for (const file of ["secret.njk", "secret-page.njk", "taxi.njk", "taxi-route.njk"]) {
    assert.match(read(file), /href="\/legal\/"/, file);
    assert.match(read(file), /href="\/privacy\/"/, file);
  }
});

test("licence TAT renseignée (donnée par Jérémy le 06.11.2026) et affichée sur l'accueil, les conditions et les mentions", () => {
  const secret = JSON.parse(read("_data/secret.json"));
  assert.equal(secret.licence, "34/04000");
  const built = (file) => fs.readFileSync(path.join(__dirname, "..", "_site", file), "utf8");
  for (const file of ["index.html", "terms/index.html", "legal/index.html"]) {
    assert.match(built(file), /34\/04000/, file + " n'affiche pas la licence");
  }
});
