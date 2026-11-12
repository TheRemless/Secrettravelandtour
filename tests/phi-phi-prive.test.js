// Koh Phi Phi en longtail privé (12.11.2026) : 9 400 THB le bateau pour 1 à 5 personnes, sur demande au-delà, programme du flyer,
// « Included » limité à ce que dit le flyer, une offre JSON-LD par option, clé Gestion. Lancer le build avant (lecture de _site/).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const P = require("../src/_data/products/tours/koh-phi-phi.json");
const KEYS = require("../src/_data/gestion-keys.json");
const html = fs.readFileSync(path.join(ROOT, "_site", "tours", "koh-phi-phi", "index.html"), "utf8");
const priv = P.options.find((o) => o.id === "private-longtail");

test("l'option privée : 9 400 THB par bateau pour 1 à 5 personnes, « On request » au-delà, frais de parc en plus", () => {
  assert.equal(priv.kind, "private");
  assert.deepEqual(priv.prices[0], { label: "1 to 5 people", amount: 9400, group: { min: 1, max: 5 }, unit: "per boat" });
  assert.equal(priv.prices[1].text, "On request");
  assert.equal(priv.prices.length, 2);
  assert.deepEqual(priv.notIncludedFees.map((f) => f.amount), [400, 200, 40, 20]);
  assert.match(priv.note, /Children from 4 count/);
  assert.match(priv.note, /when the national park is open/i);
});

test("le calculateur suit la règle : 5 personnes = 9 400, 6 personnes = sur WhatsApp, un enfant de moins de 4 ans ne compte pas", () => {
  const price = require(path.join(ROOT, "src", "js", "v4-price.js"));
  const est = (a, ages) => price.estimate(priv, a, ages, []);
  assert.equal(est(1, []).total, 9400);
  assert.equal(est(5, []).total, 9400);
  assert.equal(est(4, [3]).total, 9400);
  assert.equal(est(4, [4]).total, 9400);
  assert.equal(est(5, [4]), null);
  assert.equal(est(6, []), null);
});

test("« Included » du privé : seulement ce que dit le flyer ; les éléments du speedboat restent sous leur titre", () => {
  assert.deepEqual(P.includedByOption["private-longtail"], ["Hotel pickup and return, by car or by boat", "Thai buffet lunch on Bamboo Island", "Snorkelling at the stops in the programme"]);
  const block = html.split('id="inc-h"')[1].split("</section>")[0];
  const [shared, own] = block.split('<h4 class="inc__for">Private longtail</h4>');
  assert.match(shared, /<h4 class="inc__for">Join-in speedboat<\/h4>/);
  assert.match(shared, /Masks, snorkels and life jackets/);
  assert.match(shared, /Light breakfast at the pier on the join-in speedboat/);
  assert.doesNotMatch(own.split("Not included")[0], /Masks|breakfast|Guide|Insurance|life jackets/i);
  assert.match(own, /Thai buffet lunch on Bamboo Island/);
});

test("le programme du privé a ses horaires approximatifs et la mention de la marée et de la météo", () => {
  const b = P.day.find((x) => x.options.join() === "private-longtail");
  assert.deepEqual(b.steps.map((s) => s.time), ["08:00", "09:00", "10:00", "12:00", "13:30", "14:15"]);
  assert.match(b.note, /approximate/);
  assert.match(b.note, /tide and the weather/);
  assert.match(html, /Times are approximate\. The programme can change with the tide and the weather\./);
});

test("annulation : 12 heures pour les deux formules, sur la fiche et sur /cancellation/", () => {
  assert.match(P.beforeYouBook.cancellation, /^Join-in speedboat and private longtail: .*at least 12 hours/);
  const page = fs.readFileSync(path.join(ROOT, "_site", "cancellation", "index.html"), "utf8");
  assert.match(page, /Join-in speedboat and private longtail: tell us at least 12 hours before departure/);
});

test("JSON-LD : une offre par option, avec son prix « from » (adulte 2 000, bateau 9 400), aucun nom de prestataire", () => {
  const ld = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));
  const trip = ld.flatMap((b) => (b["@graph"] ? b["@graph"] : [b])).find((x) => x["@type"] === "TouristTrip");
  const offers = trip.offers;
  assert.equal(offers.length, 2);
  assert.deepEqual(offers.map((o) => [o.name, o.priceSpecification.minPrice]), [["Join-in speedboat", 2000], ["Private longtail", 9400]]);
  assert.match(offers[1].priceSpecification.description, /per boat/);
  assert.doesNotMatch(JSON.stringify(P) + html, /monkey lanta|monkey-lanta|\+66 ?95 ?540|3179|rattana/i);
});

test("la clé Gestion de la prestation privée existe pour le contrôle mensuel", () => {
  const k = KEYS["koh-phi-phi|Private longtail|1 to 5 people"];
  assert.ok(k, "clé absente");
  assert.equal(k.prestation, "0711f191-fe3b-587f-a28a-db415fd235e7");
});
