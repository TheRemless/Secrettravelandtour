// tests/terms.test.js : conditions de réservation propres à Secret Travel & Tour et VIP Taxi Lanta.
// Zwald garde ses CGV sur zwaldtravelplanner.com (décision de Jérémy du 02.11.2026).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const SRC = path.join(__dirname, "..", "src");
const read = (file) => fs.readFileSync(path.join(SRC, file), "utf8");

test("conditions : version anglaise (qui fait foi) et traduction française, non indexées", () => {
  const en = read("terms.njk");
  const fr = read("terms-fr.njk");
  assert.match(en, /permalink: \/terms\//);
  assert.match(fr, /permalink: \/terms\/fr\//);
  for (const page of [en, fr]) {
    assert.match(page, /<meta name="robots" content="noindex, follow">/);
    assert.match(page, /Zwald Travel Planner Co\., Ltd\./);
    assert.doesNotMatch(page, /booking-terms/);
  }
  assert.match(fr, /la <a href="\/terms\/">version anglaise<\/a> fait foi/);
  assert.equal((en.match(/<h2>/g) || []).length, (fr.match(/<h2>/g) || []).length, "même nombre d'articles");
});

test("conditions : liées depuis l'accueil, les pages /tours/ et les pages taxi, plus vers les CGV de Zwald", () => {
  for (const file of ["secret.njk", "secret-page.njk", "taxi.njk", "taxi-route.njk"]) {
    const page = read(file);
    assert.match(page, /href="\/terms\/"/, file + " ne renvoie pas vers /terms/");
    assert.doesNotMatch(page, /zwaldtravelplanner\.com\/cgv\//, file + " renvoie encore vers les CGV de Zwald");
  }
});

test("mentions légales et confidentialité propres au site, en anglais (qui fait foi) et en français", () => {
  const pages = { "legal.njk": "/legal/", "legal-fr.njk": "/legal/fr/", "privacy.njk": "/privacy/", "privacy-fr.njk": "/privacy/fr/" };
  for (const [file, url] of Object.entries(pages)) {
    const page = read(file);
    assert.match(page, new RegExp("permalink: " + url.replace(/\//g, "\\/")));
    assert.match(page, /<meta name="robots" content="noindex, follow">/);
    assert.match(page, /Zwald Travel Planner Co\., Ltd\./);
    assert.match(page, /292 Moo 2/);
    assert.doesNotMatch(page, /Moo 6|252\/1/, file + " garde l'ancienne adresse");
  }
  assert.equal((read("privacy.njk").match(/<h2>/g) || []).length, (read("privacy-fr.njk").match(/<h2>/g) || []).length);
  assert.equal((read("legal.njk").match(/<h2>/g) || []).length, (read("legal-fr.njk").match(/<h2>/g) || []).length);
});

test("plus aucun lien vers les pages légales de Zwald depuis Secret et le taxi", () => {
  for (const file of ["secret.njk", "secret-page.njk", "taxi.njk", "taxi-route.njk", "terms.njk", "terms-fr.njk"]) {
    const page = read(file);
    assert.doesNotMatch(page, /zwaldtravelplanner\.com\/(cgv|mentions-legales|politique-confidentialite)\//, file);
  }
  for (const file of ["secret.njk", "secret-page.njk", "taxi.njk", "taxi-route.njk"]) {
    assert.match(read(file), /href="\/legal\/"/, file);
    assert.match(read(file), /href="\/privacy\/"/, file);
  }
});
