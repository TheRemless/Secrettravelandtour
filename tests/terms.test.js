// tests/terms.test.js : conditions de réservation propres à Secret Travel & Tour et VIP Taxi Lanta.
// Zwald garde ses CGV sur zwaldtravelplanner.com (décision de Jérémy du 02.11.2026).
// Anglais seulement : les versions /fr/ ont été retirées le 02.11.2026 (301 dans netlify.toml).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "src");
const read = (file) => fs.readFileSync(path.join(SRC, file), "utf8");

test("conditions : version anglaise seule, non indexée", () => {
  const en = read("terms.njk");
  assert.match(en, /permalink: \/terms\//);
  assert.match(en, /<meta name="robots" content="noindex, follow">/);
  assert.match(en, /Zwald Travel Planner Co\., Ltd\./);
  assert.doesNotMatch(en, /booking-terms/);
});

test("conditions : tranches d'âge propres à chaque activité, pas de règle unique", () => {
  assert.doesNotMatch(read("terms.njk"), /Babies are up to 2 years old/);
});

// Pages refaites (étape 3) : leurs liens légaux sont dans les pieds de page des composants stt.njk et vip.njk ;
// pages v4 (accueil, hub, fiches produit) : pied de page de v4.njk (08.11.2026, remplace secret-page.njk).
const REBUILT = ["_includes/components/stt.njk", "_includes/components/vip.njk"];

test("conditions : liées depuis l'accueil, les pages /tours/ et les pages taxi, plus vers les CGV de Zwald", () => {
  for (const file of REBUILT.concat(["_includes/components/v4.njk", "taxi.njk", "taxi-route.njk"])) {
    const page = read(file);
    assert.match(page, /href="\/terms\/"/, file + " ne renvoie pas vers /terms/");
    assert.doesNotMatch(page, /zwaldtravelplanner\.com\/cgv\//, file + " renvoie encore vers les CGV de Zwald");
  }
});

test("mentions légales et confidentialité propres au site, en anglais", () => {
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

test("aucune page en français : ni fichier /fr/, ni hreflang, ni lien « Version française »", () => {
  for (const file of ["terms-fr.njk", "legal-fr.njk", "privacy-fr.njk"]) {
    assert.ok(!fs.existsSync(path.join(SRC, file)), file + " existe encore");
  }
  for (const file of ["terms.njk", "legal.njk", "privacy.njk"]) {
    const page = read(file);
    assert.doesNotMatch(page, /hreflang|\/fr\/|Version française/, file);
  }
  const toml = fs.readFileSync(path.join(ROOT, "netlify.toml"), "utf8");
  for (const p of ["terms", "legal", "privacy"]) {
    assert.match(toml, new RegExp('from = "/' + p + '/fr/\\*"\\s+to = "/' + p + '/"\\s+status = 301'), p + " : 301 manquante");
  }
});

test("plus aucun lien vers les pages légales de Zwald depuis Secret et le taxi", () => {
  for (const file of REBUILT.concat(["_includes/components/v4.njk", "taxi.njk", "taxi-route.njk", "terms.njk"])) {
    const page = read(file);
    assert.doesNotMatch(page, /zwaldtravelplanner\.com\/(cgv|mentions-legales|politique-confidentialite)\//, file);
  }
  for (const file of REBUILT.concat(["_includes/components/v4.njk", "taxi.njk", "taxi-route.njk"])) {
    assert.match(read(file), /href="\/legal\/"/, file);
    assert.match(read(file), /href="\/privacy\/"/, file);
  }
});

test("licence TAT renseignée (donnée par Jérémy le 03.11.2026) et affichée sur l'accueil, les conditions et les mentions", () => {
  const secret = JSON.parse(read("_data/secret.json"));
  assert.equal(secret.licence, "34/04000");
  const built = (file) => fs.readFileSync(path.join(__dirname, "..", "_site", file), "utf8");
  for (const file of ["index.html", "terms/index.html", "legal/index.html"]) {
    assert.match(built(file), /34\/04000/, file + " n'affiche pas la licence");
  }
});
